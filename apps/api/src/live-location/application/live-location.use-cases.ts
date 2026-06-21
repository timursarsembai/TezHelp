import { Injectable } from "@nestjs/common";

import type { LiveLocationSnapshot } from "@tezhelp/types";

import { LiveLocationRepository } from "../infrastructure/live-location.repository.js";

@Injectable()
export class PublishProviderLocationUseCase {
  constructor(private readonly repository: LiveLocationRepository) {}

  async execute(input: {
    readonly orderId: string;
    readonly providerUserId: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly accuracyMeters: number;
    readonly recordedAt?: string;
    readonly sequence?: number;
    readonly resumed: boolean;
  }): Promise<LiveLocationSnapshot> {
    return this.repository.publishProviderLocation({
      orderId: input.orderId,
      providerUserId: input.providerUserId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracyMeters: input.accuracyMeters,
      recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
      ...(input.sequence ? { sequence: input.sequence } : {}),
      resumed: input.resumed,
    });
  }
}

@Injectable()
export class GetOrderLiveLocationUseCase {
  constructor(private readonly repository: LiveLocationRepository) {}

  async execute(input: {
    readonly orderId: string;
    readonly viewerUserId: string;
  }): Promise<LiveLocationSnapshot> {
    return this.repository.getParticipantSnapshot(input);
  }
}

@Injectable()
export class GetAdminOrderLiveLocationUseCase {
  constructor(private readonly repository: LiveLocationRepository) {}

  async execute(orderId: string): Promise<LiveLocationSnapshot> {
    return this.repository.getAdminSnapshot({ orderId });
  }
}
