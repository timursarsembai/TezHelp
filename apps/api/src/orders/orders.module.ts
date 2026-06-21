import { Module } from "@nestjs/common";

import { CommissionCalculator } from "../commissions/domain/commission-calculator.js";
import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { DevelopmentIdentityGuard } from "../identity/presentation/development-identity.guard.js";
import { WalletModule } from "../wallet/wallet.module.js";
import { CreateOrderUseCase, GetOrderUseCase } from "./application/order.use-cases.js";
import { SelectProviderUseCase } from "./application/select-provider.use-case.js";
import { OrdersRepository } from "./infrastructure/orders.repository.js";
import { OrdersController } from "./presentation/orders.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule, WalletModule],
  controllers: [OrdersController],
  providers: [
    DevelopmentIdentityGuard,
    CommissionCalculator,
    OrdersRepository,
    CreateOrderUseCase,
    GetOrderUseCase,
    SelectProviderUseCase,
  ],
  exports: [OrdersRepository],
})
export class OrdersModule {}
