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

export type CommissionStrategy = "percentage" | "fixed" | "combined" | "zero";

export type OrderStatus =
  | "draft"
  | "published"
  | "receiving_offers"
  | "provider_selected"
  | "provider_en_route"
  | "provider_arrived"
  | "in_progress"
  | "completed"
  | "cancelled_by_customer"
  | "cancelled_by_provider"
  | "cancelled_by_admin"
  | "disputed";

export type OfferStatus = "active" | "accepted" | "unavailable" | "retracted";

export type WalletLedgerEntryType =
  | "manual_credit"
  | "manual_debit_correction"
  | "response_fee_charge"
  | "response_fee_reversal"
  | "commission_reserve"
  | "commission_release"
  | "commission_capture";

export type CommissionReservationState = "reserved" | "captured" | "released" | "held_for_review";

export type ChatSenderRole = "customer" | "provider" | "admin" | "system";

export type ChatMessageType = "text" | "attachment" | "system";

export type ChatAttachmentKind = "photo" | "voice";

export type LiveLocationTrackingState = "active" | "stopped";

export type LiveLocationVisibilityState = "hidden" | "waiting" | "current" | "stale" | "offline";

export type ReviewDirection = "customer_to_provider" | "provider_to_customer";

export type ProviderSanctionType = "temporary_block" | "indefinite_block" | "manual_restriction";

export type ProviderSanctionAppealStatus = "none" | "submitted" | "accepted" | "rejected";

export type ProviderSanctionEventType =
  | "applied"
  | "appealed"
  | "lifted"
  | "appeal_accepted"
  | "appeal_rejected";

export type MonitoringEventSeverity = "error" | "warning";

export type FrontendMonitoringSource = "web" | "admin";

export type ProviderGeneralDocumentType = "face_photo" | "identity_document";

export interface ServiceCategorySummary {
  readonly slug: ServiceCategorySlug;
  readonly enabled: boolean;
  readonly name: string;
  readonly description: string;
  readonly commercialConfig: ServiceCategoryCommercialConfig;
  readonly allowedTaxStatuses: ReadonlyArray<ProviderTaxStatus>;
  readonly requiredDocuments: ReadonlyArray<ServiceCategoryDocumentRule>;
}

