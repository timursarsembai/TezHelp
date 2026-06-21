import type { ColumnType, Generated, Insertable, Kysely } from "kysely";

import type { Locale } from "@tezhelp/types";

type TimestampColumn = ColumnType<Date, Date | undefined, Date>;
type NullableTimestampColumn = ColumnType<Date | null, Date | null | undefined, Date | null>;
type JsonColumn = ColumnType<
  Record<string, unknown>,
  Record<string, unknown> | undefined,
  Record<string, unknown>
>;
type TextArrayColumn = ColumnType<
  ReadonlyArray<string>,
  ReadonlyArray<string> | undefined,
  ReadonlyArray<string>
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
  readonly display_name: string | null;
  readonly iin: string | null;
  readonly city: string | null;
  readonly tax_status: ProviderTaxStatus | null;
  readonly general_document_version: Generated<number>;
  readonly created_at: Generated<Date>;
  readonly updated_at: TimestampColumn;
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

interface ServiceCategoriesTable {
  readonly slug: string;
  readonly enabled: Generated<boolean>;
  readonly sort_order: number;
  readonly response_fee_kzt: Generated<number>;
  readonly commission_strategy: Generated<CommissionStrategy>;
  readonly commission_percentage_bps: Generated<number>;
  readonly commission_fixed_kzt: Generated<number>;
  readonly operational_minimum_kzt: Generated<number>;
  readonly created_at: Generated<Date>;
  readonly updated_at: TimestampColumn;
}

interface ServiceCategoryTranslationsTable {
  readonly category_slug: string;
  readonly locale: Locale;
  readonly name: string;
  readonly description: string;
}

interface ServiceCategoryTaxAllowancesTable {
  readonly category_slug: string;
  readonly tax_status: ProviderTaxStatus;
  readonly created_at: Generated<Date>;
}

interface ServiceCategoryDocumentRulesTable {
  readonly id: Generated<string>;
  readonly category_slug: string;
  readonly document_type: string;
  readonly localized_label: JsonColumn;
  readonly required: Generated<boolean>;
  readonly allowed_mime_types: TextArrayColumn;
  readonly max_size_bytes: Generated<number>;
  readonly metadata_schema: JsonColumn;
  readonly sort_order: Generated<number>;
  readonly created_at: Generated<Date>;
}

interface ProviderServiceProfilesTable {
  readonly id: Generated<string>;
  readonly provider_user_id: string;
  readonly category_slug: string;
  readonly moderation_status: Generated<ProviderModerationStatus>;
  readonly submitted_at: NullableTimestampColumn;
  readonly sla_deadline_at: NullableTimestampColumn;
  readonly moderator_user_id: string | null;
  readonly decided_at: NullableTimestampColumn;
  readonly decision_reason: string | null;
  readonly suspended_at: NullableTimestampColumn;
  readonly suspension_reason: string | null;
  readonly document_version: Generated<number>;
  readonly rating_average: ColumnType<string | null, string | null | undefined, string | null>;
  readonly rating_count: Generated<number>;
  readonly completed_order_count: Generated<number>;
  readonly cancellation_count: Generated<number>;
  readonly created_at: Generated<Date>;
  readonly updated_at: TimestampColumn;
}

interface ProviderDocumentsTable {
  readonly id: Generated<string>;
  readonly provider_user_id: string;
  readonly service_profile_id: string | null;
  readonly document_type: string;
  readonly private_object_key: string;
  readonly original_filename: string;
  readonly content_type: string;
  readonly size_bytes: number;
  readonly document_version: number;
  readonly metadata: JsonColumn;
  readonly created_at: Generated<Date>;
}

interface ProviderModerationEventsTable {
  readonly id: Generated<string>;
  readonly service_profile_id: string;
  readonly actor_user_id: string | null;
  readonly action: string;
  readonly from_status: ProviderModerationStatus | null;
  readonly to_status: ProviderModerationStatus;
  readonly reason: string | null;
  readonly document_version: number;
  readonly metadata: JsonColumn;
  readonly occurred_at: Generated<Date>;
}

interface ProviderDocumentAccessAuditTable {
  readonly id: Generated<string>;
  readonly document_id: string;
  readonly actor_user_id: string | null;
  readonly access_action: string;
  readonly reason: string;
  readonly occurred_at: Generated<Date>;
}

interface ProviderOrderDiscoveryPreferencesTable {
  readonly provider_user_id: string;
  readonly nearby_enabled: Generated<boolean>;
  readonly radius_meters: Generated<number>;
  readonly reference_latitude: Generated<string>;
  readonly reference_longitude: Generated<string>;
  readonly updated_at: TimestampColumn;
}

