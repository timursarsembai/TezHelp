import { Module } from "@nestjs/common";

import { CommissionCalculator } from "../commissions/domain/commission-calculator.js";
import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { DevelopmentIdentityGuard } from "../identity/presentation/development-identity.guard.js";
import { DevelopmentAdminGuard } from "../moderation/presentation/development-admin.guard.js";
import { WalletModule } from "../wallet/wallet.module.js";
import {
  CancelOrderUseCase,
  CompleteOrderUseCase,
  ConfirmProviderArrivalUseCase,
  ConfirmProviderDepartureUseCase,
  GetOrderContactUseCase,
  StartOrderWorkUseCase,
} from "./application/order-lifecycle.use-cases.js";
import { CreateOrderUseCase, GetOrderUseCase, GetProviderActiveOrderUseCase } from "./application/order.use-cases.js";
import { SelectProviderUseCase } from "./application/select-provider.use-case.js";
import { OrdersRepository } from "./infrastructure/orders.repository.js";
import { AdminOrdersController } from "./presentation/admin-orders.controller.js";
import { OrdersController } from "./presentation/orders.controller.js";
import { ProviderOrderLifecycleController } from "./presentation/provider-order-lifecycle.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule, WalletModule],
  controllers: [OrdersController, ProviderOrderLifecycleController, AdminOrdersController],
  providers: [
    DevelopmentIdentityGuard,
    DevelopmentAdminGuard,
    CommissionCalculator,
    OrdersRepository,
    CreateOrderUseCase,
    GetOrderUseCase,
    GetProviderActiveOrderUseCase,
    SelectProviderUseCase,
    ConfirmProviderDepartureUseCase,
    ConfirmProviderArrivalUseCase,
    StartOrderWorkUseCase,
    CompleteOrderUseCase,
    CancelOrderUseCase,
    GetOrderContactUseCase,
  ],
  exports: [OrdersRepository],
})
export class OrdersModule {}
