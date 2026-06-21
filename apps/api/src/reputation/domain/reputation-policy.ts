import type { OrderStatus, ReviewDirection } from "@tezhelp/types";

import { ReputationApplicationError } from "./reputation-errors.js";

export interface ReviewOrderContext {
  readonly orderId: string;
  readonly status: OrderStatus;
  readonly customerUserId: string;
  readonly assignedProviderUserId: string | null;
  readonly assignedProviderServiceProfileId: string | null;
}

export interface ReviewCounterparty {
  readonly direction: ReviewDirection;
  readonly revieweeUserId: string;
  readonly providerServiceProfileId?: string;
}

export interface SanctionWindow {
  readonly startsAt: Date;
  readonly endsAt: Date | null;
  readonly liftedAt: Date | null;
}

export class ReputationPolicy {
  static resolveReviewCounterparty(
    context: ReviewOrderContext,
    reviewerUserId: string,
  ): ReviewCounterparty {
    if (context.status !== "completed") {
      throw new ReputationApplicationError(
        "REVIEW_ORDER_NOT_COMPLETED",
        "Reviews are allowed only after order completion",
        409,
        { status: context.status },
      );
    }

    if (!context.assignedProviderUserId || !context.assignedProviderServiceProfileId) {
      throw new ReputationApplicationError(
        "REVIEW_COUNTERPARTY_NOT_ASSIGNED",
        "Completed order does not have an assigned provider",
        409,
      );
    }

    if (context.customerUserId === reviewerUserId) {
      return {
        direction: "customer_to_provider",
        revieweeUserId: context.assignedProviderUserId,
        providerServiceProfileId: context.assignedProviderServiceProfileId,
      };
    }

    if (context.assignedProviderUserId === reviewerUserId) {
      return {
        direction: "provider_to_customer",
        revieweeUserId: context.customerUserId,
      };
    }

    throw new ReputationApplicationError(
      "REVIEW_FORBIDDEN",
      "Only assigned order participants can review each other",
      403,
    );
  }

  static isSanctionActive(sanction: SanctionWindow, now: Date): boolean {
    return (
      sanction.liftedAt === null &&
      sanction.startsAt.getTime() <= now.getTime() &&
      (sanction.endsAt === null || sanction.endsAt.getTime() > now.getTime())
    );
  }

  static assertSanctionCanBeAppealed(input: {
    readonly liftedAt: Date | null;
    readonly appealStatus: string;
  }): void {
    if (input.liftedAt) {
      throw new ReputationApplicationError(
        "SANCTION_ALREADY_LIFTED",
        "Lifted sanctions cannot be appealed",
        409,
      );
    }

    if (input.appealStatus === "submitted") {
      throw new ReputationApplicationError(
        "SANCTION_APPEAL_ALREADY_SUBMITTED",
        "Sanction appeal is already submitted",
        409,
      );
    }
  }
}
