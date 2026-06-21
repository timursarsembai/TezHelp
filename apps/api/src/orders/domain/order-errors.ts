export type OrderErrorCode =
  | "ORDER_NOT_FOUND"
  | "ORDER_NOT_SELECTABLE"
  | "ORDER_IMAGE_LIMIT_EXCEEDED"
  | "OFFER_NOT_SELECTABLE";

export class OrderApplicationError extends Error {
  constructor(
    readonly code: OrderErrorCode,
    message: string,
    readonly httpStatus = 400,
  ) {
    super(message);
  }
}
