import { Injectable } from "@nestjs/common";

import type { OtpDeliveryPort } from "../application/ports/otp-delivery.port.js";

@Injectable()
export class DevelopmentOtpAdapter implements OtpDeliveryPort {
  async sendOtp(): Promise<void> {
    await Promise.resolve();
  }
}