interface OrdersTable {
  readonly id: Generated<string>;
  readonly customer_user_id: string;
  readonly category_slug: string;
  readonly status: Generated<OrderStatus>;
  readonly city: Generated<string>;
  readonly location: ColumnType<string, string, string>;
  readonly address_landmark: string;
  readonly vehicle_make: string | null;
  readonly vehicle_model: string | null;
  readonly vehicle_year: number | null;
  readonly description: string;
  readonly unlocking_lawful_access: JsonColumn;
  readonly unlocking_verification_status: Generated<"not_required" | "pending">;
  readonly assigned_provider_user_id: string | null;
  readonly assigned_provider_service_profile_id: string | null;
  readonly accepted_price_kzt: number | null;
  readonly selected_offer_id: string | null;
  readonly commission_reservation_id: string | null;
  readonly published_at: Generated<Date>;
  readonly selected_at: NullableTimestampColumn;
  readonly departed_at: NullableTimestampColumn;
  readonly arrived_at: NullableTimestampColumn;
  readonly work_started_at: NullableTimestampColumn;
  readonly completed_at: NullableTimestampColumn;
  readonly cancelled_at: NullableTimestampColumn;
  readonly cancelled_by_user_id: string | null;
  readonly cancellation_reason: string | null;
  readonly terminal_idempotency_key: string | null;
  readonly created_at: Generated<Date>;
  readonly updated_at: TimestampColumn;
}

interface OrderStatusHistoryTable {
  readonly id: Generated<string>;
  readonly order_id: string;
  readonly from_status: OrderStatus | null;
  readonly to_status: OrderStatus;
  readonly actor_user_id: string | null;
  readonly reason: string;
  readonly metadata: JsonColumn;
  readonly occurred_at: Generated<Date>;
}

interface OrderImagesTable {
  readonly id: Generated<string>;
  readonly order_id: string;
  readonly private_object_key: string;
  readonly original_filename: string;
  readonly content_type: string;
  readonly size_bytes: number;
  readonly sort_order: number;
  readonly created_at: Generated<Date>;
}

interface WalletAccountsTable {
  readonly provider_user_id: string;
  readonly available_balance_kzt: Generated<number>;
  readonly reserved_balance_kzt: Generated<number>;
  readonly free_responses_remaining: Generated<number>;
  readonly created_at: Generated<Date>;
  readonly updated_at: TimestampColumn;
}

interface WalletLedgerEntriesTable {
  readonly id: Generated<string>;
  readonly provider_user_id: string;
  readonly entry_type: WalletLedgerEntryType;
  readonly amount_kzt: number;
  readonly available_delta_kzt: number;
  readonly reserved_delta_kzt: number;
  readonly resulting_available_balance_kzt: number;
  readonly resulting_reserved_balance_kzt: number;
  readonly idempotency_key: string;
  readonly actor_user_id: string | null;
  readonly reason: string;
  readonly related_order_id: string | null;
  readonly related_offer_id: string | null;
  readonly related_commission_reservation_id: string | null;
  readonly metadata: JsonColumn;
  readonly created_at: Generated<Date>;
}

interface OffersTable {
  readonly id: Generated<string>;
  readonly order_id: string;
  readonly provider_user_id: string;
  readonly provider_service_profile_id: string;
  readonly price_kzt: number;
  readonly arrival_minutes: number;
  readonly comment: string;
  readonly status: Generated<OfferStatus>;
  readonly response_fee_kzt: number;
  readonly free_response_credit_used: Generated<boolean>;
  readonly response_fee_ledger_entry_id: string | null;
  readonly idempotency_key: string;
  readonly created_at: Generated<Date>;
  readonly updated_at: TimestampColumn;
}

interface CommissionReservationsTable {
  readonly id: Generated<string>;
  readonly order_id: string;
  readonly offer_id: string;
  readonly provider_user_id: string;
  readonly amount_kzt: number;
  readonly state: Generated<CommissionReservationState>;
  readonly idempotency_key: string;
  readonly created_at: Generated<Date>;
  readonly updated_at: TimestampColumn;
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
  readonly service_categories: ServiceCategoriesTable;
  readonly service_category_translations: ServiceCategoryTranslationsTable;
  readonly service_category_tax_allowances: ServiceCategoryTaxAllowancesTable;
  readonly service_category_document_rules: ServiceCategoryDocumentRulesTable;
  readonly provider_service_profiles: ProviderServiceProfilesTable;
  readonly provider_documents: ProviderDocumentsTable;
  readonly provider_moderation_events: ProviderModerationEventsTable;
  readonly provider_document_access_audit: ProviderDocumentAccessAuditTable;
  readonly provider_order_discovery_preferences: ProviderOrderDiscoveryPreferencesTable;
  readonly orders: OrdersTable;
  readonly order_status_history: OrderStatusHistoryTable;
  readonly order_images: OrderImagesTable;
  readonly wallet_accounts: WalletAccountsTable;
  readonly wallet_ledger_entries: WalletLedgerEntriesTable;
  readonly offers: OffersTable;
  readonly commission_reservations: CommissionReservationsTable;
}

export type TezHelpDatabase = Kysely<DatabaseSchema>;
export type NewAuditEvent = Insertable<AuditEventsTable>;
export type NewProviderDocument = Insertable<ProviderDocumentsTable>;
export type NewProviderModerationEvent = Insertable<ProviderModerationEventsTable>;
export type NewWalletLedgerEntry = Insertable<WalletLedgerEntriesTable>;
