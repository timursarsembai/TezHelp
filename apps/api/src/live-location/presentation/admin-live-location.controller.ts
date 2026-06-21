import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { ModerationApplicationError } from "../../moderation/domain/moderation-errors.js";
import {
  type AdminRequest,
  DevelopmentAdminGuard,
} from "../../moderation/presentation/development-admin.guard.js";
import { GetAdminOrderLiveLocationUseCase } from "../application/live-location.use-cases.js";

@ApiTags("admin-live-location")
@UseGuards(DevelopmentAdminGuard)
@Controller("admin/orders/:orderId/location")
export class AdminLiveLocationController {
  constructor(private readonly getLocation: GetAdminOrderLiveLocationUseCase) {}

  @Get()
  @ApiOkResponse({ description: "Active-order live tracking for administration." })
  async get(@Param("orderId") orderId: string, @Req() request: AdminRequest) {
    this.requireAdminUserId(request);
    return this.getLocation.execute(orderId);
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
