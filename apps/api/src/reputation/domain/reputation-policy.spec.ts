import { describe, expect, it } from "vitest";

import { ReputationPolicy } from "./reputation-policy.js";

describe("ReputationPolicy", () => {
  const completedContext = {
    orderId: "order-1",
    status: "completed" as const,
    customerUserId: "customer-1",
    assignedProviderUserId: "provider-1",
    assignedProviderServiceProfileId: "service-profile-1",
  };

  it("allows completed order participants to review their counterparty", () => {
    expect(ReputationPolicy.resolveReviewCounterparty(completedContext, "customer-1")).toEqual({
      direction: "customer_to_provider",
      revieweeUserId: "provider-1",
      providerServiceProfileId: "service-profile-1",
    });
    expect(ReputationPolicy.resolveReviewCounterparty(completedContext, "provider-1")).toEqual({
      direction: "provider_to_customer",
      revieweeUserId: "customer-1",
    });
  });

  it("rejects reviews before completion and from unrelated users", () => {
    expect(() =>
      ReputationPolicy.resolveReviewCounterparty(
        { ...completedContext, status: "in_progress" },
        "customer-1",
      ),
    ).toThrow("Reviews are allowed only after order completion");
    expect(() =>
      ReputationPolicy.resolveReviewCounterparty(completedContext, "other-user"),
    ).toThrow("Only assigned order participants can review each other");
  });

  it("detects active sanctions by time window and lift state", () => {
    const now = new Date("2026-06-22T10:00:00.000Z");
    expect(
      ReputationPolicy.isSanctionActive(
        {
          startsAt: new Date("2026-06-22T09:00:00.000Z"),
          endsAt: new Date("2026-06-22T11:00:00.000Z"),
          liftedAt: null,
        },
        now,
      ),
    ).toBe(true);
    expect(
      ReputationPolicy.isSanctionActive(
        {
          startsAt: new Date("2026-06-22T09:00:00.000Z"),
          endsAt: null,
          liftedAt: new Date("2026-06-22T09:30:00.000Z"),
        },
        now,
      ),
    ).toBe(false);
  });
});
