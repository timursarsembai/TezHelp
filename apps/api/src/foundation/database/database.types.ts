import type { ColumnType, Generated, Insertable, Kysely } from "kysely";

import type { Locale } from "@tezhelp/types";

type TimestampColumn = ColumnType<Date, Date | undefined, Date>;
type JsonColumn = ColumnType<
  Record<string, unknown>,
  Record<string, unknown> | undefined,
  Record<string, unknown>
>;

interface AuditEventsTable {
  readonly id: Generated<string>;
  readonly actor_id: string | null;
  readonly action: string;
  readonly reason: string;
  readonly related_entity_type: string | null;
  readonly related_entity_id: string | null;
  readonly metadata: ColumnType<
    Record<string, unknown>,
    Record<string, unknown> | undefined,
    Record<string, unknown>
  >;
  readonly occurred_at: Generated<Date>;
}

type AccountStatus = "pending_phone" | "active" | "blocked";
export type AuthProvider = "google" | "phone";
export type OtpPurpose = "sign_in" | "phone_completion" | "phone_change";
type UserRole = "customer" | "provider";

interface UsersTable {
  readonly id: Generated<string>;
  readonly preferred_locale: Locale;
  readonly status: AccountStatus;
  readonly selected_role: UserRole;
  readonly verified_phone: string | null;
  readonly phone_verified_at: TimestampColumn | null;
  readonly recent_auth_at: TimestampColumn | null;
  readonly created_at: Generated<Date>;
  readonly updated_at: TimestampColumn;
}

interface AuthIdentityLinksTable {
  readonly id: Generated<string>;
  readonly user_id: string;
  readonly provider: AuthProvider;
  readonly provider_subject: string;
  readonly created_at: Generated<Date>;
}

interface CustomerProfilesTable {
  readonly user_id: string;
  readonly created_at: Generated<Date>;
}

interface ProviderProfilesTable {
  readonly user_id: string;
  readonly activity_score: Generated<number>;
  readonly availability_status: Generated<"inactive" | "available" | "suspended">;
  readonly created_at: Generated<Date>;
}

interface OtpChallengesTable {
  readonly id: Generated<string>;
  readonly user_id: string | null;
  readonly purpose: OtpPurpose;
  readonly phone: string;
  readonly phone_hash: string;
  readonly otp_hash: string;
  readonly request_ip_hash: string;
  readonly attempts_remaining: number;
  readonly expires_at: TimestampColumn;
  readonly resend_available_at: TimestampColumn;
  readonly verified_at: TimestampColumn | null;
  readonly locked_at: TimestampColumn | null;
  readonly created_at: Generated<Date>;
}

interface UserSessionsTable {
  readonly id: Generated<string>;
  readonly user_id: string;
  readonly created_at: Generated<Date>;
  readonly recent_auth_at: TimestampColumn;
  readonly revoked_at: TimestampColumn | null;
}

interface IdentitySecurityEventsTable {
  readonly id: Generated<string>;
  readonly user_id: string | null;
  readonly event_type: string;
  readonly metadata: JsonColumn;
  readonly occurred_at: Generated<Date>;
}

export interface DatabaseSchema {
  readonly audit_events: AuditEventsTable;
  readonly users: UsersTable;
  readonly auth_identity_links: AuthIdentityLinksTable;
  readonly customer_profiles: CustomerProfilesTable;
  readonly provider_profiles: ProviderProfilesTable;
  readonly otp_challenges: OtpChallengesTable;
  readonly user_sessions: UserSessionsTable;
  readonly identity_security_events: IdentitySecurityEventsTable;
}

export type TezHelpDatabase = Kysely<DatabaseSchema>;
export type NewAuditEvent = Insertable<AuditEventsTable>;
