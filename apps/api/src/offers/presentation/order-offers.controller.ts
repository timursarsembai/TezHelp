import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import { DevelopmentIdentityGuard } from "../../identity/presentation/development-identity.guard.js";
import type { IdentityRequest } from "../../identity/presentation/identity-request.js";
import { ListOrderOffersUseCase } from "../application/offers.use-cases.js";

@ApiTags("offers")
@UseGuards(DevelopmentIdentityGuard)
@Controller("orders")
export class OrderOffersController {
  constructor(private readonly listOffers: ListOrderOffersUseCase) {}

  @Get(":orderId/offers")
  @ApiOkResponse({ description: "Offers for an order." })
  async offers(@Param("orderId") orderId: string, @Req() request: IdentityRequest) {
    this.requireUserId(request);
    return this.listOffers.execute(orderId);
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
