import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { adminCancelOrderSchema } from "@tezhelp/validation";

import { ModerationApplicationError } from "../../moderation/domain/moderation-errors.js";
import {
  type AdminRequest,
  DevelopmentAdminGuard,
} from "../../moderation/presentation/development-admin.guard.js";
import { parseBody } from "../../identity/presentation/zod-body.js";
import { CancelOrderUseCase } from "../application/order-lifecycle.use-cases.js";

@ApiTags("admin-orders")
@UseGuards(DevelopmentAdminGuard)
@Controller("admin/orders")
export class AdminOrdersController {
  constructor(private readonly cancelOrder: CancelOrderUseCase) {}

  @Post(":orderId/cancel")
  @ApiOkResponse({ description: "Cancel an order as an administrator." })
  async cancel(
    @Param("orderId") orderId: string,
    @Body() body: unknown,
    @Req() request: AdminRequest,
  ) {
    const input = parseBody(adminCancelOrderSchema, body);
    return this.cancelOrder.execute({
      actor: "admin",
      actorUserId: this.requireAdminUserId(request),
      orderId,
      reason: input.reason,
      idempotencyKey: input.idempotencyKey,
      holdCommissionForReview: input.holdCommissionForReview,
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
