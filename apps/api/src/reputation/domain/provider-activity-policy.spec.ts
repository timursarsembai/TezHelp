import { describe, expect, it } from "vitest";

import { ProviderActivityPolicy } from "./provider-activity-policy.js";

describe("ProviderActivityPolicy", () => {
  const now = new Date("2026-06-23T08:00:00.000Z");

  it("decreases activity and increments consecutive cancellations below threshold", () => {
    const impact = ProviderActivityPolicy.resolveProviderCancellationImpact(
      {
        activityScore: 100,
        consecutiveProviderCancellations: 3,
        cancellationBlockEpisodeCount: 0,
      },
      "before_departure",
      now,
    );

    expect(impact.nextActivityScore).toBe(95);
    expect(impact.nextConsecutiveProviderCancellations).toBe(4);
    expect(impact.nextCancellationBlockEpisodeCount).toBe(0);
    expect(impact.automaticSanction).toBeUndefined();
  });

  it("uses stronger penalty after departure and floors activity score", () => {
    const impact = ProviderActivityPolicy.resolveProviderCancellationImpact(
      {
        activityScore: 6,
        consecutiveProviderCancellations: 0,
        cancellationBlockEpisodeCount: 0,
      },
      "after_departure",
      now,
    );

    expect(impact.nextActivityScore).toBe(0);
  });

  it("creates first and second temporary blocks at the threshold", () => {
    const first = ProviderActivityPolicy.resolveProviderCancellationImpact(
      {
        activityScore: 80,
        consecutiveProviderCancellations: 6,
        cancellationBlockEpisodeCount: 0,
      },
      "before_departure",
      now,
    );
    const second = ProviderActivityPolicy.resolveProviderCancellationImpact(
      {
        activityScore: 60,
        consecutiveProviderCancellations: 6,
        cancellationBlockEpisodeCount: 1,
      },
      "before_departure",
      now,
    );

    expect(first.nextConsecutiveProviderCancellations).toBe(0);
    expect(first.nextCancellationBlockEpisodeCount).toBe(1);
    expect(first.automaticSanction).toMatchObject({
      sanctionType: "temporary_block",
      episodeNumber: 1,
      reason: "automatic_consecutive_provider_cancellations",
    });
    expect(first.automaticSanction?.endsAt?.toISOString()).toBe("2026-06-24T08:00:00.000Z");
    expect(second.automaticSanction).toMatchObject({
      sanctionType: "temporary_block",
      episodeNumber: 2,
    });
    expect(second.automaticSanction?.endsAt?.toISOString()).toBe("2026-06-30T08:00:00.000Z");
  });

  it("creates indefinite block from the third episode", () => {
    const impact = ProviderActivityPolicy.resolveProviderCancellationImpact(
      {
        activityScore: 40,
        consecutiveProviderCancellations: 6,
        cancellationBlockEpisodeCount: 2,
      },
      "after_departure",
      now,
    );

    expect(impact.automaticSanction).toMatchObject({
      sanctionType: "indefinite_block",
      episodeNumber: 3,
      endsAt: null,
    });
  });

  it("resets consecutive cancellations after completion", () => {
    expect(ProviderActivityPolicy.resolveCompletionImpact()).toEqual({
      nextConsecutiveProviderCancellations: 0,
    });
  });
});
