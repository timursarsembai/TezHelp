import { Inject, Injectable } from "@nestjs/common";

import type { IdentityUserSummary, Locale } from "@tezhelp/types";

import { AppConfigService } from "../../foundation/configuration/app-config.service.js";
import { IdentityApplicationError } from "../domain/identity-errors.js";
import { IdentityHashingService } from "../infrastructure/identity-hashing.service.js";
import { IdentityRepository } from "../infrastructure/identity.repository.js";
import { presentIdentityUser } from "./identity-presenter.js";
import type { Clock } from "./ports/clock.port.js";
import { IDENTITY_CLOCK } from "../identity.tokens.js";

export interface DevelopmentGoogleSignInInput {
  readonly providerSubject: string;
  readonly preferredLocale: Locale;
}

export interface DevelopmentGoogleSignInResult {
  readonly user: IdentityUserSummary;
  readonly sessionToken: string;
}

@Injectable()
export class DevelopmentGoogleSignInUseCase {
  constructor(
    private readonly config: AppConfigService,
    private readonly repository: IdentityRepository,
    private readonly hashing: IdentityHashingService,
    @Inject(IDENTITY_CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(input: DevelopmentGoogleSignInInput): Promise<DevelopmentGoogleSignInResult> {
    if (this.config.identity.nodeEnv === "production") {
      throw new IdentityApplicationError(
        "DEVELOPMENT_AUTH_DISABLED",
        "Development Google sign-in is disabled",
        503,
      );
    }

    const now = this.clock.now();
    const sessionToken = this.hashing.createSessionToken();
    const user = await this.repository.transaction(async (trx) => {
      const signedIn = await this.repository.signInWithDevelopmentGoogle(
        trx,
        input.providerSubject,
        input.preferredLocale,
        now,
      );
      await this.repository.createSession(
        trx,
        signedIn.id,
        this.hashing.hashSessionToken(sessionToken),
        now,
      );
      return signedIn;
    });

    return { user: presentIdentityUser(user), sessionToken };
  }
}
