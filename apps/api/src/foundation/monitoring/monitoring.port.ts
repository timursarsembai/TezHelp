import type { MonitoringEventSeverity } from "@tezhelp/types";

import type { MonitoringContext } from "./monitoring-event-scrubber.js";

export interface MonitoringEvent {
  readonly source: "api" | "web" | "admin";
  readonly severity: MonitoringEventSeverity;
  readonly name: string;
  readonly message: string;
  readonly route?: string;
  readonly correlationId: string;
  readonly occurredAt: string;
  readonly context?: MonitoringContext;
}

export interface MonitoringSink {
  report(event: MonitoringEvent): Promise<void>;
}

export const MONITORING_SINK = Symbol("MONITORING_SINK");
