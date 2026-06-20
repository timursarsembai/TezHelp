interface OtpDeliveryRequest {
  readonly phone: string;
  readonly code: string;
}

export interface OtpDeliveryPort {
  sendOtp(request: OtpDeliveryRequest): Promise<void>;
}
