import { Injectable } from "@nestjs/common";

import type {
  CustomerReliabilitySummary,
  Locale,
  OrderReviewSummary,
  ProviderSanctionSummary,
  ProviderSanctionType,
  PublicProviderReliabilitySummary,
} from "@tezhelp/types";

import { ReputationRepository } from "../infrastructure/reputation.repository.js";

@Injectable()
export class SubmitOrderReviewUseCase {
  constructor(private readonly repository: ReputationRepository) {}

  async execute(input: {
    readonly orderId: string;
    readonly reviewerUserId: string;
    readonly rating: number;
    readonly comment?: string;
  }): Promise<OrderReviewSummary> {
    return this.repository.submitReview(input);
  }
}

@Injectable()
export class GetCustomerReliabilityUseCase {
  constructor(private readonly repository: ReputationRepository) {}

  async execute(input: {
    readonly orderId: string;
    readonly providerUserId: string;
  }): Promise<CustomerReliabilitySummary> {
    return this.repository.getCustomerReliabilityForOrder(input);
  }
}

@Injectable()
export class GetPublicProviderReliabilityUseCase {
  constructor(private readonly repository: ReputationRepository) {}

  async execute(input: {
    readonly serviceProfileId: string;
    readonly locale: Locale;
  }): Promise<PublicProviderReliabilitySummary> {
    return this.repository.getPublicProviderReliability(input);
  }
}

@Injectable()
export class CreateProviderSanctionUseCase {
  constructor(private readonly repository: ReputationRepository) {}

  async execute(input: {
    readonly providerUserId: string;
    readonly adminUserId: string;
    readonly sanctionType: ProviderSanctionType;
    readonly reason: string;
    readonly serviceProfileId?: string;
    readonly startsAt?: string;
    readonly endsAt?: string;
  }): Promise<ProviderSanctionSummary> {
    return this.repository.createSanction({
      providerUserId: input.providerUserId,
      adminUserId: input.adminUserId,
      sanctionType: input.sanctionType,
      reason: input.reason,
      ...(input.serviceProfileId ? { serviceProfileId: input.serviceProfileId } : {}),
      ...(input.startsAt ? { startsAt: new Date(input.startsAt) } : {}),
      ...(input.endsAt ? { endsAt: new Date(input.endsAt) } : {}),
    });
  }
}

@Injectable()
export class ListProviderSanctionsUseCase {
  constructor(private readonly repository: ReputationRepository) {}

  async execute(providerUserId: string): Promise<ReadonlyArray<ProviderSanctionSummary>> {
    return this.repository.listProviderSanctions(providerUserId);
  }
}

@Injectable()
export class AppealProviderSanctionUseCase {
  constructor(private readonly repository: ReputationRepository) {}

  async execute(input: {
    readonly sanctionId: string;
    readonly providerUserId: string;
    readonly reason: string;
  }): Promise<ProviderSanctionSummary> {
    return this.repository.appealSanction(input);
  }
}

@Injectable()
export class LiftProviderSanctionUseCase {
  constructor(private readonly repository: ReputationRepository) {}

  async execute(input: {
    readonly sanctionId: string;
    readonly adminUserId: string;
    readonly reason: string;
  }): Promise<ProviderSanctionSummary> {
    return this.repository.liftSanction(input);
  }
}
