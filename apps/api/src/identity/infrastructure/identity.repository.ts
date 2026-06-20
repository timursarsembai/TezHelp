import { Injectable } from "@nestjs/common";
import type { Transaction } from "kysely";

import type { Locale, UserRole } from "@tezhelp/types";

import { DatabaseService } from "../../foundation/database/database.service.js";
import type {
  AuthProvider,
  DatabaseSchema,
  OtpPurpose,
} from "../../foundation/database/database.types.js";

export interface UserRecord {
  readonly id: string;
  readonly status: "pending_phone" | "active" | "blocked";
  readonly preferredLocale: Locale;
  readonly selectedRole: UserRole;
  readonly verifiedPhone: string | null;
  readonly recentAuthAt: Date | null;
}

export interface OtpChallengeRecord {
  readonly id: string;
  readonly userId: string | null;
  readonly purpose: OtpPurpose;
  readonly phone: string;
  readonly otpHash: string;
  readonly attemptsRemaining: number;
  readonly expiresAt: Date;
  readonly resendAvailableAt: Date;
  readonly verifiedAt: Date | null;
  readonly lockedAt: Date | null;
}

export interface CreateOtpChallengeInput {
  readonly userId?: string;
  readonly purpose: OtpPurpose;
  readonly phone: string;
  readonly phoneHash: string;
  readonly otpHash: string;
  readonly requestIpHash: string;
  readonly attemptsRemaining: number;
  readonly expiresAt: Date;
  readonly resendAvailableAt: Date;
}

@Injectable()
export class IdentityRepository {
  constructor(private readonly database: DatabaseService) {}

  async transaction<T>(callback: (trx: Transaction<DatabaseSchema>) => Promise<T>): Promise<T> {
    return this.database.transaction(callback);
  }

  async findLatestOtp(phoneHash: string, purpose: OtpPurpose): Promise<OtpChallengeRecord | null> {
    const row = await this.database.db
      .selectFrom("otp_challenges")
      .selectAll()
      .where("phone_hash", "=", phoneHash)
      .where("purpose", "=", purpose)
      .orderBy("created_at", "desc")
      .limit(1)
      .executeTakeFirst();

    return row ? this.toOtpChallengeRecord(row) : null;
  }

