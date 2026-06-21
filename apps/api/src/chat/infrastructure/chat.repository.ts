import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import type { Transaction } from "kysely";

import type {
  ChatAttachmentKind,
  ChatAttachmentSummary,
  ChatMessageSummary,
  ChatMessageType,
  ChatSenderRole,
  OrderConversationSummary,
  OrderStatus,
} from "@tezhelp/types";

import { DatabaseService } from "../../foundation/database/database.service.js";
import type { DatabaseSchema } from "../../foundation/database/database.types.js";
import { ChatApplicationError } from "../domain/chat-errors.js";
import { chatDisputeEvidenceNotice } from "../domain/chat-policy.js";

export interface ChatParticipantContext {
  readonly orderId: string;
  readonly status: OrderStatus;
  readonly role: Exclude<ChatSenderRole, "system">;
  readonly userId: string;
}

export interface ChatAttachmentInput {
  readonly kind: ChatAttachmentKind;
  readonly privateObjectKey: string;
  readonly originalFilename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly durationSeconds?: number;
}

@Injectable()
export class ChatRepository {
  constructor(private readonly database: DatabaseService) {}

  async transaction<T>(callback: (trx: Transaction<DatabaseSchema>) => Promise<T>): Promise<T> {
    return this.database.transaction(callback);
  }

  async getParticipantContext(orderId: string, userId: string): Promise<ChatParticipantContext> {
    const row = await this.database.db
      .selectFrom("orders")
      .select(["id", "status", "customer_user_id", "assigned_provider_user_id"])
      .where("id", "=", orderId)
      .executeTakeFirst();
    if (!row) {
      throw new ChatApplicationError("CHAT_ORDER_NOT_FOUND", "Order not found", 404);
    }
    if (row.customer_user_id === userId) {
      return { orderId: row.id, status: row.status, role: "customer", userId };
    }
    if (row.assigned_provider_user_id === userId) {
      return { orderId: row.id, status: row.status, role: "provider", userId };
    }

    throw new ChatApplicationError("CHAT_FORBIDDEN", "Chat is not visible to this user", 403);
  }

  async ensureConversation(orderId: string, trx = this.database.db): Promise<void> {
    await trx
      .insertInto("order_conversations")
      .values({ order_id: orderId, updated_at: new Date() })
      .onConflict((oc) => oc.column("order_id").doNothing())
      .execute();
  }

  async getConversation(orderId: string): Promise<OrderConversationSummary> {
    await this.ensureConversation(orderId);
    const rows = await this.database.db
      .selectFrom("chat_messages")
      .leftJoin("chat_attachments", "chat_attachments.message_id", "chat_messages.id")
      .select([
        "chat_messages.id",
        "chat_messages.order_id",
        "chat_messages.sender_user_id",
        "chat_messages.sender_role",
        "chat_messages.message_type",
        "chat_messages.text_body",
        "chat_messages.system_event_type",
        "chat_messages.delivered_at",
        "chat_messages.created_at",
        "chat_attachments.id as attachment_id",
        "chat_attachments.message_id as attachment_message_id",
        "chat_attachments.attachment_kind",
        "chat_attachments.original_filename",
        "chat_attachments.content_type",
        "chat_attachments.size_bytes",
        "chat_attachments.duration_seconds",
        "chat_attachments.created_at as attachment_created_at",
      ])
      .where("chat_messages.order_id", "=", orderId)
      .orderBy("chat_messages.created_at", "asc")
      .limit(200)
      .execute();

    return {
      orderId,
      disputeEvidenceNotice: chatDisputeEvidenceNotice,
      messages: rows.map((row) => this.toMessageSummary(row)),
    };
  }

