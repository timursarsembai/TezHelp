import { describe, expect, it } from "vitest";

import { resolveLocale, translate } from "./index";

describe("i18n", () => {
  it("falls back to Russian for unsupported locale input", () => {
    expect(resolveLocale("fr")).toBe("ru");
  });

  it("renders the localized foundation status in all supported languages", () => {
    expect(translate("ru", "common.status.foundation")).toBe("Foundation готов");
    expect(translate("kk", "common.status.foundation")).toBe("Foundation дайын");
    expect(translate("en", "common.status.foundation")).toBe("Foundation ready");
  });

  it("has localized identity strings", () => {
    expect(translate("ru", "identity.title")).toContain("Вход");
    expect(translate("kk", "identity.title")).toContain("Кіру");
    expect(translate("en", "identity.title")).toContain("Sign in");
  });

  it("has localized provider moderation strings", () => {
    expect(translate("ru", "providerModeration.documents")).toContain("документы");
    expect(translate("kk", "providerModeration.categorySelection")).toContain("санаттары");
    expect(translate("en", "admin.moderation.queue")).toContain("queue");
  });

  it("has localized marketplace shell strings", () => {
    expect(translate("ru", "marketplace.provider.wallet")).toContain("Баланс");
    expect(translate("kk", "marketplace.order.publish")).toContain("жариялау");
    expect(translate("en", "marketplace.admin.commercialConfig")).toContain("commissions");
    expect(translate("ru", "marketplace.lifecycle.completed")).toContain("заверш");
    expect(translate("en", "marketplace.lifecycle.contactVisible")).toContain("Contacts");
  });

  it("has localized chat and dispute evidence strings", () => {
    expect(translate("ru", "chat.disputeEvidence")).toContain("споров");
    expect(translate("kk", "chat.title")).toContain("чаты");
    expect(translate("en", "admin.chat.disputeReview")).toContain("dispute");
  });

  it("has localized maps and live tracking strings", () => {
    expect(translate("ru", "maps.liveTracking")).toContain("отслеживание");
    expect(translate("kk", "maps.providerMarker")).toContain("Орындаушы");
    expect(translate("en", "admin.maps.activeOrderTracking")).toContain("tracking");
  });

  it("has localized reputation and sanction strings", () => {
    expect(translate("ru", "reputation.customerReliability")).toContain("Надежность");
    expect(translate("kk", "reputation.providerRating")).toContain("рейтинг");
    expect(translate("en", "admin.sanctions.appeals")).toContain("appeals");
  });
});
