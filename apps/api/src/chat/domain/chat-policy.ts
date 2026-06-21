import type { ChatAttachmentKind, OrderStatus } from "@tezhelp/types";

import { ChatApplicationError } from "./chat-errors.js";

export const chatDisputeEvidenceNotice =
  "Discuss price, conditions, and changes in TezHelp chat so the conversation remains available for dispute review.";

const sendableStatuses = new Set<OrderStatus>([
  "provider_selected",
  "provider_en_route",
  "provider_arrived",
  "in_progress",
]);

export class ChatPolicy {
  static assertUserCanSend(status: OrderStatus): void {
    if (!sendableStatuses.has(status)) {
      throw new ChatApplicationError(
        "CHAT_NOT_SENDABLE",
        "Chat messages can be sent only while the selected order is active",
        409,
      );
    }
  }

  static assertAttachmentMetadata(input: {
    readonly kind: ChatAttachmentKind;
    readonly contentType: string;
    readonly sizeBytes: number;
    readonly durationSeconds?: number;
  }): void {
    if (input.kind === "photo") {
      if (!["image/jpeg", "image/png", "image/webp"].includes(input.contentType)) {
        throw new ChatApplicationError(
          "CHAT_NOT_SENDABLE",
          "Unsupported photo attachment type",
          400,
        );
      }
      if (input.sizeBytes <= 0 || input.sizeBytes > 20 * 1024 * 1024) {
        throw new ChatApplicationError(
          "CHAT_NOT_SENDABLE",
          "Photo attachment size is invalid",
          400,
        );
      }
      if (input.durationSeconds !== undefined) {
        throw new ChatApplicationError(
          "CHAT_NOT_SENDABLE",
          "Photo attachment cannot have duration",
          400,
        );
      }
      return;
    }

    if (!["audio/webm", "audio/ogg", "audio/mpeg"].includes(input.contentType)) {
      throw new ChatApplicationError("CHAT_NOT_SENDABLE", "Unsupported voice attachment type", 400);
    }
    if (input.sizeBytes <= 0 || input.sizeBytes > 10 * 1024 * 1024) {
      throw new ChatApplicationError("CHAT_NOT_SENDABLE", "Voice attachment size is invalid", 400);
    }
    if (!input.durationSeconds || input.durationSeconds > 180) {
      throw new ChatApplicationError(
        "CHAT_NOT_SENDABLE",
        "Voice attachment duration is invalid",
        400,
      );
    }
  }
}
