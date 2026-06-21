import { Module } from "@nestjs/common";

import { CommissionCalculator } from "../commissions/domain/commission-calculator.js";
import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { DevelopmentIdentityGuard } from "../identity/presentation/development-identity.guard.js";
import { WalletModule } from "../wallet/wallet.module.js";
import {
  GetProviderDiscoveryPreferenceUseCase,
  ListOrderOffersUseCase,
  ListProviderOrdersUseCase,
  SubmitOfferUseCase,
  UpdateProviderDiscoveryPreferenceUseCase,
} from "./application/offers.use-cases.js";
import { OffersRepository } from "./infrastructure/offers.repository.js";
import { OrderOffersController } from "./presentation/order-offers.controller.js";
import { ProviderOffersController } from "./presentation/provider-offers.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule, WalletModule],
  controllers: [ProviderOffersController, OrderOffersController],
  providers: [
    DevelopmentIdentityGuard,
    CommissionCalculator,
    OffersRepository,
    ListProviderOrdersUseCase,
    GetProviderDiscoveryPreferenceUseCase,
    UpdateProviderDiscoveryPreferenceUseCase,
    SubmitOfferUseCase,
    ListOrderOffersUseCase,
  ],
  exports: [OffersRepository],
})
export class OffersModule {}
