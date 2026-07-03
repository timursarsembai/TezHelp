import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { ModerationApplicationError } from "../../moderation/domain/moderation-errors.js";
import type { UserRecord } from "../../identity/infrastructure/identity.repository.js";
import type { StaffRole } from "../database/database.types.js";
import { SessionResolverService } from "./session-resolver.service.js";

export interface AdminRequest extends Request {
  adminUserId?: string;
  currentUser?: UserRecord;
  staffRole?: StaffRole;
}

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly resolver: SessionResolverService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const user = await this.resolver.resolve(request);
    if (!user.isStaff) {
      throw new ModerationApplicationError(
        "STAFF_ACCESS_REQUIRED",
        "Staff access is required",
        403,
      );
    }

    request.adminUserId = user.id;
    request.currentUser = user;
    if (user.staffRole) {
      request.staffRole = user.staffRole;
    }
    return true;
  }
}
