export const supportedLocales = ["ru", "kk", "en"] as const;

export type Locale = (typeof supportedLocales)[number];

export type HealthStatus = "ok" | "degraded" | "error";

export type AccountStatus = "pending_phone" | "active" | "blocked";

export type UserRole = "customer" | "provider";

export interface IdentityUserSummary {
  readonly id: string;
  readonly status: AccountStatus;
  readonly preferredLocale: Locale;
  readonly selectedRole: UserRole;
  readonly verifiedPhone?: string;
  readonly roles: ReadonlyArray<UserRole>;
}

export interface OtpChallengeResponse {
  readonly challengeId: string;
  readonly expiresAt: string;
  readonly resendAvailableAt: string;
}

export interface DependencyHealth {
  readonly status: HealthStatus;
  readonly latencyMs?: number;
  readonly message?: string;
}

export interface HealthResponse {
  readonly status: HealthStatus;
  readonly service: string;
  readonly checkedAt: string;
  readonly dependencies?: Readonly<Record<string, DependencyHealth>>;
}

export interface ApiErrorEnvelope {
  readonly error: {
    readonly code: string;
    readonly messageKey: string;
    readonly details?: Readonly<Record<string, unknown>>;
    readonly correlationId: string;
  };
}

export interface ApiSuccessEnvelope<TData> {
  readonly data: TData;
  readonly correlationId: string;
}
