import { Inject, Injectable } from "@nestjs/common";

import type { OtpChallengeResponse } from "@tezhelp/types";

import { AppConfigService } from "../../foundation/configuration/app-config.service.js";
import type { OtpPurpose } from "../../foundation/database/database.types.js";
import type { Clock } from "./ports/clock.port.js";
import type { OtpDeliveryPort } from "./ports/otp-delivery.port.js";
import type { RateLimitPort } from "./ports/rate-limit.port.js";
import { IDENTITY_CLOCK, IDENTITY_RATE_LIMIT, OTP_DELIVERY } from "../identity.tokens.js";
import { IdentityHashingService } from "../infrastructure/identity-hashing.service.js";
import type { CreateOtpChallengeInput } from "../infrastructure/identity.repository.js";
import { IdentityRepository } from "../infrastructure/identity.repository.js";
import { IdentityApplicationError } from "../domain/identity-errors.js";
import { assertDevelopmentOtpAllowed, readOtpPolicy } from "../domain/otp-policy.js";
import { normalizePhoneNumber } from "../domain/phone-number.js";

export interface RequestPhoneOtpInput {
  readonly phone: string;
  readonly purpose: OtpPurpose;
  readonly requestIp: string;
  readonly userId?: string;
}

@Injectable()
export class RequestPhoneOtpUseCase {
  constructor(
    private readonly config: AppConfigService,
    private readonly repository: IdentityRepository,
    private readonly hashing: IdentityHashingService,
    @Inject(IDENTITY_RATE_LIMIT)
    private readonly rateLimit: RateLimitPort,
    @Inject(OTP_DELIVERY)
    private readonly otpDelivery: OtpDeliveryPort,
    @Inject(IDENTITY_CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(input: RequestPhoneOtpInput): Promise<OtpChallengeResponse> {
    assertDevelopmentOtpAllowed(this.config);

    const policy = readOtpPolicy(this.config);
    const phone = normalizePhoneNumber(input.phone);
    const now = this.clock.now();
    const phoneHash = this.hashing.hashSecret(`phone:${phone}`);
    const requestIpHash = this.hashing.hashSecret(`ip:${input.requestIp}`);

    await this.assertWithinRateLimit(
      `identity:otp:phone:${phoneHash}`,
      policy.phoneRateLimitPerHour,
    );
    await this.assertWithinRateLimit(`identity:otp:ip:${requestIpHash}`, policy.ipRateLimitPerHour);

    const latest = await this.repository.findLatestOtp(phoneHash, input.purpose);
    if (
      latest &&
      latest.verifiedAt === null &&
      latest.lockedAt === null &&
      latest.resendAvailableAt > now
    ) {
      throw new IdentityApplicationError(
        "OTP_RESEND_COOLDOWN",
        "OTP resend cooldown is active",
        429,
      );
    }

    const expiresAt = new Date(now.getTime() + policy.ttlSeconds * 1_000);
    const resendAvailableAt = new Date(now.getTime() + policy.resendCooldownSeconds * 1_000);
    const code = this.config.identity.developmentOtp;
    const challengeInput: CreateOtpChallengeInput = {
      purpose: input.purpose,
      phone,
      phoneHash,
      otpHash: this.hashing.hashOtp(phone, code),
      requestIpHash,
      attemptsRemaining: policy.maxAttempts,
      expiresAt,
      resendAvailableAt,
    };
    const challenge = await this.repository.createOtpChallenge(
      input.userId ? { ...challengeInput, userId: input.userId } : challengeInput,
    );

    await this.otpDelivery.sendOtp({ phone, code });

    return {
      challengeId: challenge.id,
      expiresAt: challenge.expiresAt.toISOString(),
      resendAvailableAt: challenge.resendAvailableAt.toISOString(),
    };
  }

  private async assertWithinRateLimit(key: string, limit: number): Promise<void> {
    const allowed = await this.rateLimit.hit(key, limit, 60 * 60);
    if (!allowed) {
      throw new IdentityApplicationError("OTP_RATE_LIMITED", "OTP rate limit exceeded", 429);
    }
  }
}
