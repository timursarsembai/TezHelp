import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

import { AppConfigService } from "../../foundation/configuration/app-config.service.js";
import { IdentityApplicationError } from "../domain/identity-errors.js";
import type { IdentityRequest } from "./identity-request.js";

@Injectable()
export class DevelopmentIdentityGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (
      !this.config.identity.devAuthHeaderEnabled ||
      this.config.identity.nodeEnv === "production"
    ) {
      throw new IdentityApplicationError(
        "DEVELOPMENT_AUTH_DISABLED",
        "Development auth header is disabled",
        401,
      );
    }

    const request = context.switchToHttp().getRequest<IdentityRequest>();
    const userId = request.header("x-tezhelp-user-id");
    if (!userId) {
      throw new IdentityApplicationError(
        "UNAUTHORIZED_IDENTITY_USER",
        "User header is required",
        401,
      );
    }

    request.identityUserId = userId;
    return true;
  }
}
