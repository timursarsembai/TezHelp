import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { StorageModule } from "../foundation/storage/storage.module.js";
import { DevelopmentIdentityGuard } from "../identity/presentation/development-identity.guard.js";
import { DevelopmentAdminGuard } from "../moderation/presentation/development-admin.guard.js";
import {
  GetAdminOrderConversationUseCase,
  GetChatAttachmentAccessUrlUseCase,
  GetOrderConversationUseCase,
  RecordChatSystemMessageUseCase,
  ReportChatMessageUseCase,
  SendChatMessageUseCase,
} from "./application/chat.use-cases.js";
import { ChatRepository } from "./infrastructure/chat.repository.js";
import { AdminOrderChatController } from "./presentation/admin-order-chat.controller.js";
import { OrderChatController } from "./presentation/order-chat.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule, StorageModule],
  controllers: [OrderChatController, AdminOrderChatController],
  providers: [
    DevelopmentIdentityGuard,
    DevelopmentAdminGuard,
    ChatRepository,
    GetOrderConversationUseCase,
    SendChatMessageUseCase,
    GetChatAttachmentAccessUrlUseCase,
    ReportChatMessageUseCase,
    RecordChatSystemMessageUseCase,
    GetAdminOrderConversationUseCase,
  ],
})
export class ChatModule {}
