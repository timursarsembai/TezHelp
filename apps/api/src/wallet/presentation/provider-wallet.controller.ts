import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import { DevelopmentIdentityGuard } from "../../identity/presentation/development-identity.guard.js";
import type { IdentityRequest } from "../../identity/presentation/identity-request.js";
import {
  GetProviderWalletUseCase,
  ListProviderLedgerUseCase,
} from "../application/wallet.use-cases.js";

@ApiTags("wallet")
@UseGuards(DevelopmentIdentityGuard)
@Controller("provider/wallet")
export class ProviderWalletController {
  constructor(
    private readonly getWallet: GetProviderWalletUseCase,
    private readonly listLedger: ListProviderLedgerUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: "Current provider wallet summary." })
  async wallet(@Req() request: IdentityRequest) {
    return this.getWallet.execute(this.requireUserId(request));
  }

  @Get("ledger")
  @ApiOkResponse({ description: "Provider wallet ledger entries." })
  async ledger(@Req() request: IdentityRequest) {
    return this.listLedger.execute(this.requireUserId(request));
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
