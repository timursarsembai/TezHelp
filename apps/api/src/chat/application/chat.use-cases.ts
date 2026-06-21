import { Inject, Injectable } from "@nestjs/common";

import type {
  ChatAttachmentAccessUrlResponse,
  ChatMessageSummary,
  OrderConversationSummary,
} from "@tezhelp/types";

import {
  PRIVATE_OBJECT_STORAGE,
  type PrivateObjectStoragePort,
} from "../../foundation/storage/private-object-storage.port.js";
import { ChatPolicy } from "../domain/chat-policy.js";
import { type ChatAttachmentInput, ChatRepository } from "../infrastructure/chat.repository.js";

@Injectable()
export class GetOrderConversationUseCase {
  constructor(private readonly repository: ChatRepository) {}

  async execute(input: {
    readonly orderId: string;
    readonly viewerUserId: string;
  }): Promise<OrderConversationSummary> {
    await this.repository.getParticipantContext(input.orderId, input.viewerUserId);
    return this.repository.getConversation(input.orderId);
  }
}

@Injectable()
export class SendChatMessageUseCase {
  constructor(private readonly repository: ChatRepository) {}

  async execute(input: {
    readonly orderId: string;
    readonly senderUserId: string;
    readonly message:
      | { readonly messageType: "text"; readonly text: string }
      | { readonly messageType: "attachment"; readonly attachment: ChatAttachmentInput };
  }): Promise<ChatMessageSummary> {
    const context = await this.repository.getParticipantContext(input.orderId, input.senderUserId);
    ChatPolicy.assertUserCanSend(context.status);

    if (input.message.messageType === "text") {
      return this.repository.sendTextMessage({
        orderId: input.orderId,
        senderUserId: input.senderUserId,
        senderRole: context.role,
        text: input.message.text,
      });
    }

    ChatPolicy.assertAttachmentMetadata(input.message.attachment);
    return this.repository.sendAttachmentMessage({
      orderId: input.orderId,
      senderUserId: input.senderUserId,
      senderRole: context.role,
      attachment: input.message.attachment,
    });
  }
}

@Injectable()
export class GetChatAttachmentAccessUrlUseCase {
  constructor(
    private readonly repository: ChatRepository,
    @Inject(PRIVATE_OBJECT_STORAGE) private readonly storage: PrivateObjectStoragePort,
  ) {}

  async execute(input: {
    readonly orderId: string;
    readonly attachmentId: string;
    readonly actorUserId: string;
  }): Promise<ChatAttachmentAccessUrlResponse> {
    await this.repository.getParticipantContext(input.orderId, input.actorUserId);
    return this.signAndAudit({
      orderId: input.orderId,
      attachmentId: input.attachmentId,
      actorUserId: input.actorUserId,
      reason: "order_chat_participant_access",
    });
  }

  async executeForAdmin(input: {
    readonly orderId: string;
    readonly attachmentId: string;
    readonly adminUserId: string;
  }): Promise<ChatAttachmentAccessUrlResponse> {
    await this.repository.assertAdminOrderExists(input.orderId);
    return this.signAndAudit({
      orderId: input.orderId,
      attachmentId: input.attachmentId,
      actorUserId: input.adminUserId,
      reason: "admin_dispute_review",
    });
  }

  private async signAndAudit(input: {
    readonly orderId: string;
    readonly attachmentId: string;
    readonly actorUserId: string;
    readonly reason: string;
  }): Promise<ChatAttachmentAccessUrlResponse> {
    const attachment = await this.repository.findAttachmentForAccess({
      orderId: input.orderId,
      attachmentId: input.attachmentId,
    });
    const signed = this.storage.signReadUrl({
      privateObjectKey: attachment.privateObjectKey,
      expiresInSeconds: 300,
    });
    await this.repository.auditAttachmentAccess({
      attachmentId: attachment.id,
      actorUserId: input.actorUserId,
      reason: input.reason,
    });

    return {
      url: signed.url,
      expiresAt: signed.expiresAt.toISOString(),
    };
  }
}

@Injectable()
export class ReportChatMessageUseCase {
  constructor(private readonly repository: ChatRepository) {}

  async execute(input: {
    readonly orderId: string;
    readonly messageId: string;
    readonly reporterUserId: string;
    readonly reason: string;
  }): Promise<{ readonly reported: true }> {
    await this.repository.getParticipantContext(input.orderId, input.reporterUserId);
    return this.repository.reportMessage(input);
  }
}

@Injectable()
export class RecordChatSystemMessageUseCase {
  constructor(private readonly repository: ChatRepository) {}

  async execute(input: {
    readonly orderId: string;
    readonly systemEventType: string;
  }): Promise<ChatMessageSummary> {
    await this.repository.assertAdminOrderExists(input.orderId);
    return this.repository.recordSystemMessage(input);
  }
}

@Injectable()
export class GetAdminOrderConversationUseCase {
  constructor(private readonly repository: ChatRepository) {}

  async execute(orderId: string): Promise<OrderConversationSummary> {
    await this.repository.assertAdminOrderExists(orderId);
    return this.repository.getConversation(orderId);
  }
}
