import { Injectable } from "@nestjs/common";

import type { IdentityUserSummary, UserRole } from "@tezhelp/types";

import { IdentityApplicationError } from "../domain/identity-errors.js";
import { IdentityRepository } from "../infrastructure/identity.repository.js";
import { presentIdentityUser } from "./identity-presenter.js";

@Injectable()
export class SwitchRoleUseCase {
  constructor(private readonly repository: IdentityRepository) {}

  async execute(userId: string, role: UserRole): Promise<IdentityUserSummary> {
    const user = await this.repository.switchRole(userId, role);
    if (!user) {
      throw new IdentityApplicationError("USER_NOT_FOUND", "User not found", 404);
    }

    return presentIdentityUser(user);
  }
}
