import { Injectable } from "@nestjs/common";

import type { Locale, ServiceCategorySummary } from "@tezhelp/types";

import { ServiceCatalogRepository } from "../infrastructure/service-catalog.repository.js";

@Injectable()
export class ListServiceCategoriesUseCase {
  constructor(private readonly repository: ServiceCatalogRepository) {}

  async execute(locale: Locale): Promise<ReadonlyArray<ServiceCategorySummary>> {
    return this.repository.listCategories(locale);
  }
}

@Injectable()
export class GetServiceCategoryCommercialConfigUseCase {
  constructor(private readonly repository: ServiceCatalogRepository) {}

  async execute(slug: ServiceCategorySummary["slug"]) {
    return this.repository.getCommercialConfig(slug);
  }
}

@Injectable()
export class UpdateServiceCategoryCommercialConfigUseCase {
  constructor(private readonly repository: ServiceCatalogRepository) {}

  async execute(
    slug: ServiceCategorySummary["slug"],
    input: ServiceCategorySummary["commercialConfig"],
  ) {
    return this.repository.updateCommercialConfig(slug, input);
  }
}
