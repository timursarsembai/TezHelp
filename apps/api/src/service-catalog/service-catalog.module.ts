import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { DevelopmentAdminGuard } from "../moderation/presentation/development-admin.guard.js";
import {
  GetServiceCategoryCommercialConfigUseCase,
  ListServiceCategoriesUseCase,
  UpdateServiceCategoryCommercialConfigUseCase,
} from "./application/list-service-categories.use-case.js";
import { ServiceCatalogRepository } from "./infrastructure/service-catalog.repository.js";
import { AdminServiceCategoriesController } from "./presentation/admin-service-categories.controller.js";
import { ServiceCategoriesController } from "./presentation/service-categories.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule],
  controllers: [ServiceCategoriesController, AdminServiceCategoriesController],
  providers: [
    DevelopmentAdminGuard,
    ServiceCatalogRepository,
    ListServiceCategoriesUseCase,
    GetServiceCategoryCommercialConfigUseCase,
    UpdateServiceCategoryCommercialConfigUseCase,
  ],
  exports: [ServiceCatalogRepository],
})
export class ServiceCatalogModule {}
