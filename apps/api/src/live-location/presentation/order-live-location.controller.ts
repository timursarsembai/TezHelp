import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import { DevelopmentIdentityGuard } from "../../identity/presentation/development-identity.guard.js";
import type { IdentityRequest } from "../../identity/presentation/identity-request.js";
import { GetOrderLiveLocationUseCase } from "../application/live-location.use-cases.js";

@ApiTags("order-live-location")
@UseGuards(DevelopmentIdentityGuard)
@Controller("orders/:orderId/location")
export class OrderLiveLocationController {
  constructor(private readonly getLocation: GetOrderLiveLocationUseCase) {}

  @Get()
  @ApiOkResponse({ description: "Current or last known provider location for an active order." })
  async get(@Param("orderId") orderId: string, @Req() request: IdentityRequest) {
    return this.getLocation.execute({
      orderId,
      viewerUserId: this.requireUserId(request),
    });
  }

  private requireUserId(request: IdentityRequest): string {
    if (!request.identityUserId) {
      throw new IdentityApplicationError(
        "UNAUTHORIZED_IDENTITY_USER",
        "User header is required",
        401,
      );
    }

    return request.identityUserId;
  }
}
