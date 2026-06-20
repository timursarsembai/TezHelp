import { Inject, Injectable } from "@nestjs/common";

import type { IdentityUserSummary, Locale } from "@tezhelp/types";

import { IdentityApplicationError } from "../domain/identity-errors.js";
import { IdentityHashingService } from "../infrastructure/identity-hashing.service.js";
import type { UserRecord } from "../infrastructure/identity.repository.js";
import { IdentityRepository } from "../infrastructure/identity.repository.js";
import { presentIdentityUser } from "./identity-presenter.js";
import type { Clock } from "./ports/clock.port.js";
import { IDENTITY_CLOCK } from "../identity.tokens.js";

export interface VerifyPhoneOtpInput {
  readonly challengeId: string;
  readonly code: string;
  readonly preferredLocale: Locale;
  readonly userId?: string;
}

type VerifyOtpResult =
  | { readonly kind: "success"; readonly user: UserRecord }
  | { readonly kind: "failure"; readonly error: IdentityApplicationError };

@Injectable()
export class VerifyPhoneOtpUseCase {
  constructor(
    private readonly repository: IdentityRepository,
    private readonly hashing: IdentityHashingService,
    @Inject(IDENTITY_CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(input: VerifyPhoneOtpInput): Promise<IdentityUserSummary> {
    const now = this.clock.now();

    const result = await this.handleDuplicatePhone(async () =>
      this.repository.transaction(async (trx) => {
        const challenge = await this.repository.findOtpForUpdate(trx, input.challengeId);
        if (!challenge || challenge.verifiedAt || challenge.lockedAt) {
          throw new IdentityApplicationError("OTP_LOCKED", "OTP challenge is not usable", 400);
        }

        if (challenge.expiresAt <= now) {
          await this.repository.decrementOtpAttempts(trx, challenge.id, 0, now);
          return {
            kind: "failure",
            error: new IdentityApplicationError("OTP_EXPIRED", "OTP challenge expired", 400),
          } satisfies VerifyOtpResult;
        }

        if (!this.hashing.verifyOtp(challenge.phone, input.code, challenge.otpHash)) {
          const remaining = Math.max(challenge.attemptsRemaining - 1, 0);
          await this.repository.decrementOtpAttempts(
            trx,
            challenge.id,
            remaining,
            remaining === 0 ? now : null,
          );
          return {
            kind: "failure",
            error: new IdentityApplicationError("INVALID_OTP", "Invalid OTP", 400),
          } satisfies VerifyOtpResult;
        }

        await this.repository.verifyOtpChallenge(trx, challenge.id, now);

        if (challenge.purpose === "phone_completion" || challenge.purpose === "phone_change") {
          if (!challenge.userId) {
            throw new IdentityApplicationError(
              "UNAUTHORIZED_IDENTITY_USER",
              "User is required",
              401,
            );
          }
          if (input.userId && input.userId !== challenge.userId) {
            throw new IdentityApplicationError(
              "UNAUTHORIZED_IDENTITY_USER",
              "OTP challenge belongs to another user",
              403,
            );
          }

          const completed = await this.repository.completePhoneForUser(
            trx,
            challenge.userId,
            challenge.phone,
            now,
          );
          await this.repository.createSecurityEvent(
            trx,
            completed.id,
            challenge.purpose === "phone_change"
              ? "identity.phone.changed"
              : "identity.phone.completed",
            { phoneChanged: challenge.purpose === "phone_change" },
          );
          return { kind: "success", user: completed } satisfies VerifyOtpResult;
        }

        const signedIn = await this.repository.signInWithPhone(
          trx,
          challenge.phone,
          input.preferredLocale,
          now,
        );
        await this.repository.createSecurityEvent(trx, signedIn.id, "identity.phone.signed_in", {});
        return { kind: "success", user: signedIn } satisfies VerifyOtpResult;
      }),
    );

    if (result.kind === "failure") {
      throw result.error;
    }

    return presentIdentityUser(result.user);
  }

  private async handleDuplicatePhone<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await callback();
    } catch (error) {
      if (hasPgErrorCode(error, "23505")) {
        throw new IdentityApplicationError(
          "DUPLICATE_VERIFIED_PHONE",
          "Phone is already linked to an active account",
          409,
        );
      }

      throw error;
    }
  }
}

function hasPgErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code?: unknown }).code === code
  );
}
