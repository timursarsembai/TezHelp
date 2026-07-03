import { Injectable } from "@nestjs/common";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

@Injectable()
export class IdentityHashingService {
  hashSecret(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  hashOtp(phone: string, code: string): string {
    return this.hashSecret(`otp:${phone}:${code}`);
  }

  verifyOtp(phone: string, code: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hashOtp(phone, code));
    const expected = Buffer.from(expectedHash);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  createSessionToken(): string {
    return randomBytes(32).toString("hex");
  }

  hashSessionToken(token: string): string {
    return this.hashSecret(`session:${token}`);
  }

  verifySessionToken(token: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hashSessionToken(token));
    const expected = Buffer.from(expectedHash);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  randomId(): string {
    return randomUUID();
  }
}
