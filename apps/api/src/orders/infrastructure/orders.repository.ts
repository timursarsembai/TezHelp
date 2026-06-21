import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { sql, type Transaction } from "kysely";

import type {
  OrderImageSummary,
  OrderStatus,
  OrderSummary,
  ServiceCategorySlug,
} from "@tezhelp/types";

import { DatabaseService } from "../../foundation/database/database.service.js";
import type { DatabaseSchema } from "../../foundation/database/database.types.js";
import { OrderApplicationError } from "../domain/order-errors.js";

export interface OrderImageInput {
  readonly privateObjectKey: string;
  readonly originalFilename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

export interface CreateOrderInput {
  readonly customerUserId: string;
  readonly categorySlug: ServiceCategorySlug;
  readonly latitude: number;
  readonly longitude: number;
  readonly addressLandmark: string;
  readonly vehicleMake?: string;
  readonly vehicleModel?: string;
  readonly vehicleYear?: number;
  readonly description: string;
  readonly images: ReadonlyArray<OrderImageInput>;
  readonly unlockingLawfulAccess: Record<string, unknown>;
}

@Injectable()
export class OrdersRepository {
  constructor(private readonly database: DatabaseService) {}

  async transaction<T>(callback: (trx: Transaction<DatabaseSchema>) => Promise<T>): Promise<T> {
    return this.database.transaction(callback);
  }

  async createOrder(input: CreateOrderInput): Promise<OrderSummary> {
    if (input.images.length > 5) {
      throw new OrderApplicationError(
        "ORDER_IMAGE_LIMIT_EXCEEDED",
        "Order can have at most five images",
        400,
      );
    }

    return this.database.transaction(async (trx) => {
      await trx
        .insertInto("customer_profiles")
        .values({ user_id: input.customerUserId })
        .onConflict((oc) => oc.column("user_id").doNothing())
        .execute();

      const orderId = randomUUID();
      await trx
        .insertInto("orders")
        .values({
          id: orderId,
          customer_user_id: input.customerUserId,
          category_slug: input.categorySlug,
          status: "receiving_offers",
          city: "Almaty",
          location: sql`ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography`,
          address_landmark: input.addressLandmark,
          vehicle_make: input.vehicleMake ?? null,
          vehicle_model: input.vehicleModel ?? null,
          vehicle_year: input.vehicleYear ?? null,
          description: input.description,
          unlocking_lawful_access: input.unlockingLawfulAccess,
          unlocking_verification_status:
            input.categorySlug === "vehicle_unlocking" ? "pending" : "not_required",
          updated_at: new Date(),
        })
        .execute();

      await trx
        .insertInto("order_status_history")
        .values({
          order_id: orderId,
          from_status: null,
          to_status: "receiving_offers",
          actor_user_id: input.customerUserId,
          reason: "customer_published_order",
        })
        .execute();

      if (input.images.length > 0) {
        await trx
          .insertInto("order_images")
          .values(
            input.images.map((image, index) => ({
              order_id: orderId,
              private_object_key: image.privateObjectKey,
              original_filename: image.originalFilename,
              content_type: image.contentType,
              size_bytes: image.sizeBytes,
              sort_order: index,
            })),
          )
          .execute();
      }

      return this.getOrderById(orderId, trx);
    });
  }

  async getOrderById(
    orderId: string,
    executor: Transaction<DatabaseSchema> | DatabaseService["db"] = this.database.db,
  ): Promise<OrderSummary> {
    const row = await executor
      .selectFrom("orders")
      .selectAll()
      .select((eb) => [
        sql<number>`ST_Y((ST_AsText(${eb.ref("location")}::geometry))::geometry)`.as("latitude"),
        sql<number>`ST_X((ST_AsText(${eb.ref("location")}::geometry))::geometry)`.as("longitude"),
      ])
      .where("id", "=", orderId)
      .executeTakeFirst();
    if (!row) {
      throw new OrderApplicationError("ORDER_NOT_FOUND", "Order not found", 404);
    }

    const [images, count] = await Promise.all([
      executor
        .selectFrom("order_images")
        .selectAll()
        .where("order_id", "=", orderId)
        .orderBy("sort_order", "asc")
        .execute(),
      executor
        .selectFrom("offers")
        .select((eb) => eb.fn.countAll<number>().as("offer_count"))
        .where("order_id", "=", orderId)
        .executeTakeFirst(),
    ]);

    return this.toOrderSummary(row, images, Number(count?.offer_count ?? 0));
  }