  async createOtpChallenge(input: CreateOtpChallengeInput): Promise<OtpChallengeRecord> {
    const row = await this.database.db
      .insertInto("otp_challenges")
      .values({
        user_id: input.userId ?? null,
        purpose: input.purpose,
        phone: input.phone,
        phone_hash: input.phoneHash,
        otp_hash: input.otpHash,
        request_ip_hash: input.requestIpHash,
        attempts_remaining: input.attemptsRemaining,
        expires_at: input.expiresAt,
        resend_available_at: input.resendAvailableAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.toOtpChallengeRecord(row);
  }

  async findUserById(userId: string): Promise<UserRecord | null> {
    const row = await this.database.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", userId)
      .executeTakeFirst();

    return row ? this.toUserRecord(row) : null;
  }

  async updateLocale(userId: string, locale: Locale): Promise<UserRecord | null> {
    const row = await this.database.db
      .updateTable("users")
      .set({ preferred_locale: locale, updated_at: new Date() })
      .where("id", "=", userId)
      .returningAll()
      .executeTakeFirst();

    return row ? this.toUserRecord(row) : null;
  }

  async switchRole(userId: string, role: UserRole): Promise<UserRecord | null> {
    const row = await this.database.db
      .updateTable("users")
      .set({ selected_role: role, updated_at: new Date() })
      .where("id", "=", userId)
      .returningAll()
      .executeTakeFirst();

    return row ? this.toUserRecord(row) : null;
  }

  async createSecurityEvent(
    trx: Transaction<DatabaseSchema>,
    userId: string | null,
    eventType: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await trx
      .insertInto("identity_security_events")
      .values({ user_id: userId, event_type: eventType, metadata })
      .execute();
    await trx
      .insertInto("audit_events")
      .values({
        actor_id: userId,
        action: eventType,
        reason: "identity_security_event",
        related_entity_type: "user",
        related_entity_id: userId,
        metadata,
      })
      .execute();
  }

  async verifyOtpChallenge(
    trx: Transaction<DatabaseSchema>,
    challengeId: string,
    verifiedAt: Date,
  ): Promise<void> {
    await trx
      .updateTable("otp_challenges")
      .set({ verified_at: verifiedAt })
      .where("id", "=", challengeId)
      .execute();
  }

  async decrementOtpAttempts(
    trx: Transaction<DatabaseSchema>,
    challengeId: string,
    attemptsRemaining: number,
    lockedAt: Date | null,
  ): Promise<void> {
    await trx
      .updateTable("otp_challenges")
      .set({ attempts_remaining: attemptsRemaining, locked_at: lockedAt })
      .where("id", "=", challengeId)
      .execute();
  }

  async completePhoneForUser(
    trx: Transaction<DatabaseSchema>,
    userId: string,
    phone: string,
    now: Date,
  ): Promise<UserRecord> {
    const row = await trx
      .updateTable("users")
      .set({
        status: "active",
        verified_phone: phone,
        phone_verified_at: now,
        recent_auth_at: now,
        updated_at: now,
      })
      .where("id", "=", userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.ensureRoleProfiles(trx, userId);
    await this.ensureIdentityLink(trx, userId, "phone", phone);
    return this.toUserRecord(row);
  }

  async signInWithPhone(
    trx: Transaction<DatabaseSchema>,
    phone: string,
    locale: Locale,
    now: Date,
  ): Promise<UserRecord> {
    const existing = await trx
      .selectFrom("users")
      .selectAll()
      .where("verified_phone", "=", phone)
      .where("status", "<>", "blocked")
      .executeTakeFirst();

    if (existing) {
      const updated = await trx
        .updateTable("users")
        .set({ recent_auth_at: now, updated_at: now })
        .where("id", "=", existing.id)
        .returningAll()
        .executeTakeFirstOrThrow();

      return this.toUserRecord(updated);
    }

    const created = await trx
      .insertInto("users")
      .values({
        preferred_locale: locale,
        status: "active",
        selected_role: "customer",
        verified_phone: phone,
        phone_verified_at: now,
        recent_auth_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.ensureRoleProfiles(trx, created.id);
    await this.ensureIdentityLink(trx, created.id, "phone", phone);
    return this.toUserRecord(created);
  }

  async signInWithDevelopmentGoogle(
    providerSubject: string,
    locale: Locale,
    now: Date,
  ): Promise<UserRecord> {
    return this.database.transaction(async (trx) => {
      const existingLink = await trx
        .selectFrom("auth_identity_links")
        .innerJoin("users", "users.id", "auth_identity_links.user_id")
        .selectAll("users")
        .where("auth_identity_links.provider", "=", "google")
        .where("auth_identity_links.provider_subject", "=", providerSubject)
        .executeTakeFirst();

      if (existingLink) {
        const updated = await trx
          .updateTable("users")
          .set({ recent_auth_at: now, updated_at: now })
          .where("id", "=", existingLink.id)
          .returningAll()
          .executeTakeFirstOrThrow();
        await this.createSecurityEvent(trx, updated.id, "identity.google.signed_in", {
          phoneVerified: Boolean(updated.verified_phone),
        });
        return this.toUserRecord(updated);
      }

      const created = await trx
        .insertInto("users")
        .values({
          preferred_locale: locale,
          status: "pending_phone",
          selected_role: "customer",
          recent_auth_at: now,
          updated_at: now,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await this.ensureRoleProfiles(trx, created.id);
      await this.ensureIdentityLink(trx, created.id, "google", providerSubject);
      await this.createSecurityEvent(trx, created.id, "identity.google.linked", {
        phoneVerified: false,
      });
      return this.toUserRecord(created);
    });
  }

  async findOtpForUpdate(
    trx: Transaction<DatabaseSchema>,
    challengeId: string,
  ): Promise<OtpChallengeRecord | null> {
    const row = await trx
      .selectFrom("otp_challenges")
      .selectAll()
      .where("id", "=", challengeId)
      .forUpdate()
      .executeTakeFirst();

    return row ? this.toOtpChallengeRecord(row) : null;
  }

  private async ensureRoleProfiles(
    trx: Transaction<DatabaseSchema>,
    userId: string,
  ): Promise<void> {
    await trx
      .insertInto("customer_profiles")
      .values({ user_id: userId })
      .onConflict((oc) => oc.column("user_id").doNothing())
      .execute();
    await trx
      .insertInto("provider_profiles")
      .values({ user_id: userId })
      .onConflict((oc) => oc.column("user_id").doNothing())
      .execute();
  }

  private async ensureIdentityLink(
    trx: Transaction<DatabaseSchema>,
    userId: string,
    provider: AuthProvider,
    providerSubject: string,
  ): Promise<void> {
    await trx
      .insertInto("auth_identity_links")
      .values({ user_id: userId, provider, provider_subject: providerSubject })
      .onConflict((oc) => oc.columns(["provider", "provider_subject"]).doNothing())
      .execute();
  }

  private toUserRecord(row: {
    id: string;
    status: "pending_phone" | "active" | "blocked";
    preferred_locale: Locale;
    selected_role: UserRole;
    verified_phone: string | null;
    recent_auth_at: Date | null;
  }): UserRecord {
    return {
      id: row.id,
      status: row.status,
      preferredLocale: row.preferred_locale,
      selectedRole: row.selected_role,
      verifiedPhone: row.verified_phone,
      recentAuthAt: row.recent_auth_at,
    };
  }

  private toOtpChallengeRecord(row: {
    id: string;
    user_id: string | null;
    purpose: OtpPurpose;
    phone: string;
    otp_hash: string;
    attempts_remaining: number;
    expires_at: Date;
    resend_available_at: Date;
    verified_at: Date | null;
    locked_at: Date | null;
  }): OtpChallengeRecord {
    return {
      id: row.id,
      userId: row.user_id,
      purpose: row.purpose,
      phone: row.phone,
      otpHash: row.otp_hash,
      attemptsRemaining: row.attempts_remaining,
      expiresAt: row.expires_at,
      resendAvailableAt: row.resend_available_at,
      verifiedAt: row.verified_at,
      lockedAt: row.locked_at,
    };
  }
}
