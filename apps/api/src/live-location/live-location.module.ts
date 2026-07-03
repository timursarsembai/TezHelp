import { Module } from "@nestjs/common";

import { AuthorizationModule } from "../foundation/authorization/authorization.module.js";
import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
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
  imports: [ConfigurationModule, DatabaseModule, AuthorizationModule],
  controllers: [
    ProviderLiveLocationController,
    OrderLiveLocationController,
    AdminLiveLocationController,
  ],
  providers: [
    LiveLocationRepository,
    PublishProviderLocationUseCase,
    GetOrderLiveLocationUseCase,
    GetAdminOrderLiveLocationUseCase,
  ],
})
export class LiveLocationModule {}
