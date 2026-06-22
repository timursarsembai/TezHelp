export type OrderErrorCode =
  | "ORDER_NOT_FOUND"
  | "ORDER_NOT_SELECTABLE"
  | "ORDER_IMAGE_LIMIT_EXCEEDED"
  | "OFFER_NOT_SELECTABLE"
  | "ORDER_INVALID_TRANSITION"
  | "ORDER_ALREADY_TERMINAL"
  | "ORDER_CONTACT_FORBIDDEN"
  | "ORDER_PROVIDER_FORBIDDEN"
  | "ORDER_CUSTOMER_FORBIDDEN"
  | "ORDER_PROVIDER_PROFILE_NOT_FOUND"
  | "ORDER_COMMISSION_RESERVATION_MISSING"
  | "ORDER_PROVIDER_ASSIGNMENT_MISSING";

export class OrderApplicationError extends Error {
  constructor(
    readonly code: OrderErrorCode,
    message: string,
    readonly httpStatus = 400,
  ) {
    super(message);
  }
}
