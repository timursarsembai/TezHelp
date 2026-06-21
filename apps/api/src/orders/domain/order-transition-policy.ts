import type { OrderStatus } from "@tezhelp/types";

import { OrderApplicationError } from "./order-errors.js";

export type CancellationActor = "customer" | "provider" | "admin";
export type CommissionCancellationAction = "none" | "release" | "hold";

export interface CancellationOutcome {
  readonly status: Extract<
    OrderStatus,
    "cancelled_by_customer" | "cancelled_by_provider" | "cancelled_by_admin"
  >;
  readonly commissionAction: CommissionCancellationAction;
}

const terminalStatuses = new Set<OrderStatus>([
  "completed",
  "cancelled_by_customer",
  "cancelled_by_provider",
  "cancelled_by_admin",
  "disputed",
]);

const contactVisibleStatuses = new Set<OrderStatus>([
  "provider_en_route",
  "provider_arrived",
  "in_progress",
]);

export class OrderTransitionPolicy {
  static assertProviderTransition(current: OrderStatus, next: OrderStatus): void {
    const allowed =
      (current === "provider_selected" && next === "provider_en_route") ||
      (current === "provider_en_route" && next === "provider_arrived") ||
      (current === "provider_arrived" && next === "in_progress");

    if (!allowed) {
      throw new OrderApplicationError(
        "ORDER_INVALID_TRANSITION",
        `Cannot transition order from ${current} to ${next}`,
        409,
      );
    }
  }

  static assertCompletionAllowed(current: OrderStatus): void {
    if (current !== "in_progress") {
      throw new OrderApplicationError(
        "ORDER_INVALID_TRANSITION",
        `Cannot complete order from ${current}`,
        409,
      );
    }
  }

  static cancellationOutcome(
    actor: CancellationActor,
    current: OrderStatus,
    holdCommissionForReview = false,
  ): CancellationOutcome {
    if (terminalStatuses.has(current)) {
      throw new OrderApplicationError("ORDER_ALREADY_TERMINAL", "Order is already terminal", 409);
    }

    if (actor === "customer") {
      return {
        status: "cancelled_by_customer",
        commissionAction:
          current === "provider_arrived" || current === "in_progress" ? "hold" : "release",
      };
    }

    if (actor === "provider") {
      return {
        status: "cancelled_by_provider",
        commissionAction: current === "receiving_offers" ? "none" : "release",
      };
    }

    return {
      status: "cancelled_by_admin",
      commissionAction:
        current === "receiving_offers" ? "none" : holdCommissionForReview ? "hold" : "release",
    };
  }

  static contactVisible(current: OrderStatus): boolean {
    return contactVisibleStatuses.has(current);
  }

  static isTerminal(current: OrderStatus): boolean {
    return terminalStatuses.has(current);
  }
}
