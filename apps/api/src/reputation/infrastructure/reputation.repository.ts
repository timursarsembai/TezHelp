import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";

import type {
  CustomerReliabilitySummary,
  Locale,
  OrderReviewSummary,
  OrderStatus,
  ProviderSanctionEventSummary,
  ProviderSanctionSummary,
  ProviderSanctionType,
  PublicProviderReliabilitySummary,
  ServiceCategorySlug,
} from "@tezhelp/types";

import { DatabaseService } from "../../foundation/database/database.service.js";
import type {
  DatabaseSchema,
  ProviderSanctionAppealStatus,
  ProviderSanctionEventType,
} from "../../foundation/database/database.types.js";
import { ReputationApplicationError } from "../domain/reputation-errors.js";
import { ReputationPolicy } from "../domain/reputation-policy.js";

type DatabaseExecutor = Kysely<DatabaseSchema>;

interface OrderReviewRow {
  readonly id: string;
  readonly order_id: string;
  readonly direction: "customer_to_provider" | "provider_to_customer";
  readonly reviewer_user_id: string;
  readonly reviewee_user_id: string;
  readonly provider_service_profile_id: string | null;
  readonly rating: number;
  readonly comment: string | null;
  readonly created_at: Date;
}

interface ProviderSanctionRow {
  readonly id: string;
  readonly provider_user_id: string;
  readonly service_profile_id: string | null;
  readonly sanction_type: ProviderSanctionType;
  readonly reason: string;
  readonly starts_at: Date;
  readonly ends_at: Date | null;
  readonly lifted_at: Date | null;
  readonly lifted_by_user_id: string | null;
  readonly lift_reason: string | null;
  readonly created_by_user_id: string | null;
  readonly appeal_status: ProviderSanctionAppealStatus;
  readonly appeal_reason: string | null;
  readonly appeal_submitted_at: Date | null;
  readonly appeal_decided_at: Date | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface ProviderSanctionEventRow {
  readonly id: string;
  readonly sanction_id: string;
  readonly actor_user_id: string | null;
  readonly event_type: ProviderSanctionEventType;
  readonly reason: string;
  readonly occurred_at: Date;
}

@Injectable()
export class ReputationRepository {
  constructor(private readonly database: DatabaseService) {}

