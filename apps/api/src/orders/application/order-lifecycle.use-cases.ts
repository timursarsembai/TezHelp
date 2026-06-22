import { Injectable } from "@nestjs/common";
import type { Transaction } from "kysely";

import type { OrderContactSummary, OrderStatus, OrderSummary } from "@tezhelp/types";

import { DatabaseService } from "../../foundation/database/database.service.js";
import type { DatabaseSchema } from "../../foundation/database/database.types.js";
import { WalletRepository } from "../../wallet/infrastructure/wallet.repository.js";
import { OrderApplicationError } from "../domain/order-errors.js";
import {
  type CancellationActor,
  type CommissionCancellationAction,
  OrderTransitionPolicy,
} from "../domain/order-transition-policy.js";
import { OrdersRepository } from "../infrastructure/orders.repository.js";

type TimestampColumnName = "departed_at" | "arrived_at" | "work_started_at";

interface LockedOrder {
  readonly id: string;
  readonly customer_user_id: string;
  readonly status: OrderStatus;
  readonly assigned_provider_user_id: string | null;
  readonly assigned_provider_service_profile_id: string | null;
  readonly commission_reservation_id: string | null;
  readonly terminal_idempotency_key: string | null;
}

@Injectable()
export class ConfirmProviderDepartureUseCase {
  constructor(
    private readonly database: DatabaseService,
    private readonly orders: OrdersRepository,
  ) {}

  async execute(input: {
    readonly providerUserId: string;
    readonly orderId: string;
  }): Promise<OrderSummary> {
    return transitionAssignedProviderOrder(this.database, this.orders, {
      providerUserId: input.providerUserId,
      orderId: input.orderId,
      nextStatus: "provider_en_route",
      timestampColumn: "departed_at",
      reason: "provider_confirmed_departure",
      auditAction: "order.provider_departed",
    });
  }
}

@Injectable()
export class ConfirmProviderArrivalUseCase {
  constructor(
    private readonly database: DatabaseService,
    private readonly orders: OrdersRepository,
  ) {}

  async execute(input: {
    readonly providerUserId: string;
    readonly orderId: string;
  }): Promise<OrderSummary> {
    return transitionAssignedProviderOrder(this.database, this.orders, {
      providerUserId: input.providerUserId,
      orderId: input.orderId,
      nextStatus: "provider_arrived",
      timestampColumn: "arrived_at",
      reason: "provider_confirmed_arrival",
      auditAction: "order.provider_arrived",
    });
  }
}

@Injectable()
export class StartOrderWorkUseCase {
  constructor(
    private readonly database: DatabaseService,
    private readonly orders: OrdersRepository,
  ) {}

  async execute(input: {
    readonly providerUserId: string;
    readonly orderId: string;
  }): Promise<OrderSummary> {
    return transitionAssignedProviderOrder(this.database, this.orders, {
      providerUserId: input.providerUserId,
      orderId: input.orderId,
      nextStatus: "in_progress",
      timestampColumn: "work_started_at",
      reason: "provider_started_work",
      auditAction: "order.work_started",
    });
  }
}

@Injectable()
export class CompleteOrderUseCase {
  constructor(
    private readonly database: DatabaseService,
    private readonly orders: OrdersRepository,
    private readonly wallet: WalletRepository,
  ) {}

