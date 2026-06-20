import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../database/database.service.js";
import type { NewAuditEvent } from "../database/database.types.js";

@Injectable()
export class AuditEventRepository {
  constructor(private readonly database: DatabaseService) {}

  async append(event: NewAuditEvent): Promise<void> {
    await this.database.db.insertInto("audit_events").values(event).execute();
  }
}
