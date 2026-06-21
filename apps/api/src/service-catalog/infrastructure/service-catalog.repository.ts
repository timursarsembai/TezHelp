import { Injectable } from "@nestjs/common";

import type {
  CommissionStrategy,
  Locale,
  ServiceCategoryCommercialConfig,
  ServiceCategoryDocumentRule,
  ServiceCategorySlug,
  ServiceCategorySummary,
} from "@tezhelp/types";

import { DatabaseService } from "../../foundation/database/database.service.js";

@Injectable()
export class ServiceCatalogRepository {
  constructor(private readonly database: DatabaseService) {}

  async listCategories(locale: Locale): Promise<ReadonlyArray<ServiceCategorySummary>> {
    const rows = await this.database.db
      .selectFrom("service_categories")
      .innerJoin("service_category_translations", (join) =>
        join
          .onRef("service_category_translations.category_slug", "=", "service_categories.slug")
          .on("service_category_translations.locale", "=", locale),
      )
      .select([
        "service_categories.slug",
        "service_categories.enabled",
        "service_categories.response_fee_kzt",
        "service_categories.commission_strategy",
        "service_categories.commission_percentage_bps",
        "service_categories.commission_fixed_kzt",
        "service_categories.operational_minimum_kzt",
        "service_category_translations.name",
        "service_category_translations.description",
      ])
      .orderBy("service_categories.sort_order", "asc")
      .execute();

    const [allowances, rules] = await Promise.all([
      this.database.db
        .selectFrom("service_category_tax_allowances")
        .select(["category_slug", "tax_status"])
        .execute(),
      this.database.db
        .selectFrom("service_category_document_rules")
        .selectAll()
        .orderBy("sort_order", "asc")
        .execute(),
    ]);

    return rows.map((row) => {
      const slug = row.slug as ServiceCategorySlug;
      return {
        slug,
        enabled: row.enabled,
        name: row.name,
        description: row.description,
        commercialConfig: this.toCommercialConfig(row),
        allowedTaxStatuses: allowances
          .filter((allowance) => allowance.category_slug === slug)
          .map((allowance) => allowance.tax_status),
        requiredDocuments: rules
          .filter((rule) => rule.category_slug === slug)
          .map((rule) => this.toDocumentRule(rule, locale)),
      };
    });
  }

  async getCommercialConfig(slug: ServiceCategorySlug): Promise<ServiceCategoryCommercialConfig> {
    const row = await this.database.db
      .selectFrom("service_categories")
      .select([
        "response_fee_kzt",
        "commission_strategy",
        "commission_percentage_bps",
        "commission_fixed_kzt",
        "operational_minimum_kzt",
      ])
      .where("slug", "=", slug)
      .executeTakeFirstOrThrow();

    return this.toCommercialConfig(row);
  }

  async updateCommercialConfig(
    slug: ServiceCategorySlug,
    input: ServiceCategoryCommercialConfig,
  ): Promise<ServiceCategoryCommercialConfig> {
    const row = await this.database.db
      .updateTable("service_categories")
      .set({
        response_fee_kzt: input.responseFeeKzt,
        commission_strategy: input.commissionStrategy,
        commission_percentage_bps: input.commissionPercentageBps,
        commission_fixed_kzt: input.commissionFixedKzt,
        operational_minimum_kzt: input.operationalMinimumKzt,
        updated_at: new Date(),
      })
      .where("slug", "=", slug)
      .returning([
        "response_fee_kzt",
        "commission_strategy",
        "commission_percentage_bps",
        "commission_fixed_kzt",
        "operational_minimum_kzt",
      ])
      .executeTakeFirstOrThrow();

    return this.toCommercialConfig(row);
  }

  private toCommercialConfig(row: {
    readonly response_fee_kzt: number;
    readonly commission_strategy: CommissionStrategy;
    readonly commission_percentage_bps: number;
    readonly commission_fixed_kzt: number;
    readonly operational_minimum_kzt: number;
  }): ServiceCategoryCommercialConfig {
    return {
      responseFeeKzt: row.response_fee_kzt,
      commissionStrategy: row.commission_strategy,
      commissionPercentageBps: row.commission_percentage_bps,
      commissionFixedKzt: row.commission_fixed_kzt,
      operationalMinimumKzt: row.operational_minimum_kzt,
    };
  }

  private toDocumentRule(
    row: {
      readonly id: string;
      readonly category_slug: string;
      readonly document_type: string;
      readonly localized_label: Record<string, unknown>;
      readonly required: boolean;
      readonly allowed_mime_types: ReadonlyArray<string>;
      readonly max_size_bytes: number;
    },
    locale: Locale,
  ): ServiceCategoryDocumentRule {
    const localized = row.localized_label;
    const label = typeof localized[locale] === "string" ? localized[locale] : row.document_type;

    return {
      id: row.id,
      categorySlug: row.category_slug as ServiceCategorySlug,
      documentType: row.document_type,
      label,
      required: row.required,
      allowedMimeTypes: row.allowed_mime_types,
      maxSizeBytes: row.max_size_bytes,
    };
  }
}
