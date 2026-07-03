import { Module } from "@nestjs/common";

import { AuthorizationModule } from "../foundation/authorization/authorization.module.js";
import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { StorageModule } from "../foundation/storage/storage.module.js";
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
  imports: [ConfigurationModule, DatabaseModule, StorageModule, AuthorizationModule],
  controllers: [OrderChatController, AdminOrderChatController],
  providers: [
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
