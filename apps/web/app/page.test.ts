import { describe, expect, it } from "vitest";

import { resolveLocale, translate } from "@tezhelp/i18n";

describe("web shell localization", () => {
  it("has Russian, Kazakh, and English customer shell text", () => {
    expect(translate("ru", "web.customer.title")).toContain("дороге");
    expect(translate("kk", "web.customer.title")).toContain("Жолдағы");
    expect(translate("en", "web.customer.title")).toContain("Roadside");
  });

  it("has localized identity shell text", () => {
    expect(translate("ru", "identity.phone")).toBe("Телефон");
    expect(translate("kk", "identity.roleProvider")).toContain("Орындаушы");
    expect(translate("en", "identity.completePhone")).toContain("Google");
  });

  it("uses Russian as fallback locale", () => {
    expect(resolveLocale(undefined)).toBe("ru");
  });
});
