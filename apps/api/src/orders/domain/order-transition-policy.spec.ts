import { describe, expect, it } from "vitest";

import { OrderTransitionPolicy } from "./order-transition-policy.js";

describe("OrderTransitionPolicy", () => {
  it("allows only sequential provider lifecycle transitions", () => {
    expect(() =>
      OrderTransitionPolicy.assertProviderTransition("provider_selected", "provider_en_route"),
    ).not.toThrow();
    expect(() =>
      OrderTransitionPolicy.assertProviderTransition("provider_en_route", "provider_arrived"),
    ).not.toThrow();
    expect(() =>
      OrderTransitionPolicy.assertProviderTransition("provider_arrived", "in_progress"),
    ).not.toThrow();

    expect(() =>
      OrderTransitionPolicy.assertProviderTransition("provider_selected", "provider_arrived"),
    ).toThrow();
  });

  it("captures customer cancellation after arrival as held for review", () => {
    expect(OrderTransitionPolicy.cancellationOutcome("customer", "provider_selected")).toEqual({
      status: "cancelled_by_customer",
      commissionAction: "release",
    });
    expect(OrderTransitionPolicy.cancellationOutcome("customer", "provider_arrived")).toEqual({
      status: "cancelled_by_customer",
      commissionAction: "hold",
    });
  });

  it("lets admin choose release or hold while provider cancellation releases", () => {
    expect(OrderTransitionPolicy.cancellationOutcome("provider", "in_progress")).toEqual({
      status: "cancelled_by_provider",
      commissionAction: "release",
    });
    expect(OrderTransitionPolicy.cancellationOutcome("admin", "provider_arrived", true)).toEqual({
      status: "cancelled_by_admin",
      commissionAction: "hold",
    });
  });
});
