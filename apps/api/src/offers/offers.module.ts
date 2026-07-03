import { Module } from "@nestjs/common";

import { CommissionCalculator } from "../commissions/domain/commission-calculator.js";
import { AuthorizationModule } from "../foundation/authorization/authorization.module.js";
import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
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
  imports: [ConfigurationModule, DatabaseModule, WalletModule, AuthorizationModule],
  controllers: [ProviderOffersController, OrderOffersController],
  providers: [
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
