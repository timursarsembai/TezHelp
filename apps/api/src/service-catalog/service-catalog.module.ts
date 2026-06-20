import { Module } from "@nestjs/common";

import { DatabaseModule } from "../foundation/database/database.module.js";
import { ListServiceCategoriesUseCase } from "./application/list-service-categories.use-case.js";
import { ServiceCatalogRepository } from "./infrastructure/service-catalog.repository.js";
import { ServiceCategoriesController } from "./presentation/service-categories.controller.js";

@Module({
  imports: [DatabaseModule],
  controllers: [ServiceCategoriesController],
  providers: [ServiceCatalogRepository, ListServiceCategoriesUseCase],
  exports: [ServiceCatalogRepository],
})
export class ServiceCatalogModule {}
