import { describe, expect, it } from "vitest";

import { resolveLocale, translate } from "./index";

describe("i18n", () => {
  it("falls back to Russian for unsupported locale input", () => {
    expect(resolveLocale("fr")).toBe("ru");
  });

  it("renders the localized brand example in all supported languages", () => {
    expect(translate("ru", "common.status.foundation")).toBe("Foundation готов");
    expect(translate("kk", "common.status.foundation")).toBe("Foundation дайын");
    expect(translate("en", "common.status.foundation")).toBe("Foundation ready");
  });
});
