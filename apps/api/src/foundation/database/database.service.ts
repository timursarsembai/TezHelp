import { Inject, Injectable, OnApplicationShutdown } from "@nestjs/common";
import { sql } from "kysely";
import type { Transaction } from "kysely";

import { DATABASE } from "./database.tokens.js";
import type { DatabaseSchema, TezHelpDatabase } from "./database.types.js";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  constructor(@Inject(DATABASE) readonly db: TezHelpDatabase) {}

  async transaction<T>(callback: (trx: Transaction<DatabaseSchema>) => Promise<T>): Promise<T> {
    return this.db.transaction().execute(callback);
  }

  async checkPostgis(): Promise<void> {
    await sql`select postgis_version()`.execute(this.db);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.db.destroy();
  }
}
