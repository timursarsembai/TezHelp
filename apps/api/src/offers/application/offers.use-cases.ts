import { Injectable } from "@nestjs/common";

import type {
  OfferSummary,
  ProviderOrderDiscoveryItem,
  ProviderOrderDiscoveryPreference,
} from "@tezhelp/types";

import { type SubmitOfferInput, OffersRepository } from "../infrastructure/offers.repository.js";

@Injectable()
export class ListProviderOrdersUseCase {
  constructor(private readonly repository: OffersRepository) {}

  async execute(providerUserId: string): Promise<ReadonlyArray<ProviderOrderDiscoveryItem>> {
    return this.repository.listDiscoverableOrders(providerUserId);
  }
}

@Injectable()
export class GetProviderDiscoveryPreferenceUseCase {
  constructor(private readonly repository: OffersRepository) {}

  async execute(providerUserId: string): Promise<ProviderOrderDiscoveryPreference> {
    return this.repository.getDiscoveryPreference(providerUserId);
  }
}

@Injectable()
export class UpdateProviderDiscoveryPreferenceUseCase {
  constructor(private readonly repository: OffersRepository) {}

  async execute(
    providerUserId: string,
    input: ProviderOrderDiscoveryPreference,
  ): Promise<ProviderOrderDiscoveryPreference> {
    return this.repository.updateDiscoveryPreference(providerUserId, input);
  }
}

@Injectable()
export class SubmitOfferUseCase {
  constructor(private readonly repository: OffersRepository) {}

  async execute(input: SubmitOfferInput): Promise<OfferSummary> {
    return this.repository.submitOffer(input);
  }
}

@Injectable()
export class ListOrderOffersUseCase {
  constructor(private readonly repository: OffersRepository) {}

  async execute(orderId: string): Promise<ReadonlyArray<OfferSummary>> {
    return this.repository.listOrderOffers(orderId);
  }
}
