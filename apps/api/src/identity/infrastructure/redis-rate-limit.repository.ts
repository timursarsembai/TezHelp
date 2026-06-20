import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { Redis } from "ioredis";

import { AppConfigService } from "../../foundation/configuration/app-config.service.js";
import type { RateLimitPort } from "../application/ports/rate-limit.port.js";

@Injectable()
export class RedisRateLimitRepository implements RateLimitPort, OnApplicationShutdown {
  private readonly redis: Redis;

  constructor(config: AppConfigService) {
    this.redis = new Redis(config.redisUrl, {
      commandTimeout: 2_000,
      connectTimeout: 2_000,
      maxRetriesPerRequest: 1,
    });
  }

  async hit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }

    return count <= limit;
  }

  onApplicationShutdown(): void {
    this.redis.disconnect();
  }
}
