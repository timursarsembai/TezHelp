import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { appealProviderSanctionSchema } from "@tezhelp/validation";

import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import { DevelopmentIdentityGuard } from "../../identity/presentation/development-identity.guard.js";
import type { IdentityRequest } from "../../identity/presentation/identity-request.js";
import { parseBody } from "../../identity/presentation/zod-body.js";
import {
  AppealProviderSanctionUseCase,
  GetCustomerReliabilityUseCase,
  ListProviderSanctionsUseCase,
} from "../application/reputation.use-cases.js";

@ApiTags("provider-reputation")
@UseGuards(DevelopmentIdentityGuard)
@Controller("provider")
export class ProviderReputationController {
  constructor(
    private readonly getReliability: GetCustomerReliabilityUseCase,
    private readonly listSanctions: ListProviderSanctionsUseCase,
    private readonly appealSanction: AppealProviderSanctionUseCase,
  ) {}

  @Get("orders/:orderId/customer-reliability")
  @ApiOkResponse({ description: "Customer reliability summary visible to involved providers." })
  async customerReliability(@Param("orderId") orderId: string, @Req() request: IdentityRequest) {
    return this.getReliability.execute({
      orderId,
      providerUserId: this.requireUserId(request),
    });
  }

  @Get("sanctions")
  @ApiOkResponse({ description: "Provider's own sanction history and appeal state." })
  async sanctions(@Req() request: IdentityRequest) {
    return this.listSanctions.execute(this.requireUserId(request));
  }

  @Post("sanctions/:sanctionId/appeal")
  @ApiOkResponse({ description: "Submit a provider appeal for a sanction." })
  async appeal(
    @Param("sanctionId") sanctionId: string,
    @Body() body: unknown,
    @Req() request: IdentityRequest,
  ) {
    const input = parseBody(appealProviderSanctionSchema, body);
    return this.appealSanction.execute({
      sanctionId,
      providerUserId: this.requireUserId(request),
      reason: input.reason,
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
