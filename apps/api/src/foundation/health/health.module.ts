import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../configuration/configuration.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { HealthController } from "./health.controller.js";
import { HealthReadinessService } from "./health-readiness.service.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule],
  controllers: [HealthController],
  providers: [HealthReadinessService],
})
export class HealthModule {}
