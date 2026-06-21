import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { providerDiscoveryPreferenceSchema, submitOfferSchema } from "@tezhelp/validation";

import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import { DevelopmentIdentityGuard } from "../../identity/presentation/development-identity.guard.js";
import type { IdentityRequest } from "../../identity/presentation/identity-request.js";
import { parseBody } from "../../identity/presentation/zod-body.js";
import {
  GetProviderDiscoveryPreferenceUseCase,
  ListProviderOrdersUseCase,
  SubmitOfferUseCase,
  UpdateProviderDiscoveryPreferenceUseCase,
} from "../application/offers.use-cases.js";

@ApiTags("offers")
@UseGuards(DevelopmentIdentityGuard)
@Controller("provider")
export class ProviderOffersController {
  constructor(
    private readonly listProviderOrders: ListProviderOrdersUseCase,
    private readonly getPreference: GetProviderDiscoveryPreferenceUseCase,
    private readonly updatePreference: UpdateProviderDiscoveryPreferenceUseCase,
    private readonly submitOffer: SubmitOfferUseCase,
  ) {}

  @Get("orders")
  @ApiOkResponse({ description: "Discoverable orders for the current provider." })
  async orders(@Req() request: IdentityRequest) {
    return this.listProviderOrders.execute(this.requireUserId(request));
  }

  @Get("order-discovery-preferences")
  @ApiOkResponse({ description: "Provider order discovery preference." })
  async preference(@Req() request: IdentityRequest) {
    return this.getPreference.execute(this.requireUserId(request));
  }

  @Patch("order-discovery-preferences")
  @ApiOkResponse({ description: "Update provider order discovery preference." })
  async updatePreferenceBody(@Body() body: unknown, @Req() request: IdentityRequest) {
    const input = parseBody(providerDiscoveryPreferenceSchema, body);
    return this.updatePreference.execute(this.requireUserId(request), input);
  }

  @Post("orders/:orderId/offers")
  @ApiOkResponse({ description: "Submit an offer for an order." })
  async offer(
    @Param("orderId") orderId: string,
    @Body() body: unknown,
    @Req() request: IdentityRequest,
  ) {
    const input = parseBody(submitOfferSchema, body);
    return this.submitOffer.execute({
      providerUserId: this.requireUserId(request),
      orderId,
      providerServiceProfileId: input.providerServiceProfileId,
      priceKzt: input.priceKzt,
      arrivalMinutes: input.arrivalMinutes,
      comment: input.comment,
      idempotencyKey: input.idempotencyKey,
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
