import { describe, expect, it } from "vitest";

import { translate } from "@tezhelp/i18n";

describe("admin shell", () => {
  it("renders a protected-shell message without fake authentication", () => {
    expect(translate("ru", "admin.authRequiredBody")).toContain("fake auth");
  });

  it("has localized moderation queue labels", () => {
    expect(translate("ru", "admin.moderation.queue")).toContain("Очередь");
    expect(translate("en", "admin.moderation.suspend")).toContain("Suspend");
  });

  it("has localized commercial and ledger labels", () => {
    expect(translate("ru", "marketplace.admin.ledger")).toContain("кошелька");
    expect(translate("en", "marketplace.admin.commercialConfig")).toContain("tariffs");
    expect(translate("ru", "marketplace.admin.activeOrderCancellation")).toContain("Отмена");
  });
});
