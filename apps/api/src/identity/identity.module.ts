import { Module } from "@nestjs/common";

import { AuditModule } from "../foundation/audit/audit.module.js";
import { AuthorizationModule } from "../foundation/authorization/authorization.module.js";
import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { RateLimitModule } from "../foundation/rate-limit/rate-limit.module.js";
import { RATE_LIMIT_PORT } from "../foundation/rate-limit/rate-limit.token.js";
import { GetCurrentUserUseCase } from "./application/get-current-user.use-case.js";
import { SystemClock } from "./application/ports/clock.port.js";
import { DevelopmentGoogleSignInUseCase } from "./application/development-google-sign-in.use-case.js";
import { RequestPhoneChangeUseCase } from "./application/request-phone-change.use-case.js";
import { RequestPhoneOtpUseCase } from "./application/request-phone-otp.use-case.js";
import { RevokeSessionUseCase } from "./application/revoke-session.use-case.js";
import { SwitchRoleUseCase } from "./application/switch-role.use-case.js";
import { UpdateLocaleUseCase } from "./application/update-locale.use-case.js";
import { VerifyPhoneOtpUseCase } from "./application/verify-phone-otp.use-case.js";
import { DevelopmentOtpAdapter } from "./infrastructure/development-otp.adapter.js";
import { IdentityHashingService } from "./infrastructure/identity-hashing.service.js";
import { IdentityRepository } from "./infrastructure/identity.repository.js";
import { IDENTITY_CLOCK, IDENTITY_RATE_LIMIT, OTP_DELIVERY } from "./identity.tokens.js";
import { AuthController } from "./presentation/auth.controller.js";
import { MeController } from "./presentation/me.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule, AuthorizationModule, RateLimitModule, AuditModule],
  controllers: [AuthController, MeController],
  providers: [
    IdentityRepository,
    IdentityHashingService,
    RequestPhoneOtpUseCase,
    VerifyPhoneOtpUseCase,
    DevelopmentGoogleSignInUseCase,
    RequestPhoneChangeUseCase,
    GetCurrentUserUseCase,
    UpdateLocaleUseCase,
    SwitchRoleUseCase,
    RevokeSessionUseCase,
    { provide: IDENTITY_CLOCK, useClass: SystemClock },
    { provide: OTP_DELIVERY, useClass: DevelopmentOtpAdapter },
    { provide: IDENTITY_RATE_LIMIT, useExisting: RATE_LIMIT_PORT },
  ],
})
export class IdentityModule {}
