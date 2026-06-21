import { Injectable } from "@nestjs/common";
import { sql, type Kysely } from "kysely";

import type { LiveLocationSnapshot, LiveLocationVisibilityState } from "@tezhelp/types";

import { DatabaseService } from "../../foundation/database/database.service.js";
import type { DatabaseSchema } from "../../foundation/database/database.types.js";
import { LiveLocationApplicationError } from "../domain/live-location-errors.js";
import {
  liveLocationPollAfterMs,
  LiveLocationPolicy,
  liveLocationStaleAfterSeconds,
  type LiveLocationOrderContext,
} from "../domain/live-location-policy.js";

type DatabaseExecutor = Kysely<DatabaseSchema>;

export interface LiveLocationContext extends LiveLocationOrderContext {
  readonly customerLatitude: number;
  readonly customerLongitude: number;
}

export interface LiveLocationUpdateInput {
  readonly orderId: string;
  readonly providerUserId: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracyMeters: number;
  readonly recordedAt: Date;
  readonly sequence?: number;
  readonly resumed: boolean;
}

@Injectable()
export class LiveLocationRepository {
  constructor(private readonly database: DatabaseService) {}

  async getOrderContext(
    orderId: string,
    executor: DatabaseExecutor = this.database.db,
  ): Promise<LiveLocationContext> {
    const row = await executor
      .selectFrom("orders")
      .select([
        "id",
        "status",
        "customer_user_id",
        "assigned_provider_user_id",
        sql<number>`ST_Y(location::geometry)`.as("customer_latitude"),
        sql<number>`ST_X(location::geometry)`.as("customer_longitude"),
      ])
      .where("id", "=", orderId)
      .executeTakeFirst();

    if (!row) {
      throw new LiveLocationApplicationError(
        "LIVE_LOCATION_ORDER_NOT_FOUND",
        "Order not found",
        404,
      );
    }

    return {
      orderId: row.id,
      status: row.status,
      customerUserId: row.customer_user_id,
      assignedProviderUserId: row.assigned_provider_user_id,
      customerLatitude: Number(row.customer_latitude),
      customerLongitude: Number(row.customer_longitude),
    };
  }

  async publishProviderLocation(input: LiveLocationUpdateInput): Promise<LiveLocationSnapshot> {
    return this.database.transaction(async (trx) => {
      const context = await this.getOrderContext(input.orderId, trx);
      LiveLocationPolicy.assertProviderCanPublish(context, input.providerUserId);

      const existing = await trx
        .selectFrom("live_location_sessions")
        .select(["last_sequence"])
        .where("order_id", "=", input.orderId)
        .executeTakeFirst();
      const sequence = Math.max(input.sequence ?? 0, (existing?.last_sequence ?? 0) + 1);
      const now = new Date();
      const pointExpression = sql<string>`ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography`;

      await trx
        .insertInto("live_location_updates")
        .values({
          order_id: input.orderId,
          provider_user_id: input.providerUserId,
          point: pointExpression,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy_meters: input.accuracyMeters,
          recorded_at: input.recordedAt,
          sequence,
          resumed: input.resumed,
        })
        .execute();

      await trx
        .insertInto("live_location_sessions")
        .values({
          order_id: input.orderId,
          provider_user_id: input.providerUserId,
          tracking_state: "active",
          last_point: pointExpression,
          last_latitude: input.latitude,
          last_longitude: input.longitude,
          last_accuracy_meters: input.accuracyMeters,
          last_recorded_at: input.recordedAt,
          last_sequence: sequence,
          resumed_at: input.resumed ? now : null,
          stopped_at: null,
          updated_at: now,
        })
        .onConflict((oc) =>
          oc.column("order_id").doUpdateSet({
            provider_user_id: input.providerUserId,
            tracking_state: "active",
            last_point: pointExpression,
            last_latitude: input.latitude,
            last_longitude: input.longitude,
            last_accuracy_meters: input.accuracyMeters,
            last_recorded_at: input.recordedAt,
            last_sequence: sequence,
            resumed_at: input.resumed ? now : null,
            stopped_at: null,
            updated_at: now,
          }),
        )
        .execute();

      return this.getSnapshotForContext(context, trx, now);
    });
  }

  async getParticipantSnapshot(input: {
    readonly orderId: string;
    readonly viewerUserId: string;
    readonly now?: Date;
  }): Promise<LiveLocationSnapshot> {
    const context = await this.getOrderContext(input.orderId);
    LiveLocationPolicy.assertParticipantCanView(context, input.viewerUserId);
    return this.getSnapshotForContext(context, this.database.db, input.now ?? new Date());
  }

  async getAdminSnapshot(input: {
    readonly orderId: string;
    readonly now?: Date;
  }): Promise<LiveLocationSnapshot> {
    const context = await this.getOrderContext(input.orderId);
    return this.getSnapshotForContext(context, this.database.db, input.now ?? new Date());
  }

  private async getSnapshotForContext(
    context: LiveLocationContext,
    executor: DatabaseExecutor,
    now: Date,
  ): Promise<LiveLocationSnapshot> {
    if (!LiveLocationPolicy.canTrack(context.status)) {
      return this.hiddenSnapshot(context.orderId, "hidden");
    }

    const session = await executor
      .selectFrom("live_location_sessions")
      .select([
        "provider_user_id",
        "tracking_state",
        "last_latitude",
        "last_longitude",
        "last_accuracy_meters",
        "last_recorded_at",
        "last_sequence",
        "resumed_at",
      ])
      .where("order_id", "=", context.orderId)
      .executeTakeFirst();

    if (!session || !session.last_recorded_at) {
      return {
        orderId: context.orderId,
        visible: true,
        visibilityState: "waiting",
        trackingState: "active",
        ...(context.assignedProviderUserId
          ? { providerUserId: context.assignedProviderUserId }
          : {}),
        customerPoint: {
          latitude: context.customerLatitude,
          longitude: context.customerLongitude,
        },
        staleAfterSeconds: liveLocationStaleAfterSeconds,
        pollAfterMs: liveLocationPollAfterMs,
        resumeRequired: true,
        routeRebuildRequired: true,
      };
    }

    const stale = LiveLocationPolicy.isStale(session.last_recorded_at, now);
    const visibilityState: LiveLocationVisibilityState =
      session.tracking_state === "stopped" ? "offline" : stale ? "stale" : "current";

    return {
      orderId: context.orderId,
      providerUserId: session.provider_user_id,
      visible: true,
      visibilityState,
      trackingState: session.tracking_state,
      customerPoint: {
        latitude: context.customerLatitude,
        longitude: context.customerLongitude,
      },
      providerPoint: {
        latitude: Number(session.last_latitude),
        longitude: Number(session.last_longitude),
        accuracyMeters: session.last_accuracy_meters ?? 0,
        recordedAt: session.last_recorded_at.toISOString(),
        sequence: session.last_sequence,
        resumed: Boolean(session.resumed_at),
      },
      staleAfterSeconds: liveLocationStaleAfterSeconds,
      pollAfterMs: liveLocationPollAfterMs,
      resumeRequired: stale || session.tracking_state === "stopped",
      routeRebuildRequired: stale || session.tracking_state === "stopped",
    };
  }

  private hiddenSnapshot(
    orderId: string,
    visibilityState: LiveLocationVisibilityState,
  ): LiveLocationSnapshot {
    return {
      orderId,
      visible: false,
      visibilityState,
      staleAfterSeconds: liveLocationStaleAfterSeconds,
      pollAfterMs: liveLocationPollAfterMs,
      resumeRequired: false,
      routeRebuildRequired: false,
    };
  }
}
