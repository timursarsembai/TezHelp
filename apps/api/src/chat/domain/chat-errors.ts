export type ChatErrorCode =
  | "CHAT_ORDER_NOT_FOUND"
  | "CHAT_FORBIDDEN"
  | "CHAT_NOT_SENDABLE"
  | "CHAT_MESSAGE_NOT_FOUND"
  | "CHAT_ATTACHMENT_NOT_FOUND";

export class ChatApplicationError extends Error {
  constructor(
    readonly code: ChatErrorCode,
    message: string,
    readonly httpStatus = 400,
  ) {
    super(message);
  }
}
