import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database/database.module.js";
import { AuditEventRepository } from "./audit-event.repository.js";

@Module({
  imports: [DatabaseModule],
  providers: [AuditEventRepository],
  exports: [AuditEventRepository],
})
export class AuditModule {}
