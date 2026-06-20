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
}

export type TezHelpDatabase = Kysely<DatabaseSchema>;
export type NewAuditEvent = Insertable<AuditEventsTable>;
export type NewProviderDocument = Insertable<ProviderDocumentsTable>;
export type NewProviderModerationEvent = Insertable<ProviderModerationEventsTable>;
