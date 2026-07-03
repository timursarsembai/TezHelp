import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";

import {
  developmentGoogleSignInSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from "@tezhelp/validation";

import { AppConfigService } from "../../foundation/configuration/app-config.service.js";
import { sessionCookieOptions } from "../../foundation/authorization/cookie-options.js";
import { DevelopmentGoogleSignInUseCase } from "../application/development-google-sign-in.use-case.js";
import { RequestPhoneOtpUseCase } from "../application/request-phone-otp.use-case.js";
import { RevokeSessionUseCase } from "../application/revoke-session.use-case.js";
import { VerifyPhoneOtpUseCase } from "../application/verify-phone-otp.use-case.js";
import { requestIp } from "./identity-request.js";
import { parseBody } from "./zod-body.js";

@ApiTags("identity")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly config: AppConfigService,
    private readonly requestPhoneOtp: RequestPhoneOtpUseCase,
    private readonly verifyPhoneOtp: VerifyPhoneOtpUseCase,
    private readonly developmentGoogleSignIn: DevelopmentGoogleSignInUseCase,
    private readonly revokeSession: RevokeSessionUseCase,
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
  @ApiOkResponse({ description: "Verify a phone OTP challenge and start a session." })
  async verifyOtp(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const input = parseBody(verifyOtpSchema, body);
    const result = await this.verifyPhoneOtp.execute(input);
    if (result.sessionToken) {
      response.cookie(
        this.config.identity.sessionCookieName,
        result.sessionToken,
        sessionCookieOptions(this.config),
      );
    }

    return result.user;
  }

  @Post("google/development")
  @ApiOkResponse({ description: "Development-only Google identity boundary." })
  async developmentGoogle(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const input = parseBody(developmentGoogleSignInSchema, body);
    const result = await this.developmentGoogleSignIn.execute(input);
    response.cookie(
      this.config.identity.sessionCookieName,
      result.sessionToken,
      sessionCookieOptions(this.config),
    );

    return result.user;
  }

  @Post("logout")
  @ApiOkResponse({ description: "Revoke the current session." })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const token = request.cookies?.[this.config.identity.sessionCookieName] as string | undefined;
    if (token) {
      await this.revokeSession.execute(token);
    }
    response.clearCookie(this.config.identity.sessionCookieName, sessionCookieOptions(this.config));

    return { success: true };
  }
}
