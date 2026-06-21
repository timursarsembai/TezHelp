import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { cancelOrderSchema, createOrderSchema, selectProviderSchema } from "@tezhelp/validation";

import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import { DevelopmentIdentityGuard } from "../../identity/presentation/development-identity.guard.js";
import type { IdentityRequest } from "../../identity/presentation/identity-request.js";
import { parseBody } from "../../identity/presentation/zod-body.js";
import {
  CancelOrderUseCase,
  GetOrderContactUseCase,
} from "../application/order-lifecycle.use-cases.js";
import { CreateOrderUseCase, GetOrderUseCase } from "../application/order.use-cases.js";
import { SelectProviderUseCase } from "../application/select-provider.use-case.js";

@ApiTags("orders")
@UseGuards(DevelopmentIdentityGuard)
@Controller("orders")
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly selectProvider: SelectProviderUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
    private readonly getContact: GetOrderContactUseCase,
  ) {}

  @Post()
  @ApiOkResponse({ description: "Create and publish an Almaty order." })
  async create(@Body() body: unknown, @Req() request: IdentityRequest) {
    const input = parseBody(createOrderSchema, body);
    return this.createOrder.execute({
      customerUserId: this.requireUserId(request),
      categorySlug: input.categorySlug,
      latitude: input.latitude,
      longitude: input.longitude,
      addressLandmark: input.addressLandmark,
      description: input.description,
      images: input.images,
      unlockingLawfulAccess: input.unlockingLawfulAccess,
      ...(input.vehicleMake ? { vehicleMake: input.vehicleMake } : {}),
      ...(input.vehicleModel ? { vehicleModel: input.vehicleModel } : {}),
      ...(input.vehicleYear ? { vehicleYear: input.vehicleYear } : {}),
    });
  }

  @Get(":orderId")
  @ApiOkResponse({ description: "Order summary." })
  async get(@Param("orderId") orderId: string) {
    return this.getOrder.execute(orderId);
  }

  @Get(":orderId/contact")
  @ApiOkResponse({ description: "Assigned-party contact visibility for an active order." })
  async contact(@Param("orderId") orderId: string, @Req() request: IdentityRequest) {
    return this.getContact.execute({
      viewerUserId: this.requireUserId(request),
      orderId,
    });
  }

  @Post(":orderId/select-provider")
  @ApiOkResponse({ description: "Select a provider offer and reserve commission." })
  async select(
    @Param("orderId") orderId: string,
    @Body() body: unknown,
    @Req() request: IdentityRequest,
  ) {
    const input = parseBody(selectProviderSchema, body);
    return this.selectProvider.execute({
      customerUserId: this.requireUserId(request),
      orderId,
      offerId: input.offerId,
      idempotencyKey: input.idempotencyKey,
    });
  }

  @Post(":orderId/cancel")
  @ApiOkResponse({ description: "Cancel an order as the customer." })
  async cancel(
    @Param("orderId") orderId: string,
    @Body() body: unknown,
    @Req() request: IdentityRequest,
  ) {
    const input = parseBody(cancelOrderSchema, body);
    return this.cancelOrder.execute({
      actor: "customer",
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
