import { Test } from "@nestjs/testing";
import { Redis } from "ioredis";
import { sql } from "kysely";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { DatabaseService } from "../foundation/database/database.service.js";
import { DevelopmentGoogleSignInUseCase } from "./application/development-google-sign-in.use-case.js";
import { RequestPhoneChangeUseCase } from "./application/request-phone-change.use-case.js";
import { RequestPhoneOtpUseCase } from "./application/request-phone-otp.use-case.js";
import { SwitchRoleUseCase } from "./application/switch-role.use-case.js";
import { UpdateLocaleUseCase } from "./application/update-locale.use-case.js";
import { VerifyPhoneOtpUseCase } from "./application/verify-phone-otp.use-case.js";
import { IdentityApplicationError } from "./domain/identity-errors.js";
import { IdentityModule } from "./identity.module.js";

const hasDockerBackedEnvironment =
  Boolean(process.env.DATABASE_URL) &&
  Boolean(process.env.REDIS_URL) &&
  Boolean(process.env.S3_ENDPOINT) &&
  Boolean(process.env.S3_BUCKET_PRIVATE);

const describeWithInfrastructure = hasDockerBackedEnvironment ? describe : describe.skip;

describeWithInfrastructure("identity integration", () => {
  let closeModule: (() => Promise<void>) | undefined;
  let database: DatabaseService;
  let requestOtp: RequestPhoneOtpUseCase;
  let verifyOtp: VerifyPhoneOtpUseCase;
  let googleSignIn: DevelopmentGoogleSignInUseCase;
  let requestPhoneChange: RequestPhoneChangeUseCase;
  let updateLocale: UpdateLocaleUseCase;
  let switchRole: SwitchRoleUseCase;
  let redis: Redis;

  beforeEach(async () => {
    await closeModule?.();
    redis ??= new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
    await redis.flushdb();
    const moduleRef = await Test.createTestingModule({
      imports: [IdentityModule],
    }).compile();
    closeModule = () => moduleRef.close();

    database = moduleRef.get(DatabaseService);
    requestOtp = moduleRef.get(RequestPhoneOtpUseCase);
    verifyOtp = moduleRef.get(VerifyPhoneOtpUseCase);
    googleSignIn = moduleRef.get(DevelopmentGoogleSignInUseCase);
    requestPhoneChange = moduleRef.get(RequestPhoneChangeUseCase);
    updateLocale = moduleRef.get(UpdateLocaleUseCase);
    switchRole = moduleRef.get(SwitchRoleUseCase);

    await sql`
      truncate table
        identity_security_events,
        user_sessions,
        otp_challenges,
        provider_profiles,
        customer_profiles,
        auth_identity_links,
        users
      cascade
    `.execute(database.db);
  });

  afterAll(async () => {
    redis?.disconnect();
    await closeModule?.();
  });

  it("creates a Google identity that still requires phone completion", async () => {
    const user = await googleSignIn.execute({
      providerSubject: "google-test-1",
      preferredLocale: "ru",
    });

    expect(user.status).toBe("pending_phone");
    expect(user.verifiedPhone).toBeUndefined();
    expect(user.roles).toEqual(["customer", "provider"]);
  });

  it("verifies phone OTP and persists locale and role", async () => {
    const challenge = await requestOtp.execute({
      phone: "+77000000001",
      purpose: "sign_in",
      requestIp: "127.0.0.1",
    });

    const user = await verifyOtp.execute({
      challengeId: challenge.challengeId,
      code: "123456",
      preferredLocale: "kk",
    });
    const localized = await updateLocale.execute(user.id, "en");
    const provider = await switchRole.execute(user.id, "provider");

    expect(user.status).toBe("active");
    expect(user.verifiedPhone).toBe("+77000000001");
    expect(localized.preferredLocale).toBe("en");
    expect(provider.selectedRole).toBe("provider");
  });

  it("expires OTP challenges", async () => {
    const challenge = await requestOtp.execute({
      phone: "+77000000002",
      purpose: "sign_in",
      requestIp: "127.0.0.2",
    });
    await database.db
      .updateTable("otp_challenges")
      .set({ expires_at: new Date(Date.now() - 1_000) })
      .where("id", "=", challenge.challengeId)
      .execute();

    await expect(
      verifyOtp.execute({
        challengeId: challenge.challengeId,
        code: "123456",
        preferredLocale: "ru",
      }),
    ).rejects.toMatchObject({ code: "OTP_EXPIRED" });
  });

  it("locks OTP after invalid attempts", async () => {
    const challenge = await requestOtp.execute({
      phone: "+77000000003",
      purpose: "sign_in",
      requestIp: "127.0.0.3",
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        verifyOtp.execute({
          challengeId: challenge.challengeId,
          code: "000000",
          preferredLocale: "ru",
        }),
      ).rejects.toBeInstanceOf(IdentityApplicationError);
    }

    await expect(
      verifyOtp.execute({
        challengeId: challenge.challengeId,
        code: "123456",
        preferredLocale: "ru",
      }),
    ).rejects.toMatchObject({ code: "OTP_LOCKED" });
  });

  it("rate-limits repeated OTP requests", async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        await requestOtp.execute({
          phone: "+77000000010",
          purpose: "sign_in",
          requestIp: "127.0.0.10",
        });
      } catch (error) {
        lastError = error;
      }
    }

    expect(lastError).toMatchObject({ code: "OTP_RATE_LIMITED" });
  });

  it("prevents duplicate active verified phones", async () => {
    const first = await requestOtp.execute({
      phone: "+77000000004",
      purpose: "sign_in",
      requestIp: "127.0.0.4",
    });
    await verifyOtp.execute({
      challengeId: first.challengeId,
      code: "123456",
      preferredLocale: "ru",
    });
    const googleUser = await googleSignIn.execute({
      providerSubject: "google-test-duplicate",
      preferredLocale: "ru",
    });
    const duplicate = await requestOtp.execute({
      phone: "+77000000004",
      purpose: "phone_completion",
      requestIp: "127.0.0.5",
      userId: googleUser.id,
    });

    await expect(
      verifyOtp.execute({
        challengeId: duplicate.challengeId,
        code: "123456",
        preferredLocale: "ru",
        userId: googleUser.id,
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE_VERIFIED_PHONE" });
  });

  it("requires recent authentication before phone change", async () => {
    const challenge = await requestOtp.execute({
      phone: "+77000000006",
      purpose: "sign_in",
      requestIp: "127.0.0.6",
    });
    const user = await verifyOtp.execute({
      challengeId: challenge.challengeId,
      code: "123456",
      preferredLocale: "ru",
    });

    await database.db
      .updateTable("users")
      .set({ recent_auth_at: new Date(Date.now() - 60 * 60 * 1_000) })
      .where("id", "=", user.id)
      .execute();

    await expect(
      requestPhoneChange.execute({
        userId: user.id,
        newPhone: "+77000000007",
        requestIp: "127.0.0.7",
      }),
    ).rejects.toMatchObject({ code: "PHONE_CHANGE_REQUIRES_RECENT_AUTH" });
  });

  it("prevents a user from verifying another user's phone-change challenge", async () => {
    const firstChallenge = await requestOtp.execute({
      phone: "+77000000011",
      purpose: "sign_in",
      requestIp: "127.0.0.11",
    });
    const firstUser = await verifyOtp.execute({
      challengeId: firstChallenge.challengeId,
      code: "123456",
      preferredLocale: "ru",
    });
    const secondChallenge = await requestOtp.execute({
      phone: "+77000000012",
      purpose: "sign_in",
      requestIp: "127.0.0.12",
    });
    const secondUser = await verifyOtp.execute({
      challengeId: secondChallenge.challengeId,
      code: "123456",
      preferredLocale: "ru",
    });
    const change = await requestPhoneChange.execute({
      userId: firstUser.id,
      newPhone: "+77000000013",
      requestIp: "127.0.0.13",
    });

    await expect(
      verifyOtp.execute({
        challengeId: change.challengeId,
        code: "123456",
        preferredLocale: "ru",
        userId: secondUser.id,
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED_IDENTITY_USER" });
  });

  it("changes phone after recent authentication and audits the event", async () => {
    const challenge = await requestOtp.execute({
      phone: "+77000000008",
      purpose: "sign_in",
      requestIp: "127.0.0.8",
    });
    const user = await verifyOtp.execute({
      challengeId: challenge.challengeId,
      code: "123456",
      preferredLocale: "ru",
    });
    const change = await requestPhoneChange.execute({
      userId: user.id,
      newPhone: "+77000000009",
      requestIp: "127.0.0.9",
    });

    const changed = await verifyOtp.execute({
      challengeId: change.challengeId,
      code: "123456",
      preferredLocale: "ru",
      userId: user.id,
    });
    const event = await database.db
      .selectFrom("identity_security_events")
      .select(["event_type"])
      .where("user_id", "=", user.id)
      .where("event_type", "=", "identity.phone.changed")
      .executeTakeFirst();

    expect(changed.verifiedPhone).toBe("+77000000009");
    expect(event?.event_type).toBe("identity.phone.changed");
  });
});
