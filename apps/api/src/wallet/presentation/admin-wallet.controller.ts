import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { walletAdjustmentSchema } from "@tezhelp/validation";

import { parseBody } from "../../identity/presentation/zod-body.js";
import { ModerationApplicationError } from "../../moderation/domain/moderation-errors.js";
import { RateLimit } from "../../foundation/authorization/rate-limit.decorator.js";
import { RateLimitGuard } from "../../foundation/authorization/rate-limit.guard.js";
import {
  type AdminRequest,
  StaffAuthGuard,
} from "../../foundation/authorization/staff-auth.guard.js";
import {
  ManualWalletCreditUseCase,
  ManualWalletDebitCorrectionUseCase,
} from "../application/wallet.use-cases.js";

@ApiTags("admin-wallet")
@UseGuards(StaffAuthGuard)
@Controller("admin/wallet")
export class AdminWalletController {
  constructor(
    private readonly manualCredit: ManualWalletCreditUseCase,
    private readonly manualDebitCorrection: ManualWalletDebitCorrectionUseCase,
  ) {}

  @Post("manual-credit")
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 30, windowSeconds: 3600 })
  @ApiOkResponse({ description: "Append a manual wallet credit ledger entry." })
  async credit(@Body() body: unknown, @Req() request: AdminRequest) {
    const input = parseBody(walletAdjustmentSchema, body);
    return this.manualCredit.execute({
      ...input,
      adminUserId: this.requireAdminUserId(request),
    });
  }

  @Post("manual-debit-correction")
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 30, windowSeconds: 3600 })
  @ApiOkResponse({ description: "Append a manual wallet debit correction ledger entry." })
  async debitCorrection(@Body() body: unknown, @Req() request: AdminRequest) {
    const input = parseBody(walletAdjustmentSchema, body);
    return this.manualDebitCorrection.execute({
      ...input,
      adminUserId: this.requireAdminUserId(request),
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
