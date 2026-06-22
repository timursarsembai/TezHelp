import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { resolveApiLocale } from "../../foundation/http/locale-query.js";
import { GetPublicProviderReliabilityUseCase } from "../application/reputation.use-cases.js";

@ApiTags("public-provider-reliability")
@Controller("providers/service-profiles/:serviceProfileId/reliability")
export class PublicProviderReliabilityController {
  constructor(private readonly getReliability: GetPublicProviderReliabilityUseCase) {}

  @Get()
  @ApiOkResponse({
    description: "Public provider service reliability summary without private sanction details.",
  })
  async reliability(
    @Param("serviceProfileId") serviceProfileId: string,
    @Query("locale") rawLocale?: string,
  ) {
    return this.getReliability.execute({
      serviceProfileId,
      locale: resolveApiLocale(rawLocale),
    });
  }
}
