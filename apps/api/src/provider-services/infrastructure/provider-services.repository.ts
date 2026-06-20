import { Injectable } from "@nestjs/common";
import type { Transaction } from "kysely";

import type {
  Locale,
  ProviderDocumentSummary,
  ProviderModerationStatus,
  ProviderProfileSummary,
  ProviderServiceProfileSummary,
  ProviderTaxStatus,
  ServiceCategorySlug,
} from "@tezhelp/types";

import { DatabaseService } from "../../foundation/database/database.service.js";
import type { DatabaseSchema } from "../../foundation/database/database.types.js";
import { ProviderServicesApplicationError } from "../domain/provider-services-errors.js";

export interface UpdateProviderProfileInput {
  readonly displayName?: string | undefined;
  readonly iin?: string | undefined;
  readonly city?: string | undefined;
  readonly taxStatus?: ProviderTaxStatus | undefined;
}

export interface RegisterDocumentInput {
  readonly providerUserId: string;
  readonly serviceProfileId?: string | undefined;
  readonly documentType: string;
  readonly privateObjectKey: string;
  readonly originalFilename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly metadata: Record<string, unknown>;
}

export interface ProviderDocumentRecord {
  readonly id: string;
  readonly providerUserId: string;
  readonly privateObjectKey: string;
}

@Injectable()
export class ProviderServicesRepository {
  constructor(private readonly database: DatabaseService) {}

  async getProviderProfile(userId: string): Promise<ProviderProfileSummary> {
    await this.ensureProviderProfile(userId);
    const row = await this.database.db
      .selectFrom("provider_profiles")
      .selectAll()
      .where("user_id", "=", userId)
      .executeTakeFirstOrThrow();

    return this.toProviderProfile(row);
  }

