import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { cancelOrderSchema, orderLifecycleCommandSchema } from "@tezhelp/validation";

import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import { DevelopmentIdentityGuard } from "../../identity/presentation/development-identity.guard.js";
import type { IdentityRequest } from "../../identity/presentation/identity-request.js";
import { parseBody } from "../../identity/presentation/zod-body.js";
import {
  CancelOrderUseCase,
  CompleteOrderUseCase,
  ConfirmProviderArrivalUseCase,
  ConfirmProviderDepartureUseCase,
  StartOrderWorkUseCase,
} from "../application/order-lifecycle.use-cases.js";
import { GetProviderActiveOrderUseCase } from "../application/order.use-cases.js";

@ApiTags("provider-order-lifecycle")
@UseGuards(DevelopmentIdentityGuard)
@Controller("provider/orders")
export class ProviderOrderLifecycleController {
  constructor(
    private readonly depart: ConfirmProviderDepartureUseCase,
    private readonly arrive: ConfirmProviderArrivalUseCase,
    private readonly startWork: StartOrderWorkUseCase,
    private readonly complete: CompleteOrderUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
    private readonly getActiveOrder: GetProviderActiveOrderUseCase,
  ) {}

  @Get("active")
  @ApiOkResponse({ description: "Currently assigned active order for the provider, or null." })
  async activeOrder(@Req() request: IdentityRequest) {
    return this.getActiveOrder.execute(this.requireUserId(request));
  }

  @Post(":orderId/depart")
  @ApiOkResponse({ description: "Confirm provider departure and reveal contact details." })
  async confirmDeparture(@Param("orderId") orderId: string, @Req() request: IdentityRequest) {
    return this.depart.execute({
      providerUserId: this.requireUserId(request),
      orderId,
    });
  }

  @Post(":orderId/arrive")
  @ApiOkResponse({ description: "Confirm provider arrival." })
  async confirmArrival(@Param("orderId") orderId: string, @Req() request: IdentityRequest) {
    return this.arrive.execute({
      providerUserId: this.requireUserId(request),
      orderId,
    });
  }

  @Post(":orderId/start-work")
  @ApiOkResponse({ description: "Mark the order service as in progress." })
  async start(@Param("orderId") orderId: string, @Req() request: IdentityRequest) {
    return this.startWork.execute({
      providerUserId: this.requireUserId(request),
      orderId,
    });
  }

  @Post(":orderId/complete")
  @ApiOkResponse({ description: "Complete the order and capture reserved commission." })
  async completeOrder(
    @Param("orderId") orderId: string,
    @Body() body: unknown,
    @Req() request: IdentityRequest,
  ) {
    const input = parseBody(orderLifecycleCommandSchema, body);
    return this.complete.execute({
      providerUserId: this.requireUserId(request),
      orderId,
      idempotencyKey: input.idempotencyKey,
    });
  }

  @Post(":orderId/cancel")
  @ApiOkResponse({ description: "Cancel the active order as the assigned provider." })
  async cancel(
    @Param("orderId") orderId: string,
    @Body() body: unknown,
    @Req() request: IdentityRequest,
  ) {
    const input = parseBody(cancelOrderSchema, body);
    return this.cancelOrder.execute({
      actor: "provider",
      actorUserId: this.requireUserId(request),
      orderId,
      reason: input.reason,
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
