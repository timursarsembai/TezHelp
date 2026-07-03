import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { liveLocationUpdateSchema } from "@tezhelp/validation";

import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import { RateLimit } from "../../foundation/authorization/rate-limit.decorator.js";
import { RateLimitGuard } from "../../foundation/authorization/rate-limit.guard.js";
import { SessionAuthGuard } from "../../foundation/authorization/session-auth.guard.js";
import type { IdentityRequest } from "../../identity/presentation/identity-request.js";
import { parseBody } from "../../identity/presentation/zod-body.js";
import { PublishProviderLocationUseCase } from "../application/live-location.use-cases.js";

@ApiTags("provider-live-location")
@UseGuards(SessionAuthGuard)
@Controller("provider/orders/:orderId/location")
export class ProviderLiveLocationController {
  constructor(private readonly publishLocation: PublishProviderLocationUseCase) {}

  @Post()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 600, windowSeconds: 3600 })
  @ApiOkResponse({ description: "Publish assigned provider live GPS point for an active order." })
  async publish(
    @Param("orderId") orderId: string,
    @Body() body: unknown,
    @Req() request: IdentityRequest,
  ) {
    const input = parseBody(liveLocationUpdateSchema, body);
    return this.publishLocation.execute({
      orderId,
      providerUserId: this.requireUserId(request),
      latitude: input.latitude,
      longitude: input.longitude,
      accuracyMeters: input.accuracyMeters,
      ...(input.recordedAt ? { recordedAt: input.recordedAt } : {}),
      ...(input.sequence ? { sequence: input.sequence } : {}),
      resumed: input.resumed,
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
