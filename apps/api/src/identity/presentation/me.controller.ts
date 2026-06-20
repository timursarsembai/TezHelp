import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  requestPhoneChangeSchema,
  switchRoleSchema,
  updateLocaleSchema,
  verifyPhoneChangeSchema,
} from "@tezhelp/validation";

import { GetCurrentUserUseCase } from "../application/get-current-user.use-case.js";
import { RequestPhoneChangeUseCase } from "../application/request-phone-change.use-case.js";
import { RequestPhoneOtpUseCase } from "../application/request-phone-otp.use-case.js";
import { SwitchRoleUseCase } from "../application/switch-role.use-case.js";
import { UpdateLocaleUseCase } from "../application/update-locale.use-case.js";
import { VerifyPhoneOtpUseCase } from "../application/verify-phone-otp.use-case.js";
import { IdentityApplicationError } from "../domain/identity-errors.js";
import { DevelopmentIdentityGuard } from "./development-identity.guard.js";
import { type IdentityRequest, requestIp } from "./identity-request.js";
import { parseBody } from "./zod-body.js";

@ApiTags("identity")
@UseGuards(DevelopmentIdentityGuard)
@Controller("me")
export class MeController {
  constructor(
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly requestPhoneOtp: RequestPhoneOtpUseCase,
    private readonly requestPhoneChange: RequestPhoneChangeUseCase,
    private readonly verifyPhoneOtp: VerifyPhoneOtpUseCase,
    private readonly updateLocale: UpdateLocaleUseCase,
    private readonly switchRole: SwitchRoleUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: "Current identity summary." })
  async currentUser(@Req() request: IdentityRequest) {
    return this.getCurrentUser.execute(this.requireUserId(request));
  }

  @Post("phone-change/request")
  @ApiOkResponse({ description: "Request OTP for a new phone." })
  async requestPhoneChangeOtp(@Body() body: unknown, @Req() request: IdentityRequest) {
    const input = parseBody(requestPhoneChangeSchema, body);
    return this.requestPhoneChange.execute({
      userId: this.requireUserId(request),
      newPhone: input.newPhone,
      requestIp: requestIp(request),
    });
  }

  @Post("phone-change/verify")
  @ApiOkResponse({ description: "Verify OTP for a phone change." })
  async verifyPhoneChange(@Body() body: unknown, @Req() request: IdentityRequest) {
    const input = parseBody(verifyPhoneChangeSchema, body);
    return this.verifyPhoneOtp.execute({
      challengeId: input.challengeId,
      code: input.code,
      preferredLocale: "ru",
      userId: this.requireUserId(request),
    });
  }

  @Post("phone-completion/request")
  @ApiOkResponse({
    description: "Request OTP to complete phone verification after Google sign-in.",
  })
  async requestPhoneCompletionOtp(@Body() body: unknown, @Req() request: IdentityRequest) {
    const input = parseBody(requestPhoneChangeSchema, body);
    return this.requestPhoneOtp.execute({
      userId: this.requireUserId(request),
      phone: input.newPhone,
      purpose: "phone_completion",
      requestIp: requestIp(request),
    });
  }

  @Post("phone-completion/verify")
  @ApiOkResponse({ description: "Verify OTP to complete a Google-created account." })
  async verifyPhoneCompletion(@Body() body: unknown, @Req() request: IdentityRequest) {
    const input = parseBody(verifyPhoneChangeSchema, body);
    return this.verifyPhoneOtp.execute({
      challengeId: input.challengeId,
      code: input.code,
      preferredLocale: "ru",
      userId: this.requireUserId(request),
    });
  }

  @Patch("locale")
  @ApiOkResponse({ description: "Update preferred locale." })
  async locale(@Body() body: unknown, @Req() request: IdentityRequest) {
    const input = parseBody(updateLocaleSchema, body);
    return this.updateLocale.execute(this.requireUserId(request), input.locale);
  }

  @Patch("role")
  @ApiOkResponse({ description: "Switch selected user role." })
  async role(@Body() body: unknown, @Req() request: IdentityRequest) {
    const input = parseBody(switchRoleSchema, body);
    return this.switchRole.execute(this.requireUserId(request), input.role);
  }

  private requireUserId(request: IdentityRequest): string {
    if (!request.identityUserId) {
      throw new IdentityApplicationError(
        "UNAUTHORIZED_IDENTITY_USER",
        "User header is required",
        401,
      );
    }

    return request.identityUserId;
  }
}