  async submitReview(input: {
    readonly orderId: string;
    readonly reviewerUserId: string;
    readonly rating: number;
    readonly comment?: string;
  }): Promise<OrderReviewSummary> {
    return this.database.transaction(async (trx) => {
      const order = await trx
        .selectFrom("orders")
        .select([
          "id",
          "status",
          "customer_user_id",
          "assigned_provider_user_id",
          "assigned_provider_service_profile_id",
        ])
        .where("id", "=", input.orderId)
        .executeTakeFirst();
      if (!order) {
        throw new ReputationApplicationError("REVIEW_ORDER_NOT_FOUND", "Order not found", 404);
      }

      const counterparty = ReputationPolicy.resolveReviewCounterparty(
        {
          orderId: order.id,
          status: order.status,
          customerUserId: order.customer_user_id,
          assignedProviderUserId: order.assigned_provider_user_id,
          assignedProviderServiceProfileId: order.assigned_provider_service_profile_id,
        },
        input.reviewerUserId,
      );
      const duplicate = await trx
        .selectFrom("order_reviews")
        .select("id")
        .where("order_id", "=", input.orderId)
        .where("direction", "=", counterparty.direction)
        .executeTakeFirst();
      if (duplicate) {
        throw new ReputationApplicationError(
          "REVIEW_ALREADY_EXISTS",
          "Review already exists for this order direction",
          409,
        );
      }

      const row = await trx
        .insertInto("order_reviews")
        .values({
          id: randomUUID(),
          order_id: input.orderId,
          direction: counterparty.direction,
          reviewer_user_id: input.reviewerUserId,
          reviewee_user_id: counterparty.revieweeUserId,
          provider_service_profile_id: counterparty.providerServiceProfileId ?? null,
          rating: input.rating,
          comment: input.comment ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      if (counterparty.providerServiceProfileId) {
        await this.recalculateProviderServiceRating(trx, counterparty.providerServiceProfileId);
      }

      return this.toReviewSummary(row);
    });
  }

  async getCustomerReliabilityForOrder(input: {
    readonly orderId: string;
    readonly providerUserId: string;
  }): Promise<CustomerReliabilitySummary> {
    const order = await this.database.db
      .selectFrom("orders")
      .select(["id", "customer_user_id", "assigned_provider_user_id"])
      .where("id", "=", input.orderId)
      .executeTakeFirst();
    if (!order) {
      throw new ReputationApplicationError("RELIABILITY_ORDER_NOT_FOUND", "Order not found", 404);
    }

    const offer = await this.database.db
      .selectFrom("offers")
      .select("id")
      .where("order_id", "=", input.orderId)
      .where("provider_user_id", "=", input.providerUserId)
      .executeTakeFirst();
    if (order.assigned_provider_user_id !== input.providerUserId && !offer) {
      throw new ReputationApplicationError(
        "RELIABILITY_FORBIDDEN",
        "Customer reliability is visible only to providers involved with the order",
        403,
      );
    }

    const orders = await this.database.db
      .selectFrom("orders")
      .select(["status", "selected_at", "departed_at", "arrived_at"])
      .where("customer_user_id", "=", order.customer_user_id)
      .execute();
    const reviews = await this.database.db
      .selectFrom("order_reviews")
      .select((eb) => [
        eb.fn.avg<number>("rating").as("average_rating"),
        eb.fn.count<number>("id").as("review_count"),
      ])
      .where("reviewee_user_id", "=", order.customer_user_id)
      .where("direction", "=", "provider_to_customer")
      .executeTakeFirst();

    return this.toCustomerReliabilitySummary(
      order.customer_user_id,
      orders,
      Number(reviews?.average_rating ?? 0),
      Number(reviews?.review_count ?? 0),
    );
  }

  async getPublicProviderReliability(input: {
    readonly serviceProfileId: string;
    readonly locale: Locale;
  }): Promise<PublicProviderReliabilitySummary> {
    const row = await this.database.db
      .selectFrom("provider_service_profiles")
      .innerJoin("service_category_translations", (join) =>
        join
          .onRef(
            "service_category_translations.category_slug",
            "=",
            "provider_service_profiles.category_slug",
          )
          .on("service_category_translations.locale", "=", input.locale),
      )
      .select([
        "provider_service_profiles.id",
        "provider_service_profiles.provider_user_id",
        "provider_service_profiles.category_slug",
        "provider_service_profiles.moderation_status",
        "provider_service_profiles.suspended_at",
        "provider_service_profiles.rating_average",
        "provider_service_profiles.rating_count",
        "provider_service_profiles.completed_order_count",
        "provider_service_profiles.cancellation_count",
        "service_category_translations.name as category_name",
      ])
      .where("provider_service_profiles.id", "=", input.serviceProfileId)
      .executeTakeFirst();
    if (!row) {
      throw new ReputationApplicationError(
        "PUBLIC_RELIABILITY_NOT_FOUND",
        "Provider service profile reliability was not found",
        404,
      );
    }

    const now = new Date();
    const activeSanction = await this.database.db
      .selectFrom("provider_sanctions")
      .select("id")
      .where("provider_user_id", "=", row.provider_user_id)
      .where("lifted_at", "is", null)
      .where("starts_at", "<=", now)
      .where((eb) => eb.or([eb("ends_at", "is", null), eb("ends_at", ">", now)]))
      .where((eb) =>
        eb.or([eb("service_profile_id", "is", null), eb("service_profile_id", "=", row.id)]),
      )
      .executeTakeFirst();
    const completedAndCancelled = row.completed_order_count + row.cancellation_count;

    return {
      serviceProfileId: row.id,
      providerUserId: row.provider_user_id,
      categorySlug: row.category_slug as ServiceCategorySlug,
      categoryName: row.category_name,
      ratingCount: row.rating_count,
      completedOrderCount: row.completed_order_count,
      providerCancellationCount: row.cancellation_count,
      providerCancellationRatePercent:
        completedAndCancelled === 0
          ? 0
          : Math.round((row.cancellation_count / completedAndCancelled) * 100),
      activeSanction: Boolean(activeSanction),
      offerEligible:
        row.moderation_status === "approved" && row.suspended_at === null && !activeSanction,
      ...(row.rating_average ? { ratingAverage: row.rating_average } : {}),
    };
  }

  async createSanction(input: {
    readonly providerUserId: string;
    readonly adminUserId: string;
    readonly sanctionType: ProviderSanctionType;
    readonly reason: string;
    readonly serviceProfileId?: string;
    readonly startsAt?: Date;
    readonly endsAt?: Date;
  }): Promise<ProviderSanctionSummary> {
    return this.database.transaction(async (trx) => {
      const provider = await trx
        .selectFrom("provider_profiles")
        .select("user_id")
        .where("user_id", "=", input.providerUserId)
        .executeTakeFirst();
      if (!provider) {
        throw new ReputationApplicationError(
          "SANCTION_PROVIDER_NOT_FOUND",
          "Provider profile not found",
          404,
        );
      }

      if (input.serviceProfileId) {
        const serviceProfile = await trx
          .selectFrom("provider_service_profiles")
          .select("id")
          .where("id", "=", input.serviceProfileId)
          .where("provider_user_id", "=", input.providerUserId)
          .executeTakeFirst();
        if (!serviceProfile) {
          throw new ReputationApplicationError(
            "SANCTION_SERVICE_PROFILE_NOT_FOUND",
            "Provider service profile not found",
            404,
          );
        }
      }

      const row = await trx
        .insertInto("provider_sanctions")
        .values({
          id: randomUUID(),
          provider_user_id: input.providerUserId,
          service_profile_id: input.serviceProfileId ?? null,
          sanction_type: input.sanctionType,
          reason: input.reason,
          starts_at: input.startsAt ?? new Date(),
          ends_at: input.endsAt ?? null,
          created_by_user_id: input.adminUserId,
          updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await this.recordSanctionEvent(trx, {
        sanctionId: row.id,
        actorUserId: input.adminUserId,
        eventType: "applied",
        reason: input.reason,
      });

      return this.getSanctionSummary(row.id, trx);
    });
  }

  async listProviderSanctions(
    providerUserId: string,
  ): Promise<ReadonlyArray<ProviderSanctionSummary>> {
    const sanctions = await this.database.db
      .selectFrom("provider_sanctions")
      .selectAll()
      .where("provider_user_id", "=", providerUserId)
      .orderBy("created_at", "desc")
      .execute();
    const events = await this.listEventsBySanctionIds(
      sanctions.map((sanction) => sanction.id),
      this.database.db,
    );

    return sanctions.map((sanction) =>
      this.toSanctionSummary(
        sanction,
        events.filter((event) => event.sanction_id === sanction.id),
      ),
    );
  }

  async appealSanction(input: {
    readonly sanctionId: string;
    readonly providerUserId: string;
    readonly reason: string;
  }): Promise<ProviderSanctionSummary> {
    return this.database.transaction(async (trx) => {
      const sanction = await trx
        .selectFrom("provider_sanctions")
        .selectAll()
        .where("id", "=", input.sanctionId)
        .where("provider_user_id", "=", input.providerUserId)
        .forUpdate()
        .executeTakeFirst();
      if (!sanction) {
        throw new ReputationApplicationError(
          "SANCTION_NOT_FOUND",
          "Provider sanction not found",
          404,
        );
      }

      ReputationPolicy.assertSanctionCanBeAppealed({
        liftedAt: sanction.lifted_at,
        appealStatus: sanction.appeal_status,
      });

      await trx
        .updateTable("provider_sanctions")
        .set({
          appeal_status: "submitted",
          appeal_reason: input.reason,
          appeal_submitted_at: new Date(),
          appeal_decided_at: null,
          updated_at: new Date(),
        })
        .where("id", "=", input.sanctionId)
        .execute();
      await this.recordSanctionEvent(trx, {
        sanctionId: input.sanctionId,
        actorUserId: input.providerUserId,
        eventType: "appealed",
        reason: input.reason,
      });

      return this.getSanctionSummary(input.sanctionId, trx);
    });
  }

  async liftSanction(input: {
    readonly sanctionId: string;
    readonly adminUserId: string;
    readonly reason: string;
  }): Promise<ProviderSanctionSummary> {
    return this.database.transaction(async (trx) => {
      const sanction = await trx
        .selectFrom("provider_sanctions")
        .select(["id", "lifted_at", "appeal_status"])
        .where("id", "=", input.sanctionId)
        .forUpdate()
        .executeTakeFirst();
      if (!sanction) {
        throw new ReputationApplicationError(
          "SANCTION_NOT_FOUND",
          "Provider sanction not found",
          404,
        );
      }
      if (sanction.lifted_at) {
        throw new ReputationApplicationError(
          "SANCTION_ALREADY_LIFTED",
          "Provider sanction is already lifted",
          409,
        );
      }

      await trx
        .updateTable("provider_sanctions")
        .set({
          lifted_at: new Date(),
          lifted_by_user_id: input.adminUserId,
          lift_reason: input.reason,
          appeal_status:
            sanction.appeal_status === "submitted" ? "accepted" : sanction.appeal_status,
          appeal_decided_at: sanction.appeal_status === "submitted" ? new Date() : null,
          updated_at: new Date(),
        })
        .where("id", "=", input.sanctionId)
        .execute();
      await this.recordSanctionEvent(trx, {
        sanctionId: input.sanctionId,
        actorUserId: input.adminUserId,
        eventType: "lifted",
        reason: input.reason,
      });

      return this.getSanctionSummary(input.sanctionId, trx);
    });
  }

  private async recalculateProviderServiceRating(
    executor: DatabaseExecutor,
    serviceProfileId: string,
  ): Promise<void> {
    const aggregate = await executor
      .selectFrom("order_reviews")
      .select((eb) => [
        eb.fn.avg<number>("rating").as("average_rating"),
        eb.fn.count<number>("id").as("rating_count"),
      ])
      .where("provider_service_profile_id", "=", serviceProfileId)
      .where("direction", "=", "customer_to_provider")
      .executeTakeFirst();

    await executor
      .updateTable("provider_service_profiles")
      .set({
        rating_average:
          Number(aggregate?.rating_count ?? 0) > 0
            ? Number(aggregate?.average_rating ?? 0).toFixed(2)
            : null,
        rating_count: Number(aggregate?.rating_count ?? 0),
        updated_at: new Date(),
      })
      .where("id", "=", serviceProfileId)
      .execute();
  }

  private async getSanctionSummary(
    sanctionId: string,
    executor: DatabaseExecutor,
  ): Promise<ProviderSanctionSummary> {
    const sanction = await executor
      .selectFrom("provider_sanctions")
      .selectAll()
      .where("id", "=", sanctionId)
      .executeTakeFirstOrThrow();
    const events = await this.listEventsBySanctionIds([sanctionId], executor);

    return this.toSanctionSummary(sanction, events);
  }

  private async recordSanctionEvent(
    executor: DatabaseExecutor,
    input: {
      readonly sanctionId: string;
      readonly actorUserId: string;
      readonly eventType: ProviderSanctionEventType;
      readonly reason: string;
    },
  ): Promise<void> {
    await executor
      .insertInto("provider_sanction_events")
      .values({
        id: randomUUID(),
        sanction_id: input.sanctionId,
        actor_user_id: input.actorUserId,
        event_type: input.eventType,
        reason: input.reason,
      })
      .execute();
  }

  private async listEventsBySanctionIds(
    sanctionIds: ReadonlyArray<string>,
    executor: DatabaseExecutor,
  ): Promise<ReadonlyArray<ProviderSanctionEventRow>> {
    if (sanctionIds.length === 0) {
      return [];
    }

    return executor
      .selectFrom("provider_sanction_events")
      .select(["id", "sanction_id", "actor_user_id", "event_type", "reason", "occurred_at"])
      .where("sanction_id", "in", sanctionIds)
      .orderBy("occurred_at", "asc")
      .execute();
  }

  private toCustomerReliabilitySummary(
    customerUserId: string,
    orders: ReadonlyArray<{
      readonly status: OrderStatus;
      readonly selected_at: Date | null;
      readonly departed_at: Date | null;
      readonly arrived_at: Date | null;
    }>,
    providerReviewAverage: number,
    providerReviewCount: number,
  ): CustomerReliabilitySummary {
    const totalPublishedOrders = orders.length;
    const completedOrders = orders.filter((order) => order.status === "completed").length;
    const cancelledByCustomerOrders = orders.filter(
      (order) => order.status === "cancelled_by_customer",
    ).length;
    const cancellationsBeforeSelection = orders.filter(
      (order) => order.status === "cancelled_by_customer" && !order.selected_at,
    ).length;
    const cancellationsAfterSelection = orders.filter(
      (order) =>
        order.status === "cancelled_by_customer" && order.selected_at && !order.departed_at,
    ).length;
    const cancellationsAfterDeparture = orders.filter(
      (order) => order.status === "cancelled_by_customer" && order.departed_at && !order.arrived_at,
    ).length;
    const cancellationsAfterArrival = orders.filter(
      (order) => order.status === "cancelled_by_customer" && order.arrived_at,
    ).length;

    return {
      customerUserId,
      totalPublishedOrders,
      completedOrders,
      cancelledByCustomerOrders,
      cancellationsBeforeSelection,
      cancellationsAfterSelection,
      cancellationsAfterDeparture,
      cancellationsAfterArrival,
      cancellationRatePercent:
        totalPublishedOrders === 0
          ? 0
          : Math.round((cancelledByCustomerOrders / totalPublishedOrders) * 100),
      providerReviewCount,
      ...(providerReviewCount > 0
        ? { providerReviewAverage: providerReviewAverage.toFixed(2) }
        : {}),
    };
  }

  private toReviewSummary(row: OrderReviewRow): OrderReviewSummary {
    return {
      id: row.id,
      orderId: row.order_id,
      direction: row.direction,
      reviewerUserId: row.reviewer_user_id,
      revieweeUserId: row.reviewee_user_id,
      rating: row.rating,
      createdAt: row.created_at.toISOString(),
      ...(row.provider_service_profile_id
        ? { providerServiceProfileId: row.provider_service_profile_id }
        : {}),
      ...(row.comment ? { comment: row.comment } : {}),
    };
  }

  private toSanctionSummary(
    row: ProviderSanctionRow,
    events?: ReadonlyArray<ProviderSanctionEventRow>,
  ): ProviderSanctionSummary {
    return {
      id: row.id,
      providerUserId: row.provider_user_id,
      sanctionType: row.sanction_type,
      reason: row.reason,
      startsAt: row.starts_at.toISOString(),
      appealStatus: row.appeal_status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      ...(row.created_by_user_id ? { createdByUserId: row.created_by_user_id } : {}),
      ...(row.service_profile_id ? { serviceProfileId: row.service_profile_id } : {}),
      ...(row.ends_at ? { endsAt: row.ends_at.toISOString() } : {}),
      ...(row.lifted_at ? { liftedAt: row.lifted_at.toISOString() } : {}),
      ...(row.lifted_by_user_id ? { liftedByUserId: row.lifted_by_user_id } : {}),
      ...(row.lift_reason ? { liftReason: row.lift_reason } : {}),
      ...(row.appeal_reason ? { appealReason: row.appeal_reason } : {}),
      ...(row.appeal_submitted_at
        ? { appealSubmittedAt: row.appeal_submitted_at.toISOString() }
        : {}),
      ...(row.appeal_decided_at ? { appealDecidedAt: row.appeal_decided_at.toISOString() } : {}),
      ...(events ? { events: events.map((event) => this.toSanctionEventSummary(event)) } : {}),
    };
  }

  private toSanctionEventSummary(row: ProviderSanctionEventRow): ProviderSanctionEventSummary {
    return {
      id: row.id,
      sanctionId: row.sanction_id,
      eventType: row.event_type,
      reason: row.reason,
      occurredAt: row.occurred_at.toISOString(),
      ...(row.actor_user_id ? { actorUserId: row.actor_user_id } : {}),
    };
  }
}
