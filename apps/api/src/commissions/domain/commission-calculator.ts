import type { CommissionStrategy } from "@tezhelp/types";

export interface CommissionConfig {
  readonly strategy: CommissionStrategy;
  readonly percentageBps: number;
  readonly fixedKzt: number;
}

export class CommissionCalculator {
  calculate(acceptedPriceKzt: number, config: CommissionConfig): number {
    if (!Number.isInteger(acceptedPriceKzt) || acceptedPriceKzt <= 0) {
      throw new Error("Accepted price must be a positive integer KZT amount");
    }

    if (config.strategy === "zero") {
      return 0;
    }

    const percentageAmount = Math.floor((acceptedPriceKzt * config.percentageBps) / 10_000);

    if (config.strategy === "percentage") {
      return percentageAmount;
    }
    if (config.strategy === "fixed") {
      return config.fixedKzt;
    }

    return percentageAmount + config.fixedKzt;
  }
}
