import { Global, Module } from "@nestjs/common";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import { AppConfigService } from "../configuration/app-config.service.js";
import { ConfigurationModule } from "../configuration/configuration.module.js";
import { DATABASE } from "./database.tokens.js";
import type { DatabaseSchema } from "./database.types.js";
import { DatabaseService } from "./database.service.js";

@Global()
@Module({
  imports: [ConfigurationModule],
  providers: [
    {
      provide: DATABASE,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        new Kysely<DatabaseSchema>({
          dialect: new PostgresDialect({
            pool: new Pool({
              connectionString: config.databaseUrl,
              max: 10,
            }),
          }),
        }),
    },
    DatabaseService,
  ],
  exports: [DATABASE, DatabaseService],
})
export class DatabaseModule {}
