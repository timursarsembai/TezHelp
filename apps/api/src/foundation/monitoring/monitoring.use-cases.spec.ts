import { describe, expect, it } from "vitest";

import type { FrontendErrorReport } from "@tezhelp/types";

import type { MonitoringEvent, MonitoringSink } from "./monitoring.port.js";
import { ReportFrontendErrorUseCase } from "./monitoring.use-cases.js";

describe("ReportFrontendErrorUseCase", () => {
  it("reports sanitized frontend errors with correlation IDs", async () => {
    const events: MonitoringEvent[] = [];
    const sink: MonitoringSink = {
      report: (event) => {
        events.push(event);
        return Promise.resolve();
      },
    };
    const useCase = new ReportFrontendErrorUseCase(sink);
    const report: FrontendErrorReport = {
      source: "web",
      severity: "error",
      route: "/orders",
      errorName: "TypeError",
      message: "failed for phone +77001234567",
      componentStack: "at OrderPage privateObjectKey=orders/private.png",
      occurredAt: "2026-06-22T10:00:00.000Z",
    };

    await expect(useCase.execute(report, "corr-monitoring")).resolves.toEqual({
      accepted: true,
    });

    expect(events).toHaveLength(1);
    expect(events[0]!.correlationId).toBe("corr-monitoring");
    expect(events[0]!.message).not.toContain("+77001234567");
    expect(events[0]!.context?.componentStack).not.toContain("orders/private.png");
  });
});
