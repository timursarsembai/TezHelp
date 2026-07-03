import { Inject, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { AppConfigService } from "../configuration/app-config.service.js";
import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import { IdentityHashingService } from "../../identity/infrastructure/identity-hashing.service.js";
import type { UserRecord } from "../../identity/infrastructure/identity.repository.js";
import { IdentityRepository } from "../../identity/infrastructure/identity.repository.js";
import type { Clock } from "../../identity/application/ports/clock.port.js";
import { IDENTITY_CLOCK } from "../../identity/identity.tokens.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

@Injectable()
export class SessionResolverService {
  constructor(
    private readonly config: AppConfigService,
    private readonly repository: IdentityRepository,
    private readonly hashing: IdentityHashingService,
    @Inject(IDENTITY_CLOCK)
    private readonly clock: Clock,
  ) {}

  async resolve(request: Request): Promise<UserRecord> {
    this.assertTrustedOrigin(request);

    const token = request.cookies?.[this.config.identity.sessionCookieName] as string | undefined;
    if (!token) {
      throw new IdentityApplicationError("UNAUTHORIZED_IDENTITY_USER", "Session required", 401);
    }

    const tokenHash = this.hashing.hashSessionToken(token);
    const session = await this.repository.findActiveSessionByTokenHash(tokenHash);
    const now = this.clock.now();
    if (!session || this.isExpired(session.createdAt, now)) {
      throw new IdentityApplicationError("UNAUTHORIZED_IDENTITY_USER", "Session invalid", 401);
    }

    const user = await this.repository.findUserById(session.userId);
    if (!user || user.status === "blocked") {
      throw new IdentityApplicationError("UNAUTHORIZED_IDENTITY_USER", "Session invalid", 401);
    }

    const staleAfterMs = this.config.identity.sessionSlidingRefreshSeconds * 1000;
    await this.repository.touchSessionAuthIfStale(session.id, now, staleAfterMs);

    return user;
  }

  private isExpired(createdAt: Date, now: Date): boolean {
    const ttlMs = this.config.identity.sessionTtlSeconds * 1000;
    return now.getTime() - createdAt.getTime() > ttlMs;
  }

  private assertTrustedOrigin(request: Request): void {
    if (SAFE_METHODS.has(request.method)) {
      return;
    }

    const origin = request.header("origin") ?? request.header("referer");
    if (!origin) {
      return;
    }

    const isTrusted = this.config.corsOrigins.some((allowed) => origin.startsWith(allowed));
    if (!isTrusted) {
      throw new IdentityApplicationError(
        "CSRF_ORIGIN_REJECTED",
        "Request origin is not trusted",
        403,
      );
    }
  }
}
