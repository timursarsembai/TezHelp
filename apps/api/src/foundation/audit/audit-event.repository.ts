import { Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";

import { DatabaseService } from "../database/database.service.js";
import type { DatabaseSchema, NewAuditEvent } from "../database/database.types.js";

@Injectable()
export class AuditEventRepository {
  constructor(private readonly database: DatabaseService) {}

  async append(event: NewAuditEvent, trx?: Kysely<DatabaseSchema>): Promise<void> {
    const executor = trx ?? this.database.db;
    await executor.insertInto("audit_events").values(event).execute();
  }
}
