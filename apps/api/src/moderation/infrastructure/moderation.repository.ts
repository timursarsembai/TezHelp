import { Injectable } from "@nestjs/common";
import type { Transaction } from "kysely";

import type {
  Locale,
  ProviderDocumentSummary,
  ProviderModerationEventSummary,
  ProviderModerationQueueItem,
  ProviderModerationStatus,
  ProviderProfileSummary,
  ProviderServiceProfileSummary,
  ServiceCategorySlug,
} from "@tezhelp/types";

import { DatabaseService } from "../../foundation/database/database.service.js";
import type { DatabaseSchema } from "../../foundation/database/database.types.js";
import { ModerationApplicationError } from "../domain/moderation-errors.js";

export interface ModerationDetail {
  readonly provider: ProviderProfileSummary;
  readonly serviceProfile: ProviderServiceProfileSummary;
  readonly history: ReadonlyArray<ProviderModerationEventSummary>;
}

export interface ModerationQueueFilter {
  readonly status?: ProviderModerationStatus;
  readonly categorySlug?: ServiceCategorySlug;
}

export interface AdminDocumentRecord {
  readonly id: string;
  readonly privateObjectKey: string;
}

@Injectable()
export class ModerationRepository {
  constructor(private readonly database: DatabaseService) {}

  async listQueue(
    filter: ModerationQueueFilter,
    locale: Locale,
    now: Date,
  ): Promise<ReadonlyArray<ProviderModerationQueueItem>> {
    let query = this.database.db.selectFrom("provider_service_profiles").selectAll();
    if (filter.status) {
      query = query.where("moderation_status", "=", filter.status);
    } else {
      query = query.where("moderation_status", "in", ["submitted", "under_review"]);
    }
    if (filter.categorySlug) {
      query = query.where("category_slug", "=", filter.categorySlug);
    }

    const rows = await query.orderBy("sla_deadline_at", "asc").limit(100).execute();
    return Promise.all(
      rows.map(async (row) => {
        const [provider, serviceProfile] = await Promise.all([
          this.getProvider(row.provider_user_id),
          this.toServiceProfileWithDocuments(row, locale),
        ]);
        return {
          provider,
          serviceProfile,
          overdue: Boolean(row.sla_deadline_at && row.sla_deadline_at < now),
        };
      }),
    );
  }

  async getDetail(serviceProfileId: string, locale: Locale): Promise<ModerationDetail> {
    const row = await this.database.db
      .selectFrom("provider_service_profiles")
      .selectAll()
      .where("id", "=", serviceProfileId)
      .executeTakeFirst();
    if (!row) {
      throw new ModerationApplicationError(
        "PROVIDER_SERVICE_PROFILE_NOT_FOUND",
        "Provider service profile not found",
        404,
      );
    }

    const [provider, serviceProfile, history] = await Promise.all([
      this.getProvider(row.provider_user_id),
      this.toServiceProfileWithDocuments(row, locale),
      this.getHistory(serviceProfileId),
    ]);

    return { provider, serviceProfile, history };
  }

  async markUnderReview(
    serviceProfileId: string,
    adminUserId: string,
  ): Promise<ProviderServiceProfileSummary> {
    await this.transition({
      serviceProfileId,
      adminUserId,
      toStatus: "under_review",
      action: "provider_service.under_review",
      reason: "moderation_started",
      allowedFrom: ["submitted"],
    });
    const detail = await this.getDetail(serviceProfileId, "ru");
    return detail.serviceProfile;
  }

  async approve(
    serviceProfileId: string,
    adminUserId: string,
    reason: string,
  ): Promise<ProviderServiceProfileSummary> {
    await this.transition({
      serviceProfileId,
      adminUserId,
      toStatus: "approved",
      action: "provider_service.approved",
      reason,
      allowedFrom: ["submitted", "under_review"],
    });
    const detail = await this.getDetail(serviceProfileId, "ru");
    return detail.serviceProfile;
  }

  async reject(
    serviceProfileId: string,
    adminUserId: string,
    reason: string,
  ): Promise<ProviderServiceProfileSummary> {
    await this.transition({
      serviceProfileId,
      adminUserId,
      toStatus: "rejected",
      action: "provider_service.rejected",
      reason,
      allowedFrom: ["submitted", "under_review"],
    });
    const detail = await this.getDetail(serviceProfileId, "ru");
    return detail.serviceProfile;
  }

  async suspend(
    serviceProfileId: string,
    adminUserId: string,
    reason: string,
  ): Promise<ProviderServiceProfileSummary> {
    await this.transition({
      serviceProfileId,
      adminUserId,
      toStatus: "suspended",
      action: "provider_service.suspended",
      reason,
      allowedFrom: ["draft", "submitted", "under_review", "approved", "rejected"],
    });
    const detail = await this.getDetail(serviceProfileId, "ru");
    return detail.serviceProfile;
  }

  async findDocumentForAdmin(documentId: string): Promise<AdminDocumentRecord> {
    const row = await this.database.db
      .selectFrom("provider_documents")
      .select(["id", "private_object_key"])
      .where("id", "=", documentId)
      .executeTakeFirst();
    if (!row) {
      throw new ModerationApplicationError(
        "PROVIDER_DOCUMENT_NOT_FOUND",
        "Provider document not found",
        404,
      );
    }

    return { id: row.id, privateObjectKey: row.private_object_key };
  }

