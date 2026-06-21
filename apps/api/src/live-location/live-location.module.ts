import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { DevelopmentIdentityGuard } from "../identity/presentation/development-identity.guard.js";
import { DevelopmentAdminGuard } from "../moderation/presentation/development-admin.guard.js";
import {
  GetAdminOrderLiveLocationUseCase,
  GetOrderLiveLocationUseCase,
  PublishProviderLocationUseCase,
} from "./application/live-location.use-cases.js";
import { LiveLocationRepository } from "./infrastructure/live-location.repository.js";
import { AdminLiveLocationController } from "./presentation/admin-live-location.controller.js";
import { OrderLiveLocationController } from "./presentation/order-live-location.controller.js";
import { ProviderLiveLocationController } from "./presentation/provider-live-location.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule],
  controllers: [
    ProviderLiveLocationController,
    OrderLiveLocationController,
    AdminLiveLocationController,
  ],
  providers: [
    DevelopmentIdentityGuard,
    DevelopmentAdminGuard,
    LiveLocationRepository,
    PublishProviderLocationUseCase,
    GetOrderLiveLocationUseCase,
    GetAdminOrderLiveLocationUseCase,
  ],
})
export class LiveLocationModule {}
