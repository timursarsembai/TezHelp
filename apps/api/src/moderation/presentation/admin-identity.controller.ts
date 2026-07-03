import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { presentIdentityUser } from "../../identity/application/identity-presenter.js";
import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import {
  type AdminRequest,
  StaffAuthGuard,
} from "../../foundation/authorization/staff-auth.guard.js";

@ApiTags("admin-identity")
@UseGuards(StaffAuthGuard)
@Controller("admin")
export class AdminIdentityController {
  @Get("me")
  @ApiOkResponse({ description: "Current staff identity." })
  me(@Req() request: AdminRequest) {
    if (!request.currentUser) {
      throw new IdentityApplicationError(
        "UNAUTHORIZED_IDENTITY_USER",
        "Staff session did not resolve to a user",
        401,
      );
    }

    return { ...presentIdentityUser(request.currentUser), staffRole: request.staffRole };
  }
}
