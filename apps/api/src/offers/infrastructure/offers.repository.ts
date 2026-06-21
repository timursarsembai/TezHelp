import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { sql, type Transaction } from "kysely";

import type {
  OfferStatus,
  OfferSummary,
  ProviderOrderDiscoveryItem,
  ProviderOrderDiscoveryPreference,
  ServiceCategorySlug,
} from "@tezhelp/types";

import { CommissionCalculator } from "../../commissions/domain/commission-calculator.js";
import { DatabaseService } from "../../foundation/database/database.service.js";
import type { DatabaseSchema } from "../../foundation/database/database.types.js";
import { WalletRepository } from "../../wallet/infrastructure/wallet.repository.js";
import { OfferApplicationError } from "../domain/offer-errors.js";

export interface SubmitOfferInput {
  readonly providerUserId: string;
  readonly orderId: string;
  readonly providerServiceProfileId: string;
  readonly priceKzt: number;
  readonly arrivalMinutes: number;
  readonly comment: string;
  readonly idempotencyKey: string;
}

@Injectable()
export class OffersRepository {
  constructor(
    private readonly database: DatabaseService,
    private readonly wallet: WalletRepository,
    private readonly commissionCalculator: CommissionCalculator,
  ) {}

  async getDiscoveryPreference(providerUserId: string): Promise<ProviderOrderDiscoveryPreference> {
    await this.ensureDiscoveryPreference(providerUserId);
    const row = await this.database.db
      .selectFrom("provider_order_discovery_preferences")
      .selectAll()
      .where("provider_user_id", "=", providerUserId)
      .executeTakeFirstOrThrow();

    return {
      nearbyEnabled: row.nearby_enabled,
      radiusMeters: row.radius_meters,
      referenceLatitude: Number(row.reference_latitude),
      referenceLongitude: Number(row.reference_longitude),
    };
  }

  async updateDiscoveryPreference(
    providerUserId: string,
    input: ProviderOrderDiscoveryPreference,
  ): Promise<ProviderOrderDiscoveryPreference> {
    await this.ensureDiscoveryPreference(providerUserId);
    const row = await this.database.db
      .updateTable("provider_order_discovery_preferences")
      .set({
        nearby_enabled: input.nearbyEnabled,
        radius_meters: input.radiusMeters,
        reference_latitude: String(input.referenceLatitude),
        reference_longitude: String(input.referenceLongitude),
        updated_at: new Date(),
      })
      .where("provider_user_id", "=", providerUserId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      nearbyEnabled: row.nearby_enabled,
      radiusMeters: row.radius_meters,
      referenceLatitude: Number(row.reference_latitude),
      referenceLongitude: Number(row.reference_longitude),
    };
  }

  async listDiscoverableOrders(
    providerUserId: string,
  ): Promise<ReadonlyArray<ProviderOrderDiscoveryItem>> {
    const preference = await this.getDiscoveryPreference(providerUserId);
    const baseQuery = this.database.db
      .selectFrom("orders")
      .innerJoin("provider_service_profiles", (join) =>
        join
          .onRef("provider_service_profiles.category_slug", "=", "orders.category_slug")
          .on("provider_service_profiles.provider_user_id", "=", providerUserId)
          .on("provider_service_profiles.moderation_status", "=", "approved")
          .on("provider_service_profiles.suspended_at", "is", null),
      )
      .leftJoin("offers", "offers.order_id", "orders.id")
      .selectAll("orders")
      .select([
        "provider_service_profiles.id as provider_service_profile_id",
        (eb) => eb.fn.count<number>("offers.id").as("offer_count"),
      ])
      .select((eb) => [
        sql<number>`ST_Y(${eb.ref("orders.location")}::geometry)`.as("latitude"),
        sql<number>`ST_X(${eb.ref("orders.location")}::geometry)`.as("longitude"),
        sql<number>`ST_Distance(${eb.ref("orders.location")}, ST_SetSRID(ST_MakePoint(${preference.referenceLongitude}, ${preference.referenceLatitude}), 4326)::geography)`.as(
          "distance_meters",
        ),
      ])
      .where("orders.status", "=", "receiving_offers")
      .where("orders.city", "=", "Almaty")
      .groupBy([
        "orders.id",
        "provider_service_profiles.id",
        "orders.location",
        "orders.customer_user_id",
        "orders.category_slug",
        "orders.status",
        "orders.city",
        "orders.address_landmark",
        "orders.vehicle_make",
        "orders.vehicle_model",
        "orders.vehicle_year",
        "orders.description",
        "orders.unlocking_lawful_access",
        "orders.unlocking_verification_status",
        "orders.assigned_provider_user_id",
        "orders.assigned_provider_service_profile_id",
        "orders.accepted_price_kzt",
        "orders.selected_offer_id",
        "orders.commission_reservation_id",
        "orders.published_at",
        "orders.selected_at",
        "orders.created_at",
        "orders.updated_at",
      ])
      .orderBy("orders.published_at", "desc");

    const rows = preference.nearbyEnabled
      ? await baseQuery
          .where(
            sql<boolean>`ST_DWithin(orders.location, ST_SetSRID(ST_MakePoint(${preference.referenceLongitude}, ${preference.referenceLatitude}), 4326)::geography, ${preference.radiusMeters})`,
          )
          .execute()
      : await baseQuery.execute();

    return rows.map((row) => ({
      providerServiceProfileId: row.provider_service_profile_id,
      offerCount: Number(row.offer_count),
      distanceMeters: Math.round(Number(row.distance_meters)),
      order: {
        id: row.id,
        customerUserId: row.customer_user_id,
        categorySlug: row.category_slug as ServiceCategorySlug,
        status: row.status,
        city: row.city,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        addressLandmark: row.address_landmark,
        description: row.description,
        offerCount: Number(row.offer_count),
        images: [],
        createdAt: row.created_at.toISOString(),
        publishedAt: row.published_at.toISOString(),
        ...(row.vehicle_make ? { vehicleMake: row.vehicle_make } : {}),
        ...(row.vehicle_model ? { vehicleModel: row.vehicle_model } : {}),
        ...(row.vehicle_year ? { vehicleYear: row.vehicle_year } : {}),
      },
    }));
  }