  async auditDocumentAccess(input: {
    readonly documentId: string;
    readonly adminUserId: string;
  }): Promise<void> {
    await this.database.db
      .insertInto("provider_document_access_audit")
      .values({
        document_id: input.documentId,
        actor_user_id: input.adminUserId,
        access_action: "admin.signed_read_url.created",
        reason: "provider_moderation_review",
      })
      .execute();
  }

  private async transition(input: {
    readonly serviceProfileId: string;
    readonly adminUserId: string;
    readonly toStatus: ProviderModerationStatus;
    readonly action: string;
    readonly reason: string;
    readonly allowedFrom: ReadonlyArray<ProviderModerationStatus>;
  }): Promise<void> {
    await this.database.transaction(async (trx) => {
      const profile = await trx
        .selectFrom("provider_service_profiles")
        .selectAll()
        .where("id", "=", input.serviceProfileId)
        .forUpdate()
        .executeTakeFirst();
      if (!profile) {
        throw new ModerationApplicationError(
          "PROVIDER_SERVICE_PROFILE_NOT_FOUND",
          "Provider service profile not found",
          404,
        );
      }
      if (!input.allowedFrom.includes(profile.moderation_status)) {
        throw new ModerationApplicationError(
          "MODERATION_ACTION_NOT_ALLOWED",
          "Moderation action is not allowed for current status",
          409,
        );
      }

      const now = new Date();
      await trx
        .updateTable("provider_service_profiles")
        .set({
          moderation_status: input.toStatus,
          moderator_user_id: input.adminUserId,
          decided_at: input.toStatus === "under_review" ? profile.decided_at : now,
          decision_reason:
            input.toStatus === "under_review" ? profile.decision_reason : input.reason,
          suspended_at: input.toStatus === "suspended" ? now : profile.suspended_at,
          suspension_reason:
            input.toStatus === "suspended" ? input.reason : profile.suspension_reason,
          updated_at: now,
        })
        .where("id", "=", input.serviceProfileId)
        .execute();
      await this.recordModerationEvent(trx, {
        serviceProfileId: input.serviceProfileId,
        actorUserId: input.adminUserId,
        action: input.action,
        fromStatus: profile.moderation_status,
        toStatus: input.toStatus,
        reason: input.reason,
        documentVersion: profile.document_version,
      });
      await trx
        .insertInto("audit_events")
        .values({
          actor_id: input.adminUserId,
          action: input.action,
          reason: input.reason,
          related_entity_type: "provider_service_profile",
          related_entity_id: input.serviceProfileId,
          metadata: {
            fromStatus: profile.moderation_status,
            toStatus: input.toStatus,
            documentVersion: profile.document_version,
          },
        })
        .execute();
    });
  }

  private async getProvider(providerUserId: string): Promise<ProviderProfileSummary> {
    const row = await this.database.db
      .selectFrom("provider_profiles")
      .selectAll()
      .where("user_id", "=", providerUserId)
      .executeTakeFirstOrThrow();

    return {
      userId: row.user_id,
      generalDocumentVersion: row.general_document_version,
      ...(row.display_name ? { displayName: row.display_name } : {}),
      ...(row.iin ? { iin: row.iin } : {}),
      ...(row.city ? { city: row.city } : {}),
      ...(row.tax_status ? { taxStatus: row.tax_status } : {}),
    };
  }

  private async toServiceProfileWithDocuments(
    row: {
      readonly id: string;
      readonly provider_user_id: string;
      readonly category_slug: string;
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
    locale: Locale,
  ): Promise<ProviderServiceProfileSummary> {
    const [category, documents] = await Promise.all([
      this.database.db
        .selectFrom("service_category_translations")
        .select("name")
        .where("category_slug", "=", row.category_slug)
        .where("locale", "=", locale)
        .executeTakeFirstOrThrow(),
      this.database.db
        .selectFrom("provider_documents")
        .selectAll()
        .where("service_profile_id", "=", row.id)
        .orderBy("created_at", "desc")
        .execute(),
    ]);

    return {
      id: row.id,
      providerUserId: row.provider_user_id,
      categorySlug: row.category_slug as ServiceCategorySlug,
      categoryName: category.name,
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

  private async getHistory(
    serviceProfileId: string,
  ): Promise<ReadonlyArray<ProviderModerationEventSummary>> {
    const rows = await this.database.db
      .selectFrom("provider_moderation_events")
      .selectAll()
      .where("service_profile_id", "=", serviceProfileId)
      .orderBy("occurred_at", "asc")
      .execute();

    return rows.map((row) => ({
      id: row.id,
      serviceProfileId: row.service_profile_id,
      action: row.action,
      toStatus: row.to_status,
      documentVersion: row.document_version,
      occurredAt: row.occurred_at.toISOString(),
      ...(row.actor_user_id ? { actorUserId: row.actor_user_id } : {}),
      ...(row.from_status ? { fromStatus: row.from_status } : {}),
      ...(row.reason ? { reason: row.reason } : {}),
    }));
  }

  private async recordModerationEvent(
    trx: Transaction<DatabaseSchema>,
    input: {
      readonly serviceProfileId: string;
      readonly actorUserId: string;
      readonly action: string;
      readonly fromStatus: ProviderModerationStatus;
      readonly toStatus: ProviderModerationStatus;
      readonly reason: string;
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
