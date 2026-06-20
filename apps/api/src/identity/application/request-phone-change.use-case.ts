import { Inject, Injectable } from "@nestjs/common";

import type { OtpChallengeResponse } from "@tezhelp/types";

import { IdentityApplicationError } from "../domain/identity-errors.js";
import { IdentityRepository } from "../infrastructure/identity.repository.js";
import { RequestPhoneOtpUseCase } from "./request-phone-otp.use-case.js";
import type { Clock } from "./ports/clock.port.js";
import { IDENTITY_CLOCK } from "../identity.tokens.js";

export interface RequestPhoneChangeInput {
  readonly userId: string;
  readonly newPhone: string;
  readonly requestIp: string;
}

@Injectable()
export class RequestPhoneChangeUseCase {
  constructor(
    private readonly repository: IdentityRepository,
    private readonly requestOtp: RequestPhoneOtpUseCase,
    @Inject(IDENTITY_CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(input: RequestPhoneChangeInput): Promise<OtpChallengeResponse> {
    const user = await this.repository.findUserById(input.userId);
    if (!user) {
      throw new IdentityApplicationError("USER_NOT_FOUND", "User not found", 404);
    }

    const recentWindowMs = 10 * 60 * 1_000;
    const recentAuthAt = user.recentAuthAt?.getTime() ?? 0;
    if (this.clock.now().getTime() - recentAuthAt > recentWindowMs) {
      throw new IdentityApplicationError(
        "PHONE_CHANGE_REQUIRES_RECENT_AUTH",
        "Recent authentication is required",
        403,
      );
    }

    return this.requestOtp.execute({
      phone: input.newPhone,
      purpose: "phone_change",
      requestIp: input.requestIp,
      userId: input.userId,
    });
  }
}
