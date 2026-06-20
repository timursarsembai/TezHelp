import { describe, expect, it } from "vitest";

import { translate } from "@tezhelp/i18n";

describe("admin shell", () => {
  it("renders a protected-shell message without fake authentication", () => {
    expect(translate("ru", "admin.authRequiredBody")).toContain("fake auth");
  });
});
