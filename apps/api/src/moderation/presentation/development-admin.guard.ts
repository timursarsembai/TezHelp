import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { AppConfigService } from "../../foundation/configuration/app-config.service.js";
import { ModerationApplicationError } from "../domain/moderation-errors.js";

export interface AdminRequest extends Request {
  adminUserId?: string;
}

@Injectable()
export class DevelopmentAdminGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (
      !this.config.identity.devAuthHeaderEnabled ||
      this.config.identity.nodeEnv === "production"
    ) {
      throw new ModerationApplicationError(
        "DEVELOPMENT_ADMIN_AUTH_DISABLED",
        "Development admin header is disabled",
        401,
      );
    }

    const request = context.switchToHttp().getRequest<AdminRequest>();
    const adminUserId = request.header("x-tezhelp-admin-user-id");
    if (!adminUserId) {
      throw new ModerationApplicationError(
        "UNAUTHORIZED_ADMIN_USER",
        "Admin user header is required",
        401,
      );
    }

    request.adminUserId = adminUserId;
    return true;
  }
}
