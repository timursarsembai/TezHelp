import { Inject, Injectable } from "@nestjs/common";

import type { IdentityUserSummary, Locale } from "@tezhelp/types";

import { AppConfigService } from "../../foundation/configuration/app-config.service.js";
import { IdentityApplicationError } from "../domain/identity-errors.js";
import { IdentityRepository } from "../infrastructure/identity.repository.js";
import { presentIdentityUser } from "./identity-presenter.js";
import type { Clock } from "./ports/clock.port.js";
import { IDENTITY_CLOCK } from "../identity.tokens.js";

export interface DevelopmentGoogleSignInInput {
  readonly providerSubject: string;
  readonly preferredLocale: Locale;
}

@Injectable()
export class DevelopmentGoogleSignInUseCase {
  constructor(
    private readonly config: AppConfigService,
    private readonly repository: IdentityRepository,
    @Inject(IDENTITY_CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(input: DevelopmentGoogleSignInInput): Promise<IdentityUserSummary> {
    if (this.config.identity.nodeEnv === "production") {
      throw new IdentityApplicationError(
        "DEVELOPMENT_AUTH_DISABLED",
        "Development Google sign-in is disabled",
        503,
      );
    }

    const user = await this.repository.signInWithDevelopmentGoogle(
      input.providerSubject,
      input.preferredLocale,
      this.clock.now(),
    );
    return presentIdentityUser(user);
  }
}
