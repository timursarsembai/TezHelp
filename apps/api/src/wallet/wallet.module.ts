import { Module } from "@nestjs/common";

import { AuthorizationModule } from "../foundation/authorization/authorization.module.js";
import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import {
  GetProviderWalletUseCase,
  ListProviderLedgerUseCase,
  ManualWalletCreditUseCase,
  ManualWalletDebitCorrectionUseCase,
} from "./application/wallet.use-cases.js";
import { WalletRepository } from "./infrastructure/wallet.repository.js";
import { AdminWalletController } from "./presentation/admin-wallet.controller.js";
import { ProviderWalletController } from "./presentation/provider-wallet.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule, AuthorizationModule],
  controllers: [ProviderWalletController, AdminWalletController],
  providers: [
    WalletRepository,
    GetProviderWalletUseCase,
    ListProviderLedgerUseCase,
    ManualWalletCreditUseCase,
    ManualWalletDebitCorrectionUseCase,
  ],
  exports: [WalletRepository],
})
export class WalletModule {}
