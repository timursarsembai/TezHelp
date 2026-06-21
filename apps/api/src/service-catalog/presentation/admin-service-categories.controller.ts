import { Body, Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import type { ServiceCategorySlug } from "@tezhelp/types";
import {
  serviceCategoryCommercialConfigSchema,
  serviceCategorySlugSchema,
} from "@tezhelp/validation";

import { parseBody } from "../../identity/presentation/zod-body.js";
import { ModerationApplicationError } from "../../moderation/domain/moderation-errors.js";
import {
  type AdminRequest,
  DevelopmentAdminGuard,
} from "../../moderation/presentation/development-admin.guard.js";
import {
  GetServiceCategoryCommercialConfigUseCase,
  UpdateServiceCategoryCommercialConfigUseCase,
} from "../application/list-service-categories.use-case.js";

@ApiTags("admin-service-catalog")
@UseGuards(DevelopmentAdminGuard)
@Controller("admin/service-categories")
export class AdminServiceCategoriesController {
  constructor(
    private readonly getConfig: GetServiceCategoryCommercialConfigUseCase,
    private readonly updateConfig: UpdateServiceCategoryCommercialConfigUseCase,
  ) {}

  @Get(":slug/commercial-config")
  @ApiOkResponse({ description: "Category response fee, commission, and balance config." })
  async config(@Param("slug") rawSlug: string, @Req() request: AdminRequest) {
    this.requireAdminUserId(request);
    return this.getConfig.execute(this.parseSlug(rawSlug));
  }

  @Patch(":slug/commercial-config")
  @ApiOkResponse({ description: "Update category commercial configuration." })
  async update(
    @Param("slug") rawSlug: string,
    @Body() body: unknown,
    @Req() request: AdminRequest,
  ) {
    this.requireAdminUserId(request);
    const input = parseBody(serviceCategoryCommercialConfigSchema, body);
    return this.updateConfig.execute(this.parseSlug(rawSlug), input);
  }

  private parseSlug(rawSlug: string): ServiceCategorySlug {
    return parseBody(serviceCategorySlugSchema, rawSlug);
  }

  private requireAdminUserId(request: AdminRequest): string {
    if (!request.adminUserId) {
      throw new ModerationApplicationError(
        "UNAUTHORIZED_ADMIN_USER",
        "Admin user header is required",
        401,
      );
    }

    return request.adminUserId;
  }
}
