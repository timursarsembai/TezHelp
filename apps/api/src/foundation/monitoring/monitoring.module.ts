import { Module } from "@nestjs/common";

import { AppConfigService } from "../configuration/app-config.service.js";
import { ConfigurationModule } from "../configuration/configuration.module.js";
import { DisabledMonitoringSink, LocalMonitoringSink } from "./local-monitoring.sink.js";
import { MonitoringController } from "./monitoring.controller.js";
import { MONITORING_SINK, type MonitoringSink } from "./monitoring.port.js";
import { ReportFrontendErrorUseCase } from "./monitoring.use-cases.js";

@Module({
  imports: [ConfigurationModule],
  controllers: [MonitoringController],
  providers: [
    {
      inject: [AppConfigService],
      provide: MONITORING_SINK,
      useFactory: (config: AppConfigService): MonitoringSink =>
        config.monitoring.sink === "disabled"
          ? new DisabledMonitoringSink()
          : new LocalMonitoringSink(),
    },
    ReportFrontendErrorUseCase,
  ],
})
export class MonitoringModule {}
