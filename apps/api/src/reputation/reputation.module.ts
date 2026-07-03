import { Module } from "@nestjs/common";

import { AuditModule } from "../foundation/audit/audit.module.js";
import { AuthorizationModule } from "../foundation/authorization/authorization.module.js";
import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import {
  AppealProviderSanctionUseCase,
  CreateProviderSanctionUseCase,
  GetCustomerReliabilityUseCase,
  GetPublicProviderReliabilityUseCase,
  LiftProviderSanctionUseCase,
  ListProviderSanctionsUseCase,
  SubmitOrderReviewUseCase,
} from "./application/reputation.use-cases.js";
import { ReputationRepository } from "./infrastructure/reputation.repository.js";
import { AdminSanctionsController } from "./presentation/admin-sanctions.controller.js";
import { OrderReviewsController } from "./presentation/order-reviews.controller.js";
import { ProviderReputationController } from "./presentation/provider-reputation.controller.js";
import { PublicProviderReliabilityController } from "./presentation/public-provider-reliability.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule, AuthorizationModule, AuditModule],
  controllers: [
    OrderReviewsController,
    ProviderReputationController,
    AdminSanctionsController,
    PublicProviderReliabilityController,
  ],
  providers: [
    ReputationRepository,
    SubmitOrderReviewUseCase,
    GetCustomerReliabilityUseCase,
    GetPublicProviderReliabilityUseCase,
    CreateProviderSanctionUseCase,
    ListProviderSanctionsUseCase,
    AppealProviderSanctionUseCase,
    LiftProviderSanctionUseCase,
  ],
  exports: [
    ReputationRepository,
    SubmitOrderReviewUseCase,
    GetCustomerReliabilityUseCase,
    GetPublicProviderReliabilityUseCase,
    CreateProviderSanctionUseCase,
    ListProviderSanctionsUseCase,
    AppealProviderSanctionUseCase,
    LiftProviderSanctionUseCase,
  ],
})
export class ReputationModule {}
