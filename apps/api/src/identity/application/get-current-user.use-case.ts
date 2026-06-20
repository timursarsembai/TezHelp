import { Injectable } from "@nestjs/common";

import type { IdentityUserSummary } from "@tezhelp/types";

import { IdentityApplicationError } from "../domain/identity-errors.js";
import { IdentityRepository } from "../infrastructure/identity.repository.js";
import { presentIdentityUser } from "./identity-presenter.js";

@Injectable()
export class GetCurrentUserUseCase {
  constructor(private readonly repository: IdentityRepository) {}

  async execute(userId: string): Promise<IdentityUserSummary> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new IdentityApplicationError("USER_NOT_FOUND", "User not found", 404);
    }

    return presentIdentityUser(user);
  }
}
