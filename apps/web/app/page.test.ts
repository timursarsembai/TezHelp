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

  it("has localized provider moderation shell text", () => {
    expect(translate("ru", "providerModeration.perCategoryStatus")).toContain("категории");
    expect(translate("kk", "providerModeration.resubmit")).toContain("Қайта");
    expect(translate("en", "providerModeration.title")).toContain("moderation");
  });

  it("has localized marketplace shell text", () => {
    expect(translate("ru", "marketplace.order.publish")).toContain("Опубликовать");
    expect(translate("kk", "marketplace.provider.offer")).toContain("жіберу");
    expect(translate("en", "marketplace.provider.discovery")).toContain("feed");
    expect(translate("ru", "marketplace.lifecycle.departed")).toContain("выехал");
  });

  it("has localized chat and dispute evidence shell text", () => {
    expect(translate("ru", "chat.title")).toContain("Чат");
    expect(translate("kk", "chat.disputeEvidence")).toContain("дауды");
    expect(translate("en", "chat.attachmentAccess")).toContain("audited");
  });

  it("has localized live tracking shell text", () => {
    expect(translate("ru", "maps.customerMarker")).toContain("клиента");
    expect(translate("kk", "maps.staleState")).toContain("нүкте");
    expect(translate("en", "maps.providerMarker")).toContain("Provider");
  });

  it("uses Russian as fallback locale", () => {
    expect(resolveLocale(undefined)).toBe("ru");
  });
});
