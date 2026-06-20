import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { GetCurrentUserUseCase } from "./application/get-current-user.use-case.js";
import { SystemClock } from "./application/ports/clock.port.js";
import { DevelopmentGoogleSignInUseCase } from "./application/development-google-sign-in.use-case.js";
import { RequestPhoneChangeUseCase } from "./application/request-phone-change.use-case.js";
import { RequestPhoneOtpUseCase } from "./application/request-phone-otp.use-case.js";
import { SwitchRoleUseCase } from "./application/switch-role.use-case.js";
import { UpdateLocaleUseCase } from "./application/update-locale.use-case.js";
import { VerifyPhoneOtpUseCase } from "./application/verify-phone-otp.use-case.js";
import { DevelopmentOtpAdapter } from "./infrastructure/development-otp.adapter.js";
import { IdentityHashingService } from "./infrastructure/identity-hashing.service.js";
import { IdentityRepository } from "./infrastructure/identity.repository.js";
import { RedisRateLimitRepository } from "./infrastructure/redis-rate-limit.repository.js";
import { IDENTITY_CLOCK, IDENTITY_RATE_LIMIT, OTP_DELIVERY } from "./identity.tokens.js";
import { AuthController } from "./presentation/auth.controller.js";
import { DevelopmentIdentityGuard } from "./presentation/development-identity.guard.js";
import { MeController } from "./presentation/me.controller.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule],
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
    DevelopmentIdentityGuard,
    { provide: IDENTITY_CLOCK, useClass: SystemClock },
    { provide: OTP_DELIVERY, useClass: DevelopmentOtpAdapter },
    { provide: IDENTITY_RATE_LIMIT, useClass: RedisRateLimitRepository },
  ],
})
export class IdentityModule {}
