import type { AppConfigService } from "../../foundation/configuration/app-config.service.js";
import { IdentityApplicationError } from "./identity-errors.js";

export interface OtpPolicyConfig {
  readonly ttlSeconds: number;
  readonly resendCooldownSeconds: number;
  readonly maxAttempts: number;
  readonly phoneRateLimitPerHour: number;
  readonly ipRateLimitPerHour: number;
}

export function readOtpPolicy(config: AppConfigService): OtpPolicyConfig {
  const identity = config.identity;
  return {
    ttlSeconds: identity.otpTtlSeconds,
    resendCooldownSeconds: identity.otpResendCooldownSeconds,
    maxAttempts: identity.otpMaxAttempts,
    phoneRateLimitPerHour: identity.otpPhoneRateLimitPerHour,
    ipRateLimitPerHour: identity.otpIpRateLimitPerHour,
  };
}

export function assertDevelopmentOtpAllowed(config: AppConfigService): void {
  if (config.identity.otpAdapter !== "development" || config.identity.nodeEnv === "production") {
    throw new IdentityApplicationError(
      "DEVELOPMENT_OTP_DISABLED",
      "Development OTP is disabled",
      503,
    );
  }
}
