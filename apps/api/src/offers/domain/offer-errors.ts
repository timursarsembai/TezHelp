export type OfferErrorCode =
  | "DUPLICATE_OFFER"
  | "IDEMPOTENCY_CONFLICT"
  | "ORDER_NOT_AVAILABLE"
  | "PROVIDER_BALANCE_INSUFFICIENT"
  | "PROVIDER_HAS_ACTIVE_ORDER"
  | "PROVIDER_NOT_ELIGIBLE"
  | "PROVIDER_SANCTIONED"
  | "PROVIDER_SERVICE_PROFILE_NOT_APPROVED";

export class OfferApplicationError extends Error {
  constructor(
    readonly code: OfferErrorCode,
    message: string,
    readonly httpStatus = 400,
  ) {
    super(message);
  }
}
