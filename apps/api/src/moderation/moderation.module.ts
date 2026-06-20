import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { StorageModule } from "../foundation/storage/storage.module.js";
import {
  ApproveProviderServiceProfileUseCase,
  GetAdminDocumentAccessUrlUseCase,
  GetModerationDetailUseCase,
  ListModerationQueueUseCase,
  MarkModerationUnderReviewUseCase,
  RejectProviderServiceProfileUseCase,
  SuspendProviderServiceProfileUseCase,
} from "./application/moderation.use-cases.js";
import { ModerationRepository } from "./infrastructure/moderation.repository.js";
import { AdminModerationController } from "./presentation/admin-moderation.controller.js";
import { DevelopmentAdminGuard } from "./presentation/development-admin.guard.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule, StorageModule],
  controllers: [AdminModerationController],
  providers: [
    DevelopmentAdminGuard,
    ModerationRepository,
    ListModerationQueueUseCase,
    GetModerationDetailUseCase,
    MarkModerationUnderReviewUseCase,
    ApproveProviderServiceProfileUseCase,
    RejectProviderServiceProfileUseCase,
    SuspendProviderServiceProfileUseCase,
    GetAdminDocumentAccessUrlUseCase,
  ],
})
export class ModerationModule {}
