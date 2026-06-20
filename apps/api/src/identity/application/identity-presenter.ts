import type { IdentityUserSummary, UserRole } from "@tezhelp/types";

import type { UserRecord } from "../infrastructure/identity.repository.js";

export function presentIdentityUser(user: UserRecord): IdentityUserSummary {
  const roles: ReadonlyArray<UserRole> = ["customer", "provider"];
  const summary: IdentityUserSummary = {
    id: user.id,
    status: user.status,
    preferredLocale: user.preferredLocale,
    selectedRole: user.selectedRole,
    roles,
  };

  if (user.verifiedPhone) {
    return { ...summary, verifiedPhone: user.verifiedPhone };
  }

  return summary;
}
