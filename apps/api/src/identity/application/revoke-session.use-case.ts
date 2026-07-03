import { Inject, Injectable } from "@nestjs/common";

import { IdentityHashingService } from "../infrastructure/identity-hashing.service.js";
import { IdentityRepository } from "../infrastructure/identity.repository.js";
import type { Clock } from "./ports/clock.port.js";
import { IDENTITY_CLOCK } from "../identity.tokens.js";

@Injectable()
export class RevokeSessionUseCase {
  constructor(
    private readonly repository: IdentityRepository,
    private readonly hashing: IdentityHashingService,
    @Inject(IDENTITY_CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(sessionToken: string): Promise<void> {
    const tokenHash = this.hashing.hashSessionToken(sessionToken);
    await this.repository.revokeSessionByTokenHash(tokenHash, this.clock.now());
  }
}
