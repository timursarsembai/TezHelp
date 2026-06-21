import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { DevelopmentIdentityGuard } from "../identity/presentation/development-identity.guard.js";
import { DevelopmentAdminGuard } from "../moderation/presentation/development-admin.guard.js";
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
  imports: [ConfigurationModule, DatabaseModule],
  controllers: [ProviderWalletController, AdminWalletController],
  providers: [
    DevelopmentIdentityGuard,
    DevelopmentAdminGuard,
    WalletRepository,
    GetProviderWalletUseCase,
    ListProviderLedgerUseCase,
    ManualWalletCreditUseCase,
    ManualWalletDebitCorrectionUseCase,
  ],
  exports: [WalletRepository],
})
export class WalletModule {}
