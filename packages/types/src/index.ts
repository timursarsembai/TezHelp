export const supportedLocales = ["ru", "kk", "en"] as const;

export type Locale = (typeof supportedLocales)[number];

export type HealthStatus = "ok" | "degraded" | "error";

export type AccountStatus = "pending_phone" | "active" | "blocked";

export type UserRole = "customer" | "provider";

export const serviceCategorySlugs = [
  "jump_start",
  "engine_start_assistance",
  "wheel_replacement",
  "wheel_inflation",
  "mobile_tire_service",
  "fuel_delivery",
  "tow_truck",
  "vehicle_unlocking",
] as const;

export type ServiceCategorySlug = (typeof serviceCategorySlugs)[number];

export type ProviderTaxStatus = "individual_entrepreneur" | "self_employed_special_tax";

export type ProviderModerationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended";

export type ProviderGeneralDocumentType = "face_photo" | "identity_document";

export interface ServiceCategorySummary {
  readonly slug: ServiceCategorySlug;
  readonly enabled: boolean;
  readonly name: string;
  readonly description: string;
  readonly allowedTaxStatuses: ReadonlyArray<ProviderTaxStatus>;
  readonly requiredDocuments: ReadonlyArray<ServiceCategoryDocumentRule>;
}

export interface ServiceCategoryDocumentRule {
  readonly id: string;
  readonly categorySlug: ServiceCategorySlug;
  readonly documentType: string;
  readonly label: string;
  readonly required: boolean;
  readonly allowedMimeTypes: ReadonlyArray<string>;
  readonly maxSizeBytes: number;
}

export interface ProviderProfileSummary {
  readonly userId: string;
  readonly displayName?: string;
  readonly iin?: string;
  readonly city?: string;
  readonly taxStatus?: ProviderTaxStatus;
  readonly generalDocumentVersion: number;
}

export interface ProviderDocumentSummary {
  readonly id: string;
  readonly documentType: string;
  readonly originalFilename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly documentVersion: number;
  readonly createdAt: string;
}

export interface ProviderServiceProfileSummary {
  readonly id: string;
  readonly providerUserId: string;
  readonly categorySlug: ServiceCategorySlug;
  readonly categoryName: string;
  readonly moderationStatus: ProviderModerationStatus;
  readonly submittedAt?: string;
  readonly slaDeadlineAt?: string;
  readonly decidedAt?: string;
  readonly decisionReason?: string;
  readonly suspendedAt?: string;
  readonly suspensionReason?: string;
  readonly documentVersion: number;
  readonly ratingAverage?: string;
  readonly ratingCount: number;
  readonly completedOrderCount: number;
  readonly cancellationCount: number;
  readonly documents: ReadonlyArray<ProviderDocumentSummary>;
}

export interface ProviderModerationEventSummary {
  readonly id: string;
  readonly serviceProfileId: string;
  readonly actorUserId?: string;
  readonly action: string;
  readonly fromStatus?: ProviderModerationStatus;
  readonly toStatus: ProviderModerationStatus;
  readonly reason?: string;
  readonly documentVersion: number;
  readonly occurredAt: string;
}

export interface ProviderModerationQueueItem {
  readonly serviceProfile: ProviderServiceProfileSummary;
  readonly provider: ProviderProfileSummary;
  readonly overdue: boolean;
}

export interface SignedDocumentUrlResponse {
  readonly url: string;
  readonly expiresAt: string;
}

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
