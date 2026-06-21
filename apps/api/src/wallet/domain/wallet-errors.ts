export type WalletErrorCode =
  | "IDEMPOTENCY_CONFLICT"
  | "PROVIDER_BALANCE_INSUFFICIENT"
  | "WALLET_NEGATIVE_BALANCE"
  | "COMMISSION_RESERVATION_NOT_FOUND"
  | "COMMISSION_RESERVATION_NOT_RESERVED";

export class WalletApplicationError extends Error {
  constructor(
    readonly code: WalletErrorCode,
    message: string,
    readonly httpStatus = 400,
  ) {
    super(message);
  }
}
