import { Module } from "@nestjs/common";

import { AuditModule } from "../foundation/audit/audit.module.js";
import { AuthorizationModule } from "../foundation/authorization/authorization.module.js";
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
import { AdminIdentityController } from "./presentation/admin-identity.controller.js";
import { AdminModerationController } from "./presentation/admin-moderation.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule, StorageModule, AuthorizationModule, AuditModule],
  controllers: [AdminModerationController, AdminIdentityController],
  providers: [
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
