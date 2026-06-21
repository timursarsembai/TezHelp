import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { createProviderSanctionSchema, liftProviderSanctionSchema } from "@tezhelp/validation";

import { ModerationApplicationError } from "../../moderation/domain/moderation-errors.js";
import {
  type AdminRequest,
  DevelopmentAdminGuard,
} from "../../moderation/presentation/development-admin.guard.js";
import { parseBody } from "../../identity/presentation/zod-body.js";
import {
  CreateProviderSanctionUseCase,
  LiftProviderSanctionUseCase,
} from "../application/reputation.use-cases.js";

@ApiTags("admin-sanctions")
@UseGuards(DevelopmentAdminGuard)
@Controller("admin")
export class AdminSanctionsController {
  constructor(
    private readonly createSanction: CreateProviderSanctionUseCase,
    private readonly liftSanction: LiftProviderSanctionUseCase,
  ) {}

  @Post("providers/:providerUserId/sanctions")
  @ApiOkResponse({ description: "Apply a manual provider sanction." })
  async create(
    @Param("providerUserId") providerUserId: string,
    @Body() body: unknown,
    @Req() request: AdminRequest,
  ) {
    const input = parseBody(createProviderSanctionSchema, body);
    return this.createSanction.execute({
      providerUserId,
      adminUserId: this.requireAdminUserId(request),
      sanctionType: input.sanctionType,
      reason: input.reason,
      ...(input.serviceProfileId ? { serviceProfileId: input.serviceProfileId } : {}),
      ...(input.startsAt ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt ? { endsAt: input.endsAt } : {}),
    });
  }

  @Post("provider-sanctions/:sanctionId/lift")
  @ApiOkResponse({ description: "Lift a provider sanction with an audited reason." })
  async lift(
    @Param("sanctionId") sanctionId: string,
    @Body() body: unknown,
    @Req() request: AdminRequest,
  ) {
    const input = parseBody(liftProviderSanctionSchema, body);
    return this.liftSanction.execute({
      sanctionId,
      adminUserId: this.requireAdminUserId(request),
      reason: input.reason,
    });
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
