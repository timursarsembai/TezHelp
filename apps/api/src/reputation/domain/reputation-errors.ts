export class ReputationApplicationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly httpStatus: number,
    readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = "ReputationApplicationError";
  }
}
