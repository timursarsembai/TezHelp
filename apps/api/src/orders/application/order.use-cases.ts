import { Injectable } from "@nestjs/common";

import type { OrderSummary } from "@tezhelp/types";

import { type CreateOrderInput, OrdersRepository } from "../infrastructure/orders.repository.js";

@Injectable()
export class CreateOrderUseCase {
  constructor(private readonly repository: OrdersRepository) {}

  async execute(input: CreateOrderInput): Promise<OrderSummary> {
    return this.repository.createOrder(input);
  }
}

@Injectable()
export class GetOrderUseCase {
  constructor(private readonly repository: OrdersRepository) {}

  async execute(orderId: string): Promise<OrderSummary> {
    return this.repository.getOrderById(orderId);
  }
}

@Injectable()
export class GetProviderActiveOrderUseCase {
  constructor(private readonly repository: OrdersRepository) {}

  async execute(providerUserId: string): Promise<OrderSummary | null> {
    return this.repository.getProviderActiveOrder(providerUserId);
  }
}
