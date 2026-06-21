import { describe, expect, it } from "vitest";

import { CommissionCalculator } from "./commission-calculator.js";

describe("CommissionCalculator", () => {
  const calculator = new CommissionCalculator();

  it("calculates percentage commission with integer floor rounding", () => {
    expect(
      calculator.calculate(10_005, {
        strategy: "percentage",
        percentageBps: 1000,
        fixedKzt: 0,
      }),
    ).toBe(1000);
  });

  it("supports fixed, combined, and zero strategies", () => {
    expect(
      calculator.calculate(10_000, {
        strategy: "fixed",
        percentageBps: 1000,
        fixedKzt: 500,
      }),
    ).toBe(500);
    expect(
      calculator.calculate(10_000, {
        strategy: "combined",
        percentageBps: 1000,
        fixedKzt: 300,
      }),
    ).toBe(1300);
    expect(
      calculator.calculate(10_000, {
        strategy: "zero",
        percentageBps: 1000,
        fixedKzt: 300,
      }),
    ).toBe(0);
  });
});
