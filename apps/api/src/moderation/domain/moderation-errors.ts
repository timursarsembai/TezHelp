export type ModerationErrorCode =
  | "DEVELOPMENT_ADMIN_AUTH_DISABLED"
  | "MODERATION_ACTION_NOT_ALLOWED"
  | "PROVIDER_DOCUMENT_NOT_FOUND"
  | "PROVIDER_SERVICE_PROFILE_NOT_FOUND"
  | "UNAUTHORIZED_ADMIN_USER";

export class ModerationApplicationError extends Error {
  constructor(
    readonly code: ModerationErrorCode,
    message: string,
    readonly httpStatus = 400,
  ) {
    super(message);
  }
}