  async execute(input: {
    readonly providerUserId: string;
    readonly orderId: string;
    readonly idempotencyKey: string;
  }): Promise<OrderSummary> {
    return this.database.transaction(async (trx) => {
      const order = await lockOrder(trx, input.orderId);
      assertAssignedProvider(order, input.providerUserId);
      if (order.status === "completed" && order.terminal_idempotency_key === input.idempotencyKey) {
        return this.orders.getOrderById(input.orderId, trx);
      }
      assertNotTerminalForDifferentCommand(order, input.idempotencyKey);
      OrderTransitionPolicy.assertCompletionAllowed(order.status);
      const reservationId = requireReservation(order);

      await this.wallet.captureCommissionReservation(trx, {
        providerUserId: input.providerUserId,
        reservationId,
        actorUserId: input.providerUserId,
        reason: "provider_completed_order",
        idempotencyKey: `complete:${input.idempotencyKey}:commission-capture`,
      });

      const now = new Date();
      await trx
        .updateTable("orders")
        .set({
          status: "completed",
          completed_at: now,
          terminal_idempotency_key: input.idempotencyKey,
          updated_at: now,
        })
        .where("id", "=", input.orderId)
        .execute();
      if (order.assigned_provider_service_profile_id) {
        await trx
          .updateTable("provider_service_profiles")
          .set((eb) => ({
            completed_order_count: eb("completed_order_count", "+", 1),
            updated_at: now,
          }))
          .where("id", "=", order.assigned_provider_service_profile_id)
          .execute();
      }
      await this.orders.appendStatusHistory(trx, {
        orderId: input.orderId,
        fromStatus: order.status,
        toStatus: "completed",
        actorUserId: input.providerUserId,
        reason: "provider_completed_order",
        metadata: { commissionReservationId: reservationId },
      });
      await writeOrderAudit(trx, {
        actorUserId: input.providerUserId,
        action: "order.completed",
        reason: "provider_completed_order",
        orderId: input.orderId,
        metadata: { commissionReservationId: reservationId },
      });

      return this.orders.getOrderById(input.orderId, trx);
    });
  }
}

@Injectable()
export class CancelOrderUseCase {
  constructor(
    private readonly database: DatabaseService,
    private readonly orders: OrdersRepository,
    private readonly wallet: WalletRepository,
  ) {}

  async execute(input: {
    readonly actor: CancellationActor;
    readonly actorUserId: string;
    readonly orderId: string;
    readonly reason: string;
    readonly idempotencyKey: string;
    readonly holdCommissionForReview?: boolean;
  }): Promise<OrderSummary> {
    return this.database.transaction(async (trx) => {
      const order = await lockOrder(trx, input.orderId);
      assertCancellationActor(order, input.actor, input.actorUserId);
      if (
        order.status === expectedCancelledStatus(input.actor) &&
        order.terminal_idempotency_key === input.idempotencyKey
      ) {
        return this.orders.getOrderById(input.orderId, trx);
      }
      assertNotTerminalForDifferentCommand(order, input.idempotencyKey);

      const outcome = OrderTransitionPolicy.cancellationOutcome(
        input.actor,
        order.status,
        input.holdCommissionForReview,
      );
      await applyCancellationCommissionAction(trx, this.wallet, {
        order,
        actorUserId: input.actorUserId,
        action: outcome.commissionAction,
        idempotencyKey: input.idempotencyKey,
      });

      const now = new Date();
      await trx
        .updateTable("orders")
        .set({
          status: outcome.status,
          cancelled_at: now,
          cancelled_by_user_id: input.actorUserId,
          cancellation_reason: input.reason,
          terminal_idempotency_key: input.idempotencyKey,
          updated_at: now,
        })
        .where("id", "=", input.orderId)
        .execute();
      await trx
        .updateTable("offers")
        .set({ status: "unavailable", updated_at: now })
        .where("order_id", "=", input.orderId)
        .where("status", "=", "active")
        .execute();
      if (input.actor === "provider" && order.assigned_provider_service_profile_id) {
        await trx
          .updateTable("provider_service_profiles")
          .set((eb) => ({
            cancellation_count: eb("cancellation_count", "+", 1),
            updated_at: now,
          }))
          .where("id", "=", order.assigned_provider_service_profile_id)
          .execute();
      }
      await this.orders.appendStatusHistory(trx, {
        orderId: input.orderId,
        fromStatus: order.status,
        toStatus: outcome.status,
        actorUserId: input.actorUserId,
        reason: input.reason,
        metadata: {
          actor: input.actor,
          commissionAction: outcome.commissionAction,
          commissionReservationId: order.commission_reservation_id,
        },
      });
      await writeOrderAudit(trx, {
        actorUserId: input.actorUserId,
        action: "order.cancelled",
        reason: input.reason,
        orderId: input.orderId,
        metadata: {
          actor: input.actor,
          status: outcome.status,
          commissionAction: outcome.commissionAction,
        },
      });

      return this.orders.getOrderById(input.orderId, trx);
    });
  }
}

