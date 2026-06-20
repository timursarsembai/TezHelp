import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { StorageModule } from "../foundation/storage/storage.module.js";
import {
  CreateProviderServiceProfileUseCase,
  GetProviderDocumentAccessUrlUseCase,
  GetProviderOfferEligibilityUseCase,
  GetProviderProfileUseCase,
  ListProviderServiceProfilesUseCase,
  RegisterProviderDocumentUseCase,
  SubmitProviderServiceProfileUseCase,
  UpdateProviderProfileUseCase,
} from "./application/provider-profile.use-cases.js";
import { ProviderServicesRepository } from "./infrastructure/provider-services.repository.js";
import { ProviderServicesController } from "./presentation/provider-services.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule, StorageModule],
  controllers: [ProviderServicesController],
  providers: [
    ProviderServicesRepository,
    GetProviderProfileUseCase,
    UpdateProviderProfileUseCase,
    CreateProviderServiceProfileUseCase,
    ListProviderServiceProfilesUseCase,
    RegisterProviderDocumentUseCase,
    SubmitProviderServiceProfileUseCase,
    GetProviderDocumentAccessUrlUseCase,
    GetProviderOfferEligibilityUseCase,
  ],
  exports: [ProviderServicesRepository],
})
export class ProviderServicesModule {}