  async appendStatusHistory(
    trx: Transaction<DatabaseSchema>,
    input: {
      readonly orderId: string;
      readonly fromStatus: OrderStatus;
      readonly toStatus: OrderStatus;
      readonly actorUserId: string;
      readonly reason: string;
      readonly metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await trx
      .insertInto("order_status_history")
      .values({
        order_id: input.orderId,
        from_status: input.fromStatus,
        to_status: input.toStatus,
        actor_user_id: input.actorUserId,
        reason: input.reason,
        metadata: input.metadata ?? {},
      })
      .execute();
  }

  private toOrderSummary(
    row: {
      readonly id: string;
      readonly customer_user_id: string;
      readonly category_slug: string;
      readonly status: OrderStatus;
      readonly city: string;
      readonly latitude: number;
      readonly longitude: number;
      readonly address_landmark: string;
      readonly vehicle_make: string | null;
      readonly vehicle_model: string | null;
      readonly vehicle_year: number | null;
      readonly description: string;
      readonly accepted_price_kzt: number | null;
      readonly assigned_provider_user_id: string | null;
      readonly assigned_provider_service_profile_id: string | null;
      readonly selected_offer_id: string | null;
      readonly commission_reservation_id: string | null;
      readonly created_at: Date;
      readonly published_at: Date;
      readonly selected_at: Date | null;
      readonly departed_at: Date | null;
      readonly arrived_at: Date | null;
      readonly work_started_at: Date | null;
      readonly completed_at: Date | null;
      readonly cancelled_at: Date | null;
      readonly cancellation_reason: string | null;
    },
    images: ReadonlyArray<{
      readonly id: string;
      readonly original_filename: string;
      readonly content_type: string;
      readonly size_bytes: number;
      readonly sort_order: number;
    }>,
    offerCount: number,
  ): OrderSummary {
    return {
      id: row.id,
      customerUserId: row.customer_user_id,
      categorySlug: row.category_slug as ServiceCategorySlug,
      status: row.status,
      city: row.city,
      latitude: row.latitude,
      longitude: row.longitude,
      addressLandmark: row.address_landmark,
      description: row.description,
      offerCount,
      images: images.map((image) => this.toImageSummary(image)),
      createdAt: row.created_at.toISOString(),
      publishedAt: row.published_at.toISOString(),
      ...(row.selected_at ? { selectedAt: row.selected_at.toISOString() } : {}),
      ...(row.departed_at ? { departedAt: row.departed_at.toISOString() } : {}),
      ...(row.arrived_at ? { arrivedAt: row.arrived_at.toISOString() } : {}),
      ...(row.work_started_at ? { workStartedAt: row.work_started_at.toISOString() } : {}),
      ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
      ...(row.cancelled_at ? { cancelledAt: row.cancelled_at.toISOString() } : {}),
      ...(row.cancellation_reason ? { cancellationReason: row.cancellation_reason } : {}),
      ...(row.vehicle_make ? { vehicleMake: row.vehicle_make } : {}),
      ...(row.vehicle_model ? { vehicleModel: row.vehicle_model } : {}),
      ...(row.vehicle_year ? { vehicleYear: row.vehicle_year } : {}),
      ...(row.accepted_price_kzt ? { acceptedPriceKzt: row.accepted_price_kzt } : {}),
      ...(row.assigned_provider_user_id
        ? { assignedProviderUserId: row.assigned_provider_user_id }
        : {}),
      ...(row.assigned_provider_service_profile_id
        ? { assignedProviderServiceProfileId: row.assigned_provider_service_profile_id }
        : {}),
      ...(row.selected_offer_id ? { selectedOfferId: row.selected_offer_id } : {}),
      ...(row.commission_reservation_id
        ? { commissionReservationId: row.commission_reservation_id }
        : {}),
    };
  }

  private toImageSummary(row: {
    readonly id: string;
    readonly original_filename: string;
    readonly content_type: string;
    readonly size_bytes: number;
    readonly sort_order: number;
  }): OrderImageSummary {
    return {
      id: row.id,
      originalFilename: row.original_filename,
      contentType: row.content_type,
      sizeBytes: row.size_bytes,
      sortOrder: row.sort_order,
    };
  }
}
