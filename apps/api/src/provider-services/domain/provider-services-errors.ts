export type ProviderServicesErrorCode =
  | "CATEGORY_NOT_FOUND"
  | "DOCUMENT_RULE_NOT_FOUND"
  | "DOCUMENT_TYPE_NOT_ALLOWED"
  | "DOCUMENT_CONTENT_TYPE_NOT_ALLOWED"
  | "PROVIDER_DOCUMENT_FILE_REQUIRED"
  | "DOCUMENT_TOO_LARGE"
  | "PROVIDER_PROFILE_INCOMPLETE"
  | "PROVIDER_TAX_STATUS_NOT_ALLOWED"
  | "PROVIDER_REQUIRED_DOCUMENTS_MISSING"
  | "PROVIDER_PROFILE_NOT_FOUND"
  | "PROVIDER_SERVICE_PROFILE_NOT_FOUND"
  | "PROVIDER_SERVICE_PROFILE_NOT_SUBMITTABLE"
  | "UNAUTHORIZED_DOCUMENT_ACCESS";

export class ProviderServicesApplicationError extends Error {
  constructor(
    readonly code: ProviderServicesErrorCode,
    message: string,
    readonly httpStatus = 400,
  ) {
    super(message);
  }
}
