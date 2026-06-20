import { Injectable } from "@nestjs/common";

import type {
  Locale,
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
        allowedTaxStatuses: allowances
          .filter((allowance) => allowance.category_slug === slug)
          .map((allowance) => allowance.tax_status),
        requiredDocuments: rules
          .filter((rule) => rule.category_slug === slug)
          .map((rule) => this.toDocumentRule(rule, locale)),
      };
    });
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