  async updateProviderProfile(
    userId: string,
    input: UpdateProviderProfileInput,
  ): Promise<ProviderProfileSummary> {
    await this.ensureProviderProfile(userId);
    const row = await this.database.db
      .updateTable("provider_profiles")
      .set({
        display_name: input.displayName,
        iin: input.iin,
        city: input.city,
        tax_status: input.taxStatus,
        updated_at: new Date(),
      })
      .where("user_id", "=", userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.toProviderProfile(row);
  }

  async createServiceProfile(
    providerUserId: string,
    categorySlug: ServiceCategorySlug,
  ): Promise<ProviderServiceProfileSummary> {
    await this.ensureProviderProfile(providerUserId);
    const category = await this.database.db
      .selectFrom("service_categories")
      .select("slug")
      .where("slug", "=", categorySlug)
      .where("enabled", "=", true)
      .executeTakeFirst();
    if (!category) {
      throw new ProviderServicesApplicationError("CATEGORY_NOT_FOUND", "Category not found", 404);
    }

    const inserted = await this.database.db
      .insertInto("provider_service_profiles")
      .values({ provider_user_id: providerUserId, category_slug: categorySlug })
      .onConflict((oc) => oc.columns(["provider_user_id", "category_slug"]).doNothing())
      .returningAll()
      .executeTakeFirst();
    const row =
      inserted ??
      (await this.database.db
        .selectFrom("provider_service_profiles")
        .selectAll()
        .where("provider_user_id", "=", providerUserId)
        .where("category_slug", "=", categorySlug)
        .executeTakeFirstOrThrow());

    return this.getServiceProfileById(providerUserId, row.id, "ru");
  }

  async listServiceProfiles(
    providerUserId: string,
    locale: Locale,
  ): Promise<ReadonlyArray<ProviderServiceProfileSummary>> {
    const rows = await this.database.db
      .selectFrom("provider_service_profiles")
      .innerJoin("service_category_translations", (join) =>
        join
          .onRef(
            "service_category_translations.category_slug",
            "=",
            "provider_service_profiles.category_slug",
          )
          .on("service_category_translations.locale", "=", locale),
      )
      .selectAll("provider_service_profiles")
      .select("service_category_translations.name as category_name")
      .where("provider_user_id", "=", providerUserId)
      .orderBy("created_at", "asc")
      .execute();

    const documents = await this.database.db
      .selectFrom("provider_documents")
      .selectAll()
      .where("provider_user_id", "=", providerUserId)
      .where("service_profile_id", "is not", null)
      .orderBy("created_at", "desc")
      .execute();

    return rows.map((row) =>
      this.toServiceProfile(
        row,
        documents.filter((document) => document.service_profile_id === row.id),
      ),
    );
  }

  async getServiceProfileById(
    providerUserId: string,
    serviceProfileId: string,
    locale: Locale,
  ): Promise<ProviderServiceProfileSummary> {
    const row = await this.database.db
      .selectFrom("provider_service_profiles")
      .innerJoin("service_category_translations", (join) =>
        join
          .onRef(
            "service_category_translations.category_slug",
            "=",
            "provider_service_profiles.category_slug",
          )
          .on("service_category_translations.locale", "=", locale),
      )
      .selectAll("provider_service_profiles")
      .select("service_category_translations.name as category_name")
      .where("provider_service_profiles.id", "=", serviceProfileId)
      .where("provider_service_profiles.provider_user_id", "=", providerUserId)
      .executeTakeFirst();
    if (!row) {
      throw new ProviderServicesApplicationError(
        "PROVIDER_SERVICE_PROFILE_NOT_FOUND",
        "Provider service profile not found",
        404,
      );
    }

    const documents = await this.database.db
      .selectFrom("provider_documents")
      .selectAll()
      .where("service_profile_id", "=", serviceProfileId)
      .orderBy("created_at", "desc")
      .execute();

    return this.toServiceProfile(row, documents);
  }

  async registerDocument(input: RegisterDocumentInput): Promise<ProviderDocumentSummary> {
    return this.database.transaction(async (trx) => {
      if (input.serviceProfileId) {
        return this.registerServiceDocument(trx, input);
      }

      return this.registerGeneralDocument(trx, input);
    });
  }

  async submitServiceProfile(
    providerUserId: string,
    serviceProfileId: string,
    now: Date,
  ): Promise<ProviderServiceProfileSummary> {
    await this.database.transaction(async (trx) => {
      const profile = await trx
        .selectFrom("provider_service_profiles")
        .selectAll()
        .where("id", "=", serviceProfileId)
        .where("provider_user_id", "=", providerUserId)
        .forUpdate()
        .executeTakeFirst();
      if (!profile) {
        throw new ProviderServicesApplicationError(
          "PROVIDER_SERVICE_PROFILE_NOT_FOUND",
          "Provider service profile not found",
          404,
        );
      }
      if (!["draft", "rejected"].includes(profile.moderation_status)) {
        throw new ProviderServicesApplicationError(
          "PROVIDER_SERVICE_PROFILE_NOT_SUBMITTABLE",
          "Provider service profile cannot be submitted",
          409,
        );
      }

      const deadline = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      await trx
        .updateTable("provider_service_profiles")
        .set({
          moderation_status: "submitted",
          submitted_at: now,
          sla_deadline_at: deadline,
          decision_reason: null,
          decided_at: null,
          moderator_user_id: null,
          updated_at: now,
        })
        .where("id", "=", serviceProfileId)
        .execute();
      await this.recordModerationEvent(trx, {
        serviceProfileId,
        actorUserId: providerUserId,
        action: "provider_service.submitted",
        fromStatus: profile.moderation_status,
        toStatus: "submitted",
        reason: null,
        documentVersion: profile.document_version,
      });
    });

    return this.getServiceProfileById(providerUserId, serviceProfileId, "ru");
  }

  async findProviderDocument(
    providerUserId: string,
    documentId: string,
  ): Promise<ProviderDocumentRecord> {
    const row = await this.database.db
      .selectFrom("provider_documents")
      .select(["id", "provider_user_id", "private_object_key"])
      .where("id", "=", documentId)
      .where("provider_user_id", "=", providerUserId)
      .executeTakeFirst();
    if (!row) {
      throw new ProviderServicesApplicationError(
        "UNAUTHORIZED_DOCUMENT_ACCESS",
        "Document access denied",
        403,
      );
    }

    return {
      id: row.id,
      providerUserId: row.provider_user_id,
      privateObjectKey: row.private_object_key,
    };
  }

  async auditDocumentAccess(input: {
    readonly documentId: string;
    readonly actorUserId: string;
    readonly reason: string;
  }): Promise<void> {
    await this.database.db
      .insertInto("provider_document_access_audit")
      .values({
        document_id: input.documentId,
        actor_user_id: input.actorUserId,
        access_action: "signed_read_url.created",
        reason: input.reason,
      })
      .execute();
  }

  async isOfferEligible(providerUserId: string, serviceProfileId: string): Promise<boolean> {
    const row = await this.database.db
      .selectFrom("provider_service_profiles")
      .select(["moderation_status", "suspended_at"])
      .where("id", "=", serviceProfileId)
      .where("provider_user_id", "=", providerUserId)
      .executeTakeFirst();

    return row?.moderation_status === "approved" && row.suspended_at === null;
  }

  private async ensureProviderProfile(userId: string): Promise<void> {
    await this.database.db
      .insertInto("provider_profiles")
      .values({ user_id: userId })
      .onConflict((oc) => oc.column("user_id").doNothing())
      .execute();
  }

  private async registerGeneralDocument(
    trx: Transaction<DatabaseSchema>,
    input: RegisterDocumentInput,
  ): Promise<ProviderDocumentSummary> {
    if (!["face_photo", "identity_document"].includes(input.documentType)) {
      throw new ProviderServicesApplicationError(
        "DOCUMENT_TYPE_NOT_ALLOWED",
        "General provider document type is not allowed",
        400,
      );
    }
    const profile = await trx
      .selectFrom("provider_profiles")
      .selectAll()
      .where("user_id", "=", input.providerUserId)
      .forUpdate()
      .executeTakeFirst();
    if (!profile) {
      throw new ProviderServicesApplicationError(
        "PROVIDER_PROFILE_NOT_FOUND",
        "Provider profile not found",
        404,
      );
    }

    const documentVersion = profile.general_document_version + 1;
    await trx
      .updateTable("provider_profiles")
      .set({ general_document_version: documentVersion, updated_at: new Date() })
      .where("user_id", "=", input.providerUserId)
      .execute();

    const row = await trx
      .insertInto("provider_documents")
      .values({
        provider_user_id: input.providerUserId,
        service_profile_id: null,
        document_type: input.documentType,
        private_object_key: input.privateObjectKey,
        original_filename: input.originalFilename,
        content_type: input.contentType,
        size_bytes: input.sizeBytes,
        document_version: documentVersion,
        metadata: input.metadata,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.toDocumentSummary(row);
  }

  private async registerServiceDocument(
    trx: Transaction<DatabaseSchema>,
    input: RegisterDocumentInput,
  ): Promise<ProviderDocumentSummary> {
    const profile = await trx
      .selectFrom("provider_service_profiles")
      .selectAll()
      .where("id", "=", input.serviceProfileId ?? "")
      .where("provider_user_id", "=", input.providerUserId)
      .forUpdate()
      .executeTakeFirst();
    if (!profile) {
      throw new ProviderServicesApplicationError(
        "PROVIDER_SERVICE_PROFILE_NOT_FOUND",
        "Provider service profile not found",
        404,
      );
    }

    const rule = await trx
      .selectFrom("service_category_document_rules")
      .selectAll()
      .where("category_slug", "=", profile.category_slug)
      .where("document_type", "=", input.documentType)
      .executeTakeFirst();
    if (!rule) {
      throw new ProviderServicesApplicationError(
        "DOCUMENT_RULE_NOT_FOUND",
        "Document rule not found for category",
        400,
      );
    }
    if (!rule.allowed_mime_types.includes(input.contentType)) {
      throw new ProviderServicesApplicationError(
        "DOCUMENT_CONTENT_TYPE_NOT_ALLOWED",
        "Document content type is not allowed",
        400,
      );
    }
    if (input.sizeBytes > rule.max_size_bytes) {
      throw new ProviderServicesApplicationError(
        "DOCUMENT_TOO_LARGE",
        "Document is too large",
        400,
      );
    }

    const documentVersion = profile.document_version + 1;
    await trx
      .updateTable("provider_service_profiles")
      .set({ document_version: documentVersion, updated_at: new Date() })
      .where("id", "=", profile.id)
      .execute();

    const row = await trx
      .insertInto("provider_documents")
      .values({
        provider_user_id: input.providerUserId,
        service_profile_id: profile.id,
        document_type: input.documentType,
        private_object_key: input.privateObjectKey,
        original_filename: input.originalFilename,
        content_type: input.contentType,
        size_bytes: input.sizeBytes,
        document_version: documentVersion,
        metadata: input.metadata,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.toDocumentSummary(row);
  }

  private async recordModerationEvent(
    trx: Transaction<DatabaseSchema>,
    input: {
      readonly serviceProfileId: string;
      readonly actorUserId: string | null;
      readonly action: string;
      readonly fromStatus: ProviderModerationStatus | null;
      readonly toStatus: ProviderModerationStatus;
      readonly reason: string | null;
      readonly documentVersion: number;
    },
  ): Promise<void> {
    await trx
      .insertInto("provider_moderation_events")
      .values({
        service_profile_id: input.serviceProfileId,
        actor_user_id: input.actorUserId,
        action: input.action,
        from_status: input.fromStatus,
        to_status: input.toStatus,
        reason: input.reason,
        document_version: input.documentVersion,
      })
      .execute();
  }

  private toProviderProfile(row: {
    readonly user_id: string;
    readonly display_name: string | null;
    readonly iin: string | null;
    readonly city: string | null;
    readonly tax_status: ProviderTaxStatus | null;
    readonly general_document_version: number;
  }): ProviderProfileSummary {
    return {
      userId: row.user_id,
      generalDocumentVersion: row.general_document_version,
      ...(row.display_name ? { displayName: row.display_name } : {}),
      ...(row.iin ? { iin: row.iin } : {}),
      ...(row.city ? { city: row.city } : {}),
      ...(row.tax_status ? { taxStatus: row.tax_status } : {}),
    };
  }

  private toServiceProfile(
    row: {
      readonly id: string;
      readonly provider_user_id: string;
      readonly category_slug: string;
      readonly category_name: string;
      readonly moderation_status: ProviderModerationStatus;
      readonly submitted_at: Date | null;
      readonly sla_deadline_at: Date | null;
      readonly decided_at: Date | null;
      readonly decision_reason: string | null;
      readonly suspended_at: Date | null;
      readonly suspension_reason: string | null;
      readonly document_version: number;
      readonly rating_average: string | null;
      readonly rating_count: number;
      readonly completed_order_count: number;
      readonly cancellation_count: number;
    },
    documents: ReadonlyArray<{
      readonly id: string;
      readonly document_type: string;
      readonly original_filename: string;
      readonly content_type: string;
      readonly size_bytes: number;
      readonly document_version: number;
      readonly created_at: Date;
    }>,
  ): ProviderServiceProfileSummary {
    return {
      id: row.id,
      providerUserId: row.provider_user_id,
      categorySlug: row.category_slug as ServiceCategorySlug,
      categoryName: row.category_name,
      moderationStatus: row.moderation_status,
      documentVersion: row.document_version,
      ratingCount: row.rating_count,
      completedOrderCount: row.completed_order_count,
      cancellationCount: row.cancellation_count,
      documents: documents.map((document) => this.toDocumentSummary(document)),
      ...(row.submitted_at ? { submittedAt: row.submitted_at.toISOString() } : {}),
      ...(row.sla_deadline_at ? { slaDeadlineAt: row.sla_deadline_at.toISOString() } : {}),
      ...(row.decided_at ? { decidedAt: row.decided_at.toISOString() } : {}),
      ...(row.decision_reason ? { decisionReason: row.decision_reason } : {}),
      ...(row.suspended_at ? { suspendedAt: row.suspended_at.toISOString() } : {}),
      ...(row.suspension_reason ? { suspensionReason: row.suspension_reason } : {}),
      ...(row.rating_average ? { ratingAverage: row.rating_average } : {}),
    };
  }

  private toDocumentSummary(row: {
    readonly id: string;
    readonly document_type: string;
    readonly original_filename: string;
    readonly content_type: string;
    readonly size_bytes: number;
    readonly document_version: number;
    readonly created_at: Date;
  }): ProviderDocumentSummary {
    return {
      id: row.id,
      documentType: row.document_type,
      originalFilename: row.original_filename,
      contentType: row.content_type,
      sizeBytes: row.size_bytes,
      documentVersion: row.document_version,
      createdAt: row.created_at.toISOString(),
    };
  }
}
