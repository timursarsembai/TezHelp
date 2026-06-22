import { Inject, Injectable } from "@nestjs/common";

import type { FrontendErrorReport, MonitoringReportResponse } from "@tezhelp/types";

import { scrubMonitoringContext, scrubMonitoringText } from "./monitoring-event-scrubber.js";
import { MONITORING_SINK, type MonitoringSink } from "./monitoring.port.js";

@Injectable()
export class ReportFrontendErrorUseCase {
  constructor(@Inject(MONITORING_SINK) private readonly sink: MonitoringSink) {}

  async execute(
    report: FrontendErrorReport,
    correlationId: string,
  ): Promise<MonitoringReportResponse> {
    await this.sink.report({
      source: report.source,
      severity: "error",
      name: scrubMonitoringText(report.errorName, 120),
      message: scrubMonitoringText(report.message, 500),
      route: scrubMonitoringText(report.route, 200),
      correlationId,
      occurredAt: report.occurredAt,
      context: scrubMonitoringContext({
        componentStack: report.componentStack,
        digest: report.digest,
        userAgent: report.userAgent,
      }),
    });

    return { accepted: true };
  }
}
