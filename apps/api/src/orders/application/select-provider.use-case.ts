import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";

import type { OrderSummary } from "@tezhelp/types";

import { CommissionCalculator } from "../../commissions/domain/commission-calculator.js";
import { DatabaseService } from "../../foundation/database/database.service.js";
import { WalletRepository } from "../../wallet/infrastructure/wallet.repository.js";
import { WalletApplicationError } from "../../wallet/domain/wallet-errors.js";
import { OrderApplicationError } from "../domain/order-errors.js";
import { OrdersRepository } from "../infrastructure/orders.repository.js";

@Injectable()
export class SelectProviderUseCase {
  constructor(
    private readonly database: DatabaseService,
    private readonly orders: OrdersRepository,
    private readonly wallet: WalletRepository,
    private readonly commissionCalculator: CommissionCalculator,
  ) {}

  async execute(input: {
    readonly customerUserId: string;
    readonly orderId: string;
    readonly offerId: string;
    readonly idempotencyKey: string;
  }): Promise<OrderSummary> {
    return this.database.transaction(async (trx) => {
      const order = await trx
        .selectFrom("orders")
        .innerJoin("service_categories", "service_categories.slug", "orders.category_slug")
        .selectAll("orders")
        .select([
          "service_categories.commission_strategy",
          "service_categories.commission_percentage_bps",
          "service_categories.commission_fixed_kzt",
          "service_categories.operational_minimum_kzt",
        ])
        .where("orders.id", "=", input.orderId)
        .where("orders.customer_user_id", "=", input.customerUserId)
        .forUpdate()
        .executeTakeFirst();
      if (!order) {
        throw new OrderApplicationError("ORDER_NOT_FOUND", "Order not found", 404);
      }
      if (order.status === "provider_selected" && order.selected_offer_id === input.offerId) {
        return this.orders.getOrderById(input.orderId, trx);
      }
      if (order.status !== "receiving_offers") {
        throw new OrderApplicationError(
          "ORDER_NOT_SELECTABLE",
          "Order cannot select provider in current status",
          409,
        );
      }

      const offer = await trx
        .selectFrom("offers")
        .selectAll()
        .where("id", "=", input.offerId)
        .where("order_id", "=", input.orderId)
        .forUpdate()
        .executeTakeFirst();
      if (!offer || offer.status !== "active") {
        throw new OrderApplicationError("OFFER_NOT_SELECTABLE", "Offer is not selectable", 409);
      }

      const serviceProfile = await trx
        .selectFrom("provider_service_profiles")
        .innerJoin("users", "users.id", "provider_service_profiles.provider_user_id")
        .innerJoin(
          "provider_profiles",
          "provider_profiles.user_id",
          "provider_service_profiles.provider_user_id",
        )
        .select([
          "provider_service_profiles.category_slug",
          "provider_service_profiles.moderation_status",
          "provider_service_profiles.suspended_at",
          "users.status as user_status",
          "provider_profiles.availability_status",
        ])
        .where("provider_service_profiles.id", "=", offer.provider_service_profile_id)
        .where("provider_service_profiles.provider_user_id", "=", offer.provider_user_id)
        .executeTakeFirst();
      if (
        !serviceProfile ||
        serviceProfile.category_slug !== order.category_slug ||
        serviceProfile.moderation_status !== "approved" ||
        serviceProfile.suspended_at !== null ||
        serviceProfile.user_status === "blocked" ||
        serviceProfile.availability_status === "suspended"
      ) {
        throw new OrderApplicationError("OFFER_NOT_SELECTABLE", "Provider is not eligible", 409);
      }

      const otherActive = await trx
        .selectFrom("orders")
        .select("id")
        .where("assigned_provider_user_id", "=", offer.provider_user_id)
        .where("id", "<>", input.orderId)
        .where("status", "in", [
          "provider_selected",
          "provider_en_route",
          "provider_arrived",
          "in_progress",
        ])
        .executeTakeFirst();
      if (otherActive) {
        throw new OrderApplicationError(
          "OFFER_NOT_SELECTABLE",
          "Provider already has an active order",
          409,
        );
      }

      const wallet = await this.wallet.ensureWalletForUpdate(trx, offer.provider_user_id);
      const commissionAmount = this.commissionCalculator.calculate(offer.price_kzt, {
        strategy: order.commission_strategy,
        percentageBps: order.commission_percentage_bps,
        fixedKzt: order.commission_fixed_kzt,
      });
      if (wallet.availableBalanceKzt < Math.max(order.operational_minimum_kzt, commissionAmount)) {
        throw new WalletApplicationError(
          "PROVIDER_BALANCE_INSUFFICIENT",
          "Provider balance is insufficient for commission reservation",
          409,
        );
      }

      const reservationId = randomUUID();
      await trx
        .insertInto("commission_reservations")
        .values({
          id: reservationId,
          order_id: input.orderId,
          offer_id: offer.id,
          provider_user_id: offer.provider_user_id,
          amount_kzt: commissionAmount,
          state: "reserved",
          idempotency_key: input.idempotencyKey,
          updated_at: new Date(),
        })
        .execute();

      await this.wallet.applyLedgerEntry(trx, {
        providerUserId: offer.provider_user_id,
        entryType: "commission_reserve",
        amountKzt: commissionAmount,
        availableDeltaKzt: -commissionAmount,
        reservedDeltaKzt: commissionAmount,
        actorUserId: input.customerUserId,
        reason: "customer_selected_provider",
        idempotencyKey: `select:${input.idempotencyKey}:commission-reserve`,
        relatedOrderId: input.orderId,
        relatedOfferId: offer.id,
        relatedCommissionReservationId: reservationId,
      });

      await trx
        .updateTable("offers")
        .set({ status: "accepted", updated_at: new Date() })
        .where("id", "=", offer.id)
        .execute();
      await trx
        .updateTable("offers")
        .set({ status: "unavailable", updated_at: new Date() })
        .where("id", "<>", offer.id)
        .where((eb) =>
          eb.or([
            eb("order_id", "=", input.orderId),
            eb("provider_user_id", "=", offer.provider_user_id),
          ]),
        )
        .where("status", "=", "active")
        .execute();
      await trx
        .updateTable("orders")
        .set({
          status: "provider_selected",
          assigned_provider_user_id: offer.provider_user_id,
          assigned_provider_service_profile_id: offer.provider_service_profile_id,
          accepted_price_kzt: offer.price_kzt,
          selected_offer_id: offer.id,
          commission_reservation_id: reservationId,
          selected_at: new Date(),
          updated_at: new Date(),
        })
        .where("id", "=", input.orderId)
        .execute();

      await this.orders.appendStatusHistory(trx, {
        orderId: input.orderId,
        fromStatus: order.status,
        toStatus: "provider_selected",
        actorUserId: input.customerUserId,
        reason: "customer_selected_provider",
        metadata: { offerId: offer.id, commissionReservationId: reservationId },
      });
      await trx
        .insertInto("audit_events")
        .values({
          actor_id: input.customerUserId,
          action: "order.provider_selected",
          reason: "customer_selected_provider",
          related_entity_type: "order",
          related_entity_id: input.orderId,
          metadata: {
            offerId: offer.id,
            providerUserId: offer.provider_user_id,
            commissionReservationId: reservationId,
            acceptedPriceKzt: offer.price_kzt,
          },
        })
        .execute();

      return this.orders.getOrderById(input.orderId, trx);
    });
  }
}
