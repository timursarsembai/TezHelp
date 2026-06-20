import { Module } from "@nestjs/common";

import { AuditModule } from "../foundation/audit/audit.module.js";
import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { HealthModule } from "../foundation/health/health.module.js";
import { HttpFoundationModule } from "../foundation/http/http-foundation.module.js";

@Module({
  imports: [ConfigurationModule, DatabaseModule, AuditModule, HttpFoundationModule, HealthModule],
})
export class ApiRootModule {}
