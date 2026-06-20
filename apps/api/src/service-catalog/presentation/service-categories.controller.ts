import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { resolveApiLocale } from "../../foundation/http/locale-query.js";
import { ListServiceCategoriesUseCase } from "../application/list-service-categories.use-case.js";

@ApiTags("service-catalog")
@Controller("service-categories")
export class ServiceCategoriesController {
  constructor(private readonly listCategories: ListServiceCategoriesUseCase) {}

  @Get()
  @ApiOkResponse({ description: "Localized service-category catalog." })
  async list(@Query("locale") rawLocale?: string) {
    return this.listCategories.execute(resolveApiLocale(rawLocale));
  }
}
