import { Module } from "@nestjs/common";

import { AuditEventRepository } from "./audit-event.repository.js";

@Module({
  providers: [AuditEventRepository],
  exports: [AuditEventRepository],
})
export class AuditModule {}
