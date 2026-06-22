import type { ProviderSanctionType } from "@tezhelp/types";

export type ProviderCancellationStage = "before_departure" | "after_departure";

export interface ProviderActivitySnapshot {
  readonly activityScore: number;
  readonly consecutiveProviderCancellations: number;
  readonly cancellationBlockEpisodeCount: number;
}

export interface AutomaticProviderSanctionDecision {
  readonly sanctionType: ProviderSanctionType;
  readonly startsAt: Date;
  readonly endsAt: Date | null;
  readonly episodeNumber: number;
  readonly reason: string;
}

export interface ProviderCancellationImpact {
  readonly nextActivityScore: number;
  readonly nextConsecutiveProviderCancellations: number;
  readonly nextCancellationBlockEpisodeCount: number;
  readonly automaticSanction?: AutomaticProviderSanctionDecision;
}

export class ProviderActivityPolicy {
  static readonly maximumActivityScore = 100;
  static readonly consecutiveCancellationThreshold = 7;
  static readonly cancellationBeforeDeparturePenalty = 5;
  static readonly cancellationAfterDeparturePenalty = 12;

  static resolveProviderCancellationImpact(
    snapshot: ProviderActivitySnapshot,
    stage: ProviderCancellationStage,
    now: Date,
  ): ProviderCancellationImpact {
    const penalty =
      stage === "after_departure"
        ? ProviderActivityPolicy.cancellationAfterDeparturePenalty
        : ProviderActivityPolicy.cancellationBeforeDeparturePenalty;
    const nextActivityScore = Math.max(0, snapshot.activityScore - penalty);
    const consecutiveCancellations = snapshot.consecutiveProviderCancellations + 1;

    if (consecutiveCancellations < ProviderActivityPolicy.consecutiveCancellationThreshold) {
      return {
        nextActivityScore,
        nextConsecutiveProviderCancellations: consecutiveCancellations,
        nextCancellationBlockEpisodeCount: snapshot.cancellationBlockEpisodeCount,
      };
    }

    const episodeNumber = snapshot.cancellationBlockEpisodeCount + 1;
    return {
      nextActivityScore,
      nextConsecutiveProviderCancellations: 0,
      nextCancellationBlockEpisodeCount: episodeNumber,
      automaticSanction: {
        sanctionType: episodeNumber >= 3 ? "indefinite_block" : "temporary_block",
        startsAt: now,
        endsAt: ProviderActivityPolicy.resolveBlockEndsAt(episodeNumber, now),
        episodeNumber,
        reason: "automatic_consecutive_provider_cancellations",
      },
    };
  }

  static resolveCompletionImpact(): Pick<
    ProviderCancellationImpact,
    "nextConsecutiveProviderCancellations"
  > {
    return {
      nextConsecutiveProviderCancellations: 0,
    };
  }

  private static resolveBlockEndsAt(episodeNumber: number, startsAt: Date): Date | null {
    if (episodeNumber === 1) {
      return addHours(startsAt, 24);
    }
    if (episodeNumber === 2) {
      return addDays(startsAt, 7);
    }

    return null;
  }
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return addHours(date, days * 24);
}
