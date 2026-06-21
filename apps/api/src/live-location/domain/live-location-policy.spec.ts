import { describe, expect, it } from "vitest";

import { LiveLocationPolicy, type LiveLocationOrderContext } from "./live-location-policy.js";

const baseContext: LiveLocationOrderContext = {
  orderId: "order-1",
  status: "provider_en_route",
  customerUserId: "customer-1",
  assignedProviderUserId: "provider-1",
};

describe("LiveLocationPolicy", () => {
  it("allows tracking only after provider departure and before terminal states", () => {
    expect(LiveLocationPolicy.canTrack("provider_selected")).toBe(false);
    expect(LiveLocationPolicy.canTrack("provider_en_route")).toBe(true);
    expect(LiveLocationPolicy.canTrack("provider_arrived")).toBe(true);
    expect(LiveLocationPolicy.canTrack("in_progress")).toBe(true);
    expect(LiveLocationPolicy.canTrack("completed")).toBe(false);
  });

  it("allows only the assigned provider to publish location", () => {
    expect(() =>
      LiveLocationPolicy.assertProviderCanPublish(baseContext, "provider-1"),
    ).not.toThrow();
    expect(() => LiveLocationPolicy.assertProviderCanPublish(baseContext, "other")).toThrow();
    expect(() =>
      LiveLocationPolicy.assertProviderCanPublish(
        { ...baseContext, status: "provider_selected" },
        "provider-1",
      ),
    ).toThrow();
  });

  it("marks old points as stale", () => {
    const now = new Date("2026-06-22T10:00:00.000Z");
    expect(LiveLocationPolicy.isStale(new Date("2026-06-22T09:59:00.000Z"), now)).toBe(false);
    expect(LiveLocationPolicy.isStale(new Date("2026-06-22T09:58:00.000Z"), now)).toBe(true);
  });
});