  async submitOffer(input: SubmitOfferInput): Promise<OfferSummary> {
    return this.database.transaction(async (trx) => {
      const existingByIdempotency = await trx
        .selectFrom("offers")
        .selectAll()
        .where("provider_user_id", "=", input.providerUserId)
        .where("idempotency_key", "=", input.idempotencyKey)
        .executeTakeFirst();
      if (existingByIdempotency) {
        if (
          existingByIdempotency.order_id !== input.orderId ||
          existingByIdempotency.price_kzt !== input.priceKzt ||
          existingByIdempotency.arrival_minutes !== input.arrivalMinutes
        ) {
          throw new OfferApplicationError(
            "IDEMPOTENCY_CONFLICT",
            "Offer idempotency key was reused with different input",
            409,
          );
        }

        return this.toOfferSummary(existingByIdempotency);
      }

      const order = await trx
        .selectFrom("orders")
        .innerJoin("service_categories", "service_categories.slug", "orders.category_slug")
        .selectAll("orders")
        .select([
          "service_categories.response_fee_kzt",
          "service_categories.commission_strategy",
          "service_categories.commission_percentage_bps",
          "service_categories.commission_fixed_kzt",
          "service_categories.operational_minimum_kzt",
        ])
        .where("orders.id", "=", input.orderId)
        .forUpdate()
        .executeTakeFirst();
      if (!order || order.status !== "receiving_offers") {
        throw new OfferApplicationError("ORDER_NOT_AVAILABLE", "Order is not available", 409);
      }

      const duplicate = await trx
        .selectFrom("offers")
        .select(["id"])
        .where("order_id", "=", input.orderId)
        .where("provider_user_id", "=", input.providerUserId)
        .executeTakeFirst();
      if (duplicate) {
        throw new OfferApplicationError("DUPLICATE_OFFER", "Provider already offered", 409);
      }

      await this.assertProviderEligible(trx, {
        providerUserId: input.providerUserId,
        providerServiceProfileId: input.providerServiceProfileId,
        categorySlug: order.category_slug,
      });

      const activeOrder = await trx
        .selectFrom("orders")
        .select("id")
        .where("assigned_provider_user_id", "=", input.providerUserId)
        .where("status", "in", [
          "provider_selected",
          "provider_en_route",
          "provider_arrived",
          "in_progress",
        ])
        .executeTakeFirst();
      if (activeOrder) {
        throw new OfferApplicationError(
          "PROVIDER_HAS_ACTIVE_ORDER",
          "Provider already has an active order",
          409,
        );
      }

      const wallet = await this.wallet.ensureWalletForUpdate(trx, input.providerUserId);
      const potentialCommission = this.commissionCalculator.calculate(input.priceKzt, {
        strategy: order.commission_strategy,
        percentageBps: order.commission_percentage_bps,
        fixedKzt: order.commission_fixed_kzt,
      });
      const willUseFreeCredit = wallet.freeResponsesRemaining > 0;
      const responseFee = willUseFreeCredit ? 0 : order.response_fee_kzt;
      const requiredBalance =
        Math.max(order.operational_minimum_kzt, potentialCommission) + responseFee;
      if (wallet.availableBalanceKzt < requiredBalance) {
        throw new OfferApplicationError(
          "PROVIDER_BALANCE_INSUFFICIENT",
          "Provider balance is insufficient",
          409,
        );
      }

      const offerCount = await trx
        .selectFrom("offers")
        .select((eb) => eb.fn.countAll<number>().as("offer_count"))
        .where("order_id", "=", input.orderId)
        .executeTakeFirst();
      const offerId = randomUUID();
      const ledger = await this.wallet.applyLedgerEntry(trx, {
        providerUserId: input.providerUserId,
        entryType: "response_fee_charge",
        amountKzt: responseFee,
        availableDeltaKzt: -responseFee,
        reservedDeltaKzt: 0,
        actorUserId: input.providerUserId,
        reason: willUseFreeCredit ? "free_response_credit_consumed" : "response_fee_charged",
        idempotencyKey: `offer:${input.idempotencyKey}:response-fee`,
        relatedOrderId: input.orderId,
        relatedOfferId: offerId,
        metadata: { freeResponseCreditUsed: willUseFreeCredit },
      });
      if (willUseFreeCredit) {
        await this.wallet.consumeFreeResponse(trx, input.providerUserId);
      }

      const row = await trx
        .insertInto("offers")
        .values({
          id: offerId,
          order_id: input.orderId,
          provider_user_id: input.providerUserId,
          provider_service_profile_id: input.providerServiceProfileId,
          price_kzt: input.priceKzt,
          arrival_minutes: input.arrivalMinutes,
          comment: input.comment,
          status: "active",
          response_fee_kzt: responseFee,
          free_response_credit_used: willUseFreeCredit,
          response_fee_ledger_entry_id: ledger.id,
          idempotency_key: input.idempotencyKey,
          updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return {
        ...this.toOfferSummary(row),
        offerCountBeforeSubmission: Number(offerCount?.offer_count ?? 0),
      };
    });
  }

  async listOrderOffers(orderId: string): Promise<ReadonlyArray<OfferSummary>> {
    const rows = await this.database.db
      .selectFrom("offers")
      .selectAll()
      .where("order_id", "=", orderId)
      .orderBy("created_at", "asc")
      .execute();

    return rows.map((row) => this.toOfferSummary(row));
  }

  private async ensureDiscoveryPreference(providerUserId: string): Promise<void> {
    await this.database.db
      .insertInto("provider_order_discovery_preferences")
      .values({ provider_user_id: providerUserId })
      .onConflict((oc) => oc.column("provider_user_id").doNothing())
      .execute();
  }

  private async assertProviderEligible(
    trx: Transaction<DatabaseSchema>,
    input: {
      readonly providerUserId: string;
      readonly providerServiceProfileId: string;
      readonly categorySlug: string;
    },
  ): Promise<void> {
    const profile = await trx
      .selectFrom("provider_service_profiles")
      .innerJoin("users", "users.id", "provider_service_profiles.provider_user_id")
      .innerJoin(
        "provider_profiles",
        "provider_profiles.user_id",
        "provider_service_profiles.provider_user_id",
      )
      .select([
        "provider_service_profiles.moderation_status",
        "provider_service_profiles.suspended_at",
        "provider_service_profiles.category_slug",
        "users.status as user_status",
        "provider_profiles.availability_status",
      ])
      .where("provider_service_profiles.id", "=", input.providerServiceProfileId)
      .where("provider_service_profiles.provider_user_id", "=", input.providerUserId)
      .executeTakeFirst();
    if (!profile) {
      throw new OfferApplicationError(
        "PROVIDER_NOT_ELIGIBLE",
        "Provider service profile was not found",
        403,
      );
    }
    if (
      profile.category_slug !== input.categorySlug ||
      profile.moderation_status !== "approved" ||
      profile.suspended_at !== null
    ) {
      throw new OfferApplicationError(
        "PROVIDER_SERVICE_PROFILE_NOT_APPROVED",
        "Provider service profile is not approved for this order category",
        403,
      );
    }
    if (profile.user_status === "blocked" || profile.availability_status === "suspended") {
      throw new OfferApplicationError("PROVIDER_NOT_ELIGIBLE", "Provider is blocked", 403);
    }
  }

  private toOfferSummary(row: {
    readonly id: string;
    readonly order_id: string;
    readonly provider_user_id: string;
    readonly provider_service_profile_id: string;
    readonly price_kzt: number;
    readonly arrival_minutes: number;
    readonly comment: string;
    readonly status: OfferStatus;
    readonly response_fee_kzt: number;
    readonly free_response_credit_used: boolean;
    readonly created_at: Date;
  }): OfferSummary {
    return {
      id: row.id,
      orderId: row.order_id,
      providerUserId: row.provider_user_id,
      providerServiceProfileId: row.provider_service_profile_id,
      priceKzt: row.price_kzt,
      arrivalMinutes: row.arrival_minutes,
      comment: row.comment,
      status: row.status,
      responseFeeKzt: row.response_fee_kzt,
      freeResponseCreditUsed: row.free_response_credit_used,
      createdAt: row.created_at.toISOString(),
    };
  }
}
