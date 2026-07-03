import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../configuration/configuration.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { IdentityHashingService } from "../../identity/infrastructure/identity-hashing.service.js";
import { IdentityRepository } from "../../identity/infrastructure/identity.repository.js";
import { SystemClock } from "../../identity/application/ports/clock.port.js";
import { IDENTITY_CLOCK } from "../../identity/identity.tokens.js";
import { SessionResolverService } from "./session-resolver.service.js";
import { SessionAuthGuard } from "./session-auth.guard.js";
import { StaffAuthGuard } from "./staff-auth.guard.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule],
  providers: [
    IdentityRepository,
    IdentityHashingService,
    SessionResolverService,
    SessionAuthGuard,
    StaffAuthGuard,
    { provide: IDENTITY_CLOCK, useClass: SystemClock },
  ],
  exports: [SessionResolverService, SessionAuthGuard, StaffAuthGuard],
})
export class AuthorizationModule {}
