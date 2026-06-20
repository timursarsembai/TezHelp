export type IdentityErrorCode =
  | "DEVELOPMENT_AUTH_DISABLED"
  | "DEVELOPMENT_OTP_DISABLED"
  | "DUPLICATE_VERIFIED_PHONE"
  | "INVALID_OTP"
  | "OTP_EXPIRED"
  | "OTP_LOCKED"
  | "OTP_RATE_LIMITED"
  | "OTP_RESEND_COOLDOWN"
  | "PHONE_CHANGE_REQUIRES_RECENT_AUTH"
  | "UNAUTHORIZED_IDENTITY_USER"
  | "USER_NOT_FOUND";

export class IdentityApplicationError extends Error {
  constructor(
    readonly code: IdentityErrorCode,
    message: string,
    readonly httpStatus = 400,
  ) {
    super(message);
  }
}
