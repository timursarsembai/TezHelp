import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppConfigService } from "./app-config.service.js";
import { loadApiEnvironment } from "./load-api-environment.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [loadApiEnvironment],
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigurationModule {}
