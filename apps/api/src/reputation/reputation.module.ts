import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { DevelopmentIdentityGuard } from "../identity/presentation/development-identity.guard.js";
import { DevelopmentAdminGuard } from "../moderation/presentation/development-admin.guard.js";
import {
  AppealProviderSanctionUseCase,
  CreateProviderSanctionUseCase,
  GetCustomerReliabilityUseCase,
  LiftProviderSanctionUseCase,
  ListProviderSanctionsUseCase,
  SubmitOrderReviewUseCase,
} from "./application/reputation.use-cases.js";
import { ReputationRepository } from "./infrastructure/reputation.repository.js";
import { AdminSanctionsController } from "./presentation/admin-sanctions.controller.js";
import { OrderReviewsController } from "./presentation/order-reviews.controller.js";
import { ProviderReputationController } from "./presentation/provider-reputation.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule],
  controllers: [OrderReviewsController, ProviderReputationController, AdminSanctionsController],
  providers: [
    DevelopmentIdentityGuard,
    DevelopmentAdminGuard,
    ReputationRepository,
    SubmitOrderReviewUseCase,
    GetCustomerReliabilityUseCase,
    CreateProviderSanctionUseCase,
    ListProviderSanctionsUseCase,
    AppealProviderSanctionUseCase,
    LiftProviderSanctionUseCase,
  ],
  exports: [
    ReputationRepository,
    SubmitOrderReviewUseCase,
    GetCustomerReliabilityUseCase,
    CreateProviderSanctionUseCase,
    ListProviderSanctionsUseCase,
    AppealProviderSanctionUseCase,
    LiftProviderSanctionUseCase,
  ],
})
export class ReputationModule {}