@Injectable()
export class GetOrderContactUseCase {
  constructor(private readonly database: DatabaseService) {}

  async execute(input: {
    readonly viewerUserId: string;
    readonly orderId: string;
  }): Promise<OrderContactSummary> {
    const row = await this.database.db
      .selectFrom("orders")
      .innerJoin("users as customer", "customer.id", "orders.customer_user_id")
      .leftJoin("users as provider", "provider.id", "orders.assigned_provider_user_id")
      .select([
        "orders.id",
        "orders.status",
        "orders.customer_user_id",
        "orders.assigned_provider_user_id",
        "customer.verified_phone as customer_phone",
        "provider.verified_phone as provider_phone",
      ])
      .where("orders.id", "=", input.orderId)
      .executeTakeFirst();
    if (!row) {
      throw new OrderApplicationError("ORDER_NOT_FOUND", "Order not found", 404);
    }

    const viewerRole =
      row.customer_user_id === input.viewerUserId
        ? "customer"
        : row.assigned_provider_user_id === input.viewerUserId
          ? "provider"
          : undefined;
    if (!viewerRole) {
      throw new OrderApplicationError(
        "ORDER_CONTACT_FORBIDDEN",
        "Order contact is not visible to this user",
        403,
      );
    }

    const contactVisible = OrderTransitionPolicy.contactVisible(row.status);
    return {
      orderId: row.id,
      viewerRole,
      contactVisible,
      ...(contactVisible && row.customer_phone ? { customerPhone: row.customer_phone } : {}),
      ...(contactVisible && row.provider_phone ? { providerPhone: row.provider_phone } : {}),
    };
  }
}

async function transitionAssignedProviderOrder(
  database: DatabaseService,
  orders: OrdersRepository,
  input: {
    readonly providerUserId: string;
    readonly orderId: string;
    readonly nextStatus: Extract<
      OrderStatus,
      "provider_en_route" | "provider_arrived" | "in_progress"
    >;
    readonly timestampColumn: TimestampColumnName;
    readonly reason: string;
    readonly auditAction: string;
  },
): Promise<OrderSummary> {
  return database.transaction(async (trx) => {
    const order = await lockOrder(trx, input.orderId);
    assertAssignedProvider(order, input.providerUserId);
    if (order.status === input.nextStatus) {
      return orders.getOrderById(input.orderId, trx);
    }
    OrderTransitionPolicy.assertProviderTransition(order.status, input.nextStatus);

    const now = new Date();
    await trx
      .updateTable("orders")
      .set({
        status: input.nextStatus,
        [input.timestampColumn]: now,
        updated_at: now,
      })
      .where("id", "=", input.orderId)
      .execute();
    await orders.appendStatusHistory(trx, {
      orderId: input.orderId,
      fromStatus: order.status,
      toStatus: input.nextStatus,
      actorUserId: input.providerUserId,
      reason: input.reason,
    });
    await writeOrderAudit(trx, {
      actorUserId: input.providerUserId,
      action: input.auditAction,
      reason: input.reason,
      orderId: input.orderId,
      metadata: {},
    });

    return orders.getOrderById(input.orderId, trx);
  });
}