export interface ServiceCategoryCommercialConfig {
  readonly responseFeeKzt: number;
  readonly commissionStrategy: CommissionStrategy;
  readonly commissionPercentageBps: number;
  readonly commissionFixedKzt: number;
  readonly operationalMinimumKzt: number;
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
  readonly generalDocuments?: ReadonlyArray<ProviderDocumentSummary>;
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

export interface ProviderModerationDetail {
  readonly provider: ProviderProfileSummary;
  readonly serviceProfile: ProviderServiceProfileSummary;
  readonly history: ReadonlyArray<ProviderModerationEventSummary>;
}

export interface SignedDocumentUrlResponse {
  readonly url: string;
  readonly expiresAt: string;
}

export interface OrderImageSummary {
  readonly id: string;
  readonly originalFilename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly sortOrder: number;
}

export interface OrderSummary {
  readonly id: string;
  readonly customerUserId: string;
  readonly categorySlug: ServiceCategorySlug;
  readonly status: OrderStatus;
  readonly city: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly addressLandmark: string;
  readonly vehicleMake?: string;
  readonly vehicleModel?: string;
  readonly vehicleYear?: number;
  readonly description: string;
  readonly acceptedPriceKzt?: number;
  readonly assignedProviderUserId?: string;
  readonly assignedProviderServiceProfileId?: string;
  readonly selectedOfferId?: string;
  readonly commissionReservationId?: string;
  readonly offerCount: number;
  readonly images: ReadonlyArray<OrderImageSummary>;
  readonly createdAt: string;
  readonly publishedAt: string;
  readonly selectedAt?: string;
  readonly departedAt?: string;
  readonly arrivedAt?: string;
  readonly workStartedAt?: string;
  readonly completedAt?: string;
  readonly cancelledAt?: string;
  readonly cancellationReason?: string;
}

export interface OrderContactSummary {
  readonly orderId: string;
  readonly viewerRole: "customer" | "provider";
  readonly contactVisible: boolean;
  readonly customerPhone?: string;
  readonly providerPhone?: string;
}

export interface ProviderOrderDiscoveryPreference {
  readonly nearbyEnabled: boolean;
  readonly radiusMeters: number;
  readonly referenceLatitude: number;
  readonly referenceLongitude: number;
}

export interface ProviderOrderDiscoveryItem {
  readonly order: OrderSummary;
  readonly providerServiceProfileId: string;
  readonly offerCount: number;
  readonly distanceMeters?: number;
}

export interface OfferSummary {
  readonly id: string;
  readonly orderId: string;
  readonly providerUserId: string;
  readonly providerServiceProfileId: string;
  readonly priceKzt: number;
  readonly arrivalMinutes: number;
  readonly comment: string;
  readonly status: OfferStatus;
  readonly responseFeeKzt: number;
  readonly freeResponseCreditUsed: boolean;
  readonly offerCountBeforeSubmission?: number;
  readonly createdAt: string;
}

export interface WalletSummary {
  readonly providerUserId: string;
  readonly availableBalanceKzt: number;
  readonly reservedBalanceKzt: number;
  readonly freeResponsesRemaining: number;
}

export interface WalletLedgerEntrySummary {
  readonly id: string;
  readonly providerUserId: string;
  readonly entryType: WalletLedgerEntryType;
  readonly amountKzt: number;
  readonly availableDeltaKzt: number;
  readonly reservedDeltaKzt: number;
  readonly resultingAvailableBalanceKzt: number;
  readonly resultingReservedBalanceKzt: number;
  readonly reason: string;
  readonly relatedOrderId?: string;
  readonly relatedOfferId?: string;
  readonly relatedCommissionReservationId?: string;
  readonly createdAt: string;
}

export interface CommissionReservationSummary {
  readonly id: string;
  readonly orderId: string;
  readonly offerId: string;
  readonly providerUserId: string;
  readonly amountKzt: number;
  readonly state: CommissionReservationState;
}

export interface ChatAttachmentSummary {
  readonly id: string;
  readonly messageId: string;
  readonly kind: ChatAttachmentKind;
  readonly originalFilename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly durationSeconds?: number;
  readonly createdAt: string;
}

export interface ChatMessageSummary {
  readonly id: string;
  readonly orderId: string;
  readonly senderUserId?: string;
  readonly senderRole: ChatSenderRole;
  readonly messageType: ChatMessageType;
  readonly textBody?: string;
  readonly systemEventType?: string;
  readonly deliveredAt: string;
  readonly createdAt: string;
  readonly attachment?: ChatAttachmentSummary;
}

export interface OrderConversationSummary {
  readonly orderId: string;
  readonly disputeEvidenceNotice: string;
  readonly messages: ReadonlyArray<ChatMessageSummary>;
}

export interface ChatAttachmentAccessUrlResponse {
  readonly url: string;
  readonly expiresAt: string;
}

export interface LiveLocationPoint {
  readonly latitude: number;
  readonly longitude: number;
}

export interface LiveProviderLocationPoint extends LiveLocationPoint {
  readonly accuracyMeters: number;
  readonly recordedAt: string;
  readonly sequence: number;
  readonly resumed: boolean;
}

export interface LiveLocationSnapshot {
  readonly orderId: string;
  readonly providerUserId?: string;
  readonly visible: boolean;
  readonly visibilityState: LiveLocationVisibilityState;
  readonly trackingState?: LiveLocationTrackingState;
  readonly customerPoint?: LiveLocationPoint;
  readonly providerPoint?: LiveProviderLocationPoint;
  readonly staleAfterSeconds: number;
  readonly pollAfterMs: number;
  readonly resumeRequired: boolean;
  readonly routeRebuildRequired: boolean;
}

export interface OrderReviewSummary {
  readonly id: string;
  readonly orderId: string;
  readonly direction: ReviewDirection;
  readonly reviewerUserId: string;
  readonly revieweeUserId: string;
  readonly providerServiceProfileId?: string;
  readonly rating: number;
  readonly comment?: string;
  readonly createdAt: string;
}

export interface CustomerReliabilitySummary {
  readonly customerUserId: string;
  readonly totalPublishedOrders: number;
  readonly completedOrders: number;
  readonly cancelledByCustomerOrders: number;
  readonly cancellationsBeforeSelection: number;
  readonly cancellationsAfterSelection: number;
  readonly cancellationsAfterDeparture: number;
  readonly cancellationsAfterArrival: number;
  readonly cancellationRatePercent: number;
  readonly providerReviewAverage?: string;
  readonly providerReviewCount: number;
}

export interface PublicProviderReliabilitySummary {
  readonly serviceProfileId: string;
  readonly providerUserId: string;
  readonly categorySlug: ServiceCategorySlug;
  readonly categoryName: string;
  readonly ratingAverage?: string;
  readonly ratingCount: number;
  readonly completedOrderCount: number;
  readonly providerCancellationCount: number;
  readonly providerCancellationRatePercent: number;
  readonly activeSanction: boolean;
  readonly offerEligible: boolean;
}

export interface ProviderSanctionEventSummary {
  readonly id: string;
  readonly sanctionId: string;
  readonly actorUserId?: string;
  readonly eventType: ProviderSanctionEventType;
  readonly reason: string;
  readonly occurredAt: string;
}

export interface ProviderSanctionSummary {
  readonly id: string;
  readonly providerUserId: string;
  readonly serviceProfileId?: string;
  readonly sanctionType: ProviderSanctionType;
  readonly reason: string;
  readonly startsAt: string;
  readonly endsAt?: string;
  readonly liftedAt?: string;
  readonly liftedByUserId?: string;
  readonly liftReason?: string;
  readonly createdByUserId?: string;
  readonly appealStatus: ProviderSanctionAppealStatus;
  readonly appealReason?: string;
  readonly appealSubmittedAt?: string;
  readonly appealDecidedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly events?: ReadonlyArray<ProviderSanctionEventSummary>;
}

export interface FrontendErrorReport {
  readonly source: FrontendMonitoringSource;
  readonly severity: Extract<MonitoringEventSeverity, "error">;
  readonly route: string;
  readonly errorName: string;
  readonly message: string;
  readonly digest?: string;
  readonly componentStack?: string;
  readonly userAgent?: string;
  readonly occurredAt: string;
}

export interface MonitoringReportResponse {
  readonly accepted: true;
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
