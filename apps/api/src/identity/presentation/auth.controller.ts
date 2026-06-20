import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";

import {
  developmentGoogleSignInSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from "@tezhelp/validation";

import { DevelopmentGoogleSignInUseCase } from "../application/development-google-sign-in.use-case.js";
import { RequestPhoneOtpUseCase } from "../application/request-phone-otp.use-case.js";
import { VerifyPhoneOtpUseCase } from "../application/verify-phone-otp.use-case.js";
import { requestIp } from "./identity-request.js";
import { parseBody } from "./zod-body.js";

@ApiTags("identity")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly requestPhoneOtp: RequestPhoneOtpUseCase,
    private readonly verifyPhoneOtp: VerifyPhoneOtpUseCase,
    private readonly developmentGoogleSignIn: DevelopmentGoogleSignInUseCase,
  ) {}

  @Post("otp/request")
  @ApiOkResponse({ description: "Create a phone OTP challenge." })
  async requestOtp(@Body() body: unknown, @Req() request: Request) {
    const input = parseBody(requestOtpSchema, body);
    return this.requestPhoneOtp.execute({
      phone: input.phone,
      purpose: input.purpose,
      requestIp: requestIp(request),
    });
  }

  @Post("otp/verify")
  @ApiOkResponse({ description: "Verify a phone OTP challenge." })
  async verifyOtp(@Body() body: unknown) {
    const input = parseBody(verifyOtpSchema, body);
    return this.verifyPhoneOtp.execute(input);
  }

  @Post("google/development")
  @ApiOkResponse({ description: "Development-only Google identity boundary." })
  async developmentGoogle(@Body() body: unknown) {
    const input = parseBody(developmentGoogleSignInSchema, body);
    return this.developmentGoogleSignIn.execute(input);
  }
}