async function lockOrder(trx: Transaction<DatabaseSchema>, orderId: string): Promise<LockedOrder> {
  const order = await trx
    .selectFrom("orders")
    .select([
      "id",
      "customer_user_id",
      "status",
      "assigned_provider_user_id",
      "assigned_provider_service_profile_id",
      "commission_reservation_id",
      "terminal_idempotency_key",
    ])
    .where("id", "=", orderId)
    .forUpdate()
    .executeTakeFirst();
  if (!order) {
    throw new OrderApplicationError("ORDER_NOT_FOUND", "Order not found", 404);
  }

  return order;
}

function assertAssignedProvider(order: LockedOrder, providerUserId: string): void {
  if (order.assigned_provider_user_id !== providerUserId) {
    throw new OrderApplicationError(
      "ORDER_PROVIDER_FORBIDDEN",
      "Only the assigned provider can change this order",
      403,
    );
  }
}

function assertCancellationActor(
  order: LockedOrder,
  actor: CancellationActor,
  actorUserId: string,
): void {
  if (actor === "customer" && order.customer_user_id !== actorUserId) {
    throw new OrderApplicationError(
      "ORDER_CUSTOMER_FORBIDDEN",
      "Only the customer can cancel this order as customer",
      403,
    );
  }
  if (actor === "provider") {
    assertAssignedProvider(order, actorUserId);
  }
}

function assertNotTerminalForDifferentCommand(order: LockedOrder, idempotencyKey: string): void {
  if (
    OrderTransitionPolicy.isTerminal(order.status) &&
    order.terminal_idempotency_key !== idempotencyKey
  ) {
    throw new OrderApplicationError("ORDER_ALREADY_TERMINAL", "Order is already terminal", 409);
  }
}

function requireReservation(order: LockedOrder): string {
  if (!order.commission_reservation_id || !order.assigned_provider_user_id) {
    throw new OrderApplicationError(
      "ORDER_COMMISSION_RESERVATION_MISSING",
      "Order does not have a commission reservation",
      409,
    );
  }

  return order.commission_reservation_id;
}

async function applyCancellationCommissionAction(
  trx: Transaction<DatabaseSchema>,
  wallet: WalletRepository,
  input: {
    readonly order: LockedOrder;
    readonly actorUserId: string;
    readonly action: CommissionCancellationAction;
    readonly idempotencyKey: string;
  },
): Promise<void> {
  if (input.action === "none") {
    return;
  }
  const reservationId = requireReservation(input.order);
  const providerUserId = input.order.assigned_provider_user_id;
  if (!providerUserId) {
    throw new OrderApplicationError(
      "ORDER_PROVIDER_ASSIGNMENT_MISSING",
      "Order does not have an assigned provider",
      409,
    );
  }

  if (input.action === "release") {
    await wallet.releaseCommissionReservation(trx, {
      providerUserId,
      reservationId,
      actorUserId: input.actorUserId,
      reason: "order_cancelled_commission_released",
      idempotencyKey: `cancel:${input.idempotencyKey}:commission-release`,
    });
    return;
  }

  await wallet.holdCommissionReservation(trx, {
    providerUserId,
    reservationId,
    actorUserId: input.actorUserId,
    reason: "order_cancelled_commission_held_for_review",
  });
}

function expectedCancelledStatus(actor: CancellationActor): OrderStatus {
  if (actor === "customer") {
    return "cancelled_by_customer";
  }
  if (actor === "provider") {
    return "cancelled_by_provider";
  }

  return "cancelled_by_admin";
}

async function writeOrderAudit(
  trx: Transaction<DatabaseSchema>,
  input: {
    readonly actorUserId: string;
    readonly action: string;
    readonly reason: string;
    readonly orderId: string;
    readonly metadata: Record<string, unknown>;
  },
): Promise<void> {
  await trx
    .insertInto("audit_events")
    .values({
      actor_id: input.actorUserId,
      action: input.action,
      reason: input.reason,
      related_entity_type: "order",
      related_entity_id: input.orderId,
      metadata: input.metadata,
    })
    .execute();
}
