import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../configuration/configuration.module.js";
import { RedisRateLimitRepository } from "./redis-rate-limit.repository.js";
import { RATE_LIMIT_PORT } from "./rate-limit.token.js";

@Module({
  imports: [ConfigurationModule],
  providers: [{ provide: RATE_LIMIT_PORT, useClass: RedisRateLimitRepository }],
  exports: [RATE_LIMIT_PORT],
})
export class RateLimitModule {}
