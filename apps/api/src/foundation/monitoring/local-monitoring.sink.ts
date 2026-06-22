import pino from "pino";

import type { MonitoringEvent, MonitoringSink } from "./monitoring.port.js";

const logger = pino({ name: "tezhelp-monitoring" });

export class LocalMonitoringSink implements MonitoringSink {
  report(event: MonitoringEvent): Promise<void> {
    const payload = {
      correlationId: event.correlationId,
      context: event.context,
      message: event.message,
      name: event.name,
      occurredAt: event.occurredAt,
      route: event.route,
      severity: event.severity,
      source: event.source,
    };

    if (event.severity === "error") {
      logger.error(payload);
      return Promise.resolve();
    }

    logger.warn(payload);
    return Promise.resolve();
  }
}

export class DisabledMonitoringSink implements MonitoringSink {
  report(): Promise<void> {
    return Promise.resolve();
  }
}
