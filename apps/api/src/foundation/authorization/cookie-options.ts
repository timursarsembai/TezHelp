import type { CookieOptions } from "express";

import type { AppConfigService } from "../configuration/app-config.service.js";

export function sessionCookieOptions(config: AppConfigService): CookieOptions {
  const identity = config.identity;

  return {
    httpOnly: true,
    secure: identity.sessionCookieSecure,
    sameSite: identity.sessionCookieSameSite,
    maxAge: identity.sessionTtlSeconds * 1000,
    path: "/",
    ...(identity.sessionCookieDomain ? { domain: identity.sessionCookieDomain } : {}),
  };
}
