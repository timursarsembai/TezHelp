import type { OrderStatus } from "@tezhelp/types";

import { LiveLocationApplicationError } from "./live-location-errors.js";

export const liveLocationStaleAfterSeconds = 90;
export const liveLocationPollAfterMs = 5000;

const trackableStatuses = new Set<OrderStatus>([
  "provider_en_route",
  "provider_arrived",
  "in_progress",
]);

export interface LiveLocationOrderContext {
  readonly orderId: string;
  readonly status: OrderStatus;
  readonly customerUserId: string;
  readonly assignedProviderUserId: string | null;
}

export class LiveLocationPolicy {
  static canTrack(status: OrderStatus): boolean {
    return trackableStatuses.has(status);
  }

  static assertProviderCanPublish(context: LiveLocationOrderContext, providerUserId: string): void {
    if (context.assignedProviderUserId !== providerUserId) {
      throw new LiveLocationApplicationError(
        "LIVE_LOCATION_FORBIDDEN",
        "Only the assigned provider can publish live location",
        403,
      );
    }

    if (!this.canTrack(context.status)) {
      throw new LiveLocationApplicationError(
        "LIVE_LOCATION_NOT_TRACKABLE",
        "Live tracking is available only after departure and before terminal order states",
        409,
        { status: context.status },
      );
    }
  }

  static assertParticipantCanView(
    context: LiveLocationOrderContext,
    viewerUserId: string,
  ): "customer" | "provider" {
    if (context.customerUserId === viewerUserId) {
      return "customer";
    }
    if (context.assignedProviderUserId === viewerUserId) {
      return "provider";
    }

    throw new LiveLocationApplicationError(
      "LIVE_LOCATION_FORBIDDEN",
      "Live location is not visible to this user",
      403,
    );
  }

  static isStale(recordedAt: Date, now: Date): boolean {
    return now.getTime() - recordedAt.getTime() > liveLocationStaleAfterSeconds * 1000;
  }
}