  async sendTextMessage(input: {
    readonly orderId: string;
    readonly senderUserId: string;
    readonly senderRole: Exclude<ChatSenderRole, "system">;
    readonly text: string;
  }): Promise<ChatMessageSummary> {
    return this.database.transaction(async (trx) => {
      await this.ensureConversation(input.orderId, trx);
      const row = await trx
        .insertInto("chat_messages")
        .values({
          id: randomUUID(),
          order_id: input.orderId,
          sender_user_id: input.senderUserId,
          sender_role: input.senderRole,
          message_type: "text",
          text_body: input.text,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await this.touchConversation(trx, input.orderId);

      return this.toMessageSummary(row);
    });
  }

  async sendAttachmentMessage(input: {
    readonly orderId: string;
    readonly senderUserId: string;
    readonly senderRole: Exclude<ChatSenderRole, "system">;
    readonly attachment: ChatAttachmentInput;
  }): Promise<ChatMessageSummary> {
    return this.database.transaction(async (trx) => {
      await this.ensureConversation(input.orderId, trx);
      const messageId = randomUUID();
      const message = await trx
        .insertInto("chat_messages")
        .values({
          id: messageId,
          order_id: input.orderId,
          sender_user_id: input.senderUserId,
          sender_role: input.senderRole,
          message_type: "attachment",
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      const attachment = await trx
        .insertInto("chat_attachments")
        .values({
          message_id: messageId,
          order_id: input.orderId,
          attachment_kind: input.attachment.kind,
          private_object_key: input.attachment.privateObjectKey,
          original_filename: input.attachment.originalFilename,
          content_type: input.attachment.contentType,
          size_bytes: input.attachment.sizeBytes,
          duration_seconds: input.attachment.durationSeconds ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await this.touchConversation(trx, input.orderId);

      return {
        ...this.toMessageSummary(message),
        attachment: this.toAttachmentSummary(attachment),
      };
    });
  }

  async recordSystemMessage(input: {
    readonly orderId: string;
    readonly systemEventType: string;
  }): Promise<ChatMessageSummary> {
    return this.database.transaction(async (trx) => {
      await this.ensureConversation(input.orderId, trx);
      const row = await trx
        .insertInto("chat_messages")
        .values({
          id: randomUUID(),
          order_id: input.orderId,
          sender_user_id: null,
          sender_role: "system",
          message_type: "system",
          system_event_type: input.systemEventType,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await this.touchConversation(trx, input.orderId);

      return this.toMessageSummary(row);
    });
  }

  async findAttachmentForAccess(input: {
    readonly orderId: string;
    readonly attachmentId: string;
  }): Promise<{ readonly id: string; readonly privateObjectKey: string }> {
    const row = await this.database.db
      .selectFrom("chat_attachments")
      .select(["id", "private_object_key"])
      .where("id", "=", input.attachmentId)
      .where("order_id", "=", input.orderId)
      .executeTakeFirst();
    if (!row) {
      throw new ChatApplicationError("CHAT_ATTACHMENT_NOT_FOUND", "Attachment not found", 404);
    }

    return { id: row.id, privateObjectKey: row.private_object_key };
  }

  async auditAttachmentAccess(input: {
    readonly attachmentId: string;
    readonly actorUserId?: string;
    readonly reason: string;
  }): Promise<void> {
    await this.database.db
      .insertInto("chat_attachment_access_audit")
      .values({
        attachment_id: input.attachmentId,
        actor_user_id: input.actorUserId ?? null,
        access_action: "signed_read_url",
        reason: input.reason,
      })
      .execute();
  }

  async reportMessage(input: {
    readonly orderId: string;
    readonly messageId: string;
    readonly reporterUserId: string;
    readonly reason: string;
  }): Promise<{ readonly reported: true }> {
    const message = await this.database.db
      .selectFrom("chat_messages")
      .select("id")
      .where("id", "=", input.messageId)
      .where("order_id", "=", input.orderId)
      .executeTakeFirst();
    if (!message) {
      throw new ChatApplicationError("CHAT_MESSAGE_NOT_FOUND", "Message not found", 404);
    }

    await this.database.db
      .insertInto("chat_message_reports")
      .values({
        message_id: input.messageId,
        reporter_user_id: input.reporterUserId,
        reason: input.reason,
      })
      .onConflict((oc) =>
        oc.columns(["message_id", "reporter_user_id"]).doUpdateSet({
          reason: input.reason,
        }),
      )
      .execute();

    return { reported: true };
  }

  async assertAdminOrderExists(orderId: string): Promise<void> {
    const row = await this.database.db
      .selectFrom("orders")
      .select("id")
      .where("id", "=", orderId)
      .executeTakeFirst();
    if (!row) {
      throw new ChatApplicationError("CHAT_ORDER_NOT_FOUND", "Order not found", 404);
    }
  }

  private async touchConversation(
    trx: Transaction<DatabaseSchema>,
    orderId: string,
  ): Promise<void> {
    await trx
      .updateTable("order_conversations")
      .set({ updated_at: new Date() })
      .where("order_id", "=", orderId)
      .execute();
  }

  private toMessageSummary(row: {
    readonly id: string;
    readonly order_id: string;
    readonly sender_user_id: string | null;
    readonly sender_role: ChatSenderRole;
    readonly message_type: ChatMessageType;
    readonly text_body: string | null;
    readonly system_event_type: string | null;
    readonly delivered_at: Date;
    readonly created_at: Date;
    readonly attachment_id?: string | null;
    readonly attachment_message_id?: string | null;
    readonly attachment_kind?: ChatAttachmentKind | null;
    readonly original_filename?: string | null;
    readonly content_type?: string | null;
    readonly size_bytes?: number | null;
    readonly duration_seconds?: number | null;
    readonly attachment_created_at?: Date | null;
  }): ChatMessageSummary {
    return {
      id: row.id,
      orderId: row.order_id,
      senderRole: row.sender_role,
      messageType: row.message_type,
      deliveredAt: row.delivered_at.toISOString(),
      createdAt: row.created_at.toISOString(),
      ...(row.sender_user_id ? { senderUserId: row.sender_user_id } : {}),
      ...(row.text_body ? { textBody: row.text_body } : {}),
      ...(row.system_event_type ? { systemEventType: row.system_event_type } : {}),
      ...(row.attachment_id &&
      row.attachment_message_id &&
      row.attachment_kind &&
      row.original_filename &&
      row.content_type &&
      row.size_bytes &&
      row.attachment_created_at
        ? {
            attachment: this.toAttachmentSummary({
              id: row.attachment_id,
              message_id: row.attachment_message_id,
              attachment_kind: row.attachment_kind,
              original_filename: row.original_filename,
              content_type: row.content_type,
              size_bytes: row.size_bytes,
              duration_seconds: row.duration_seconds ?? null,
              created_at: row.attachment_created_at,
            }),
          }
        : {}),
    };
  }

  private toAttachmentSummary(row: {
    readonly id: string;
    readonly message_id: string;
    readonly attachment_kind: ChatAttachmentKind;
    readonly original_filename: string;
    readonly content_type: string;
    readonly size_bytes: number;
    readonly duration_seconds: number | null;
    readonly created_at: Date;
  }): ChatAttachmentSummary {
    return {
      id: row.id,
      messageId: row.message_id,
      kind: row.attachment_kind,
      originalFilename: row.original_filename,
      contentType: row.content_type,
      sizeBytes: row.size_bytes,
      createdAt: row.created_at.toISOString(),
      ...(row.duration_seconds ? { durationSeconds: row.duration_seconds } : {}),
    };
  }
}
