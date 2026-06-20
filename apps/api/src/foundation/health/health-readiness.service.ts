import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";

import type { DependencyHealth, HealthResponse, HealthStatus } from "@tezhelp/types";

import { AppConfigService } from "../configuration/app-config.service.js";
import { DatabaseService } from "../database/database.service.js";

@Injectable()
export class HealthReadinessService {
  constructor(
    private readonly config: AppConfigService,
    private readonly database: DatabaseService,
  ) {}

  async check(): Promise<HealthResponse> {
    const dependencies = {
      postgis: await this.measure(() => this.database.checkPostgis()),
      redis: await this.measure(() => this.checkRedis()),
      objectStorage: await this.measure(() => this.checkObjectStorage()),
    } satisfies Record<string, DependencyHealth>;

    const status: HealthStatus = Object.values(dependencies).every((item) => item.status === "ok")
      ? "ok"
      : "degraded";

    return {
      status,
      service: "tezhelp-api",
      checkedAt: new Date().toISOString(),
      dependencies,
    };
  }

  private async measure(callback: () => Promise<void>): Promise<DependencyHealth> {
    const startedAt = performance.now();
    try {
      await callback();
      return { status: "ok", latencyMs: Math.round(performance.now() - startedAt) };
    } catch {
      return {
        status: "error",
        latencyMs: Math.round(performance.now() - startedAt),
        message: "Dependency health check failed",
      };
    }
  }

  private async checkRedis(): Promise<void> {
    const redis = new Redis(this.config.redisUrl, {
      commandTimeout: 2_000,
      connectTimeout: 2_000,
      lazyConnect: true,
      maxRetriesPerRequest: 0,
    });

    try {
      await redis.connect();
      const pong = await redis.ping();
      if (pong !== "PONG") {
        throw new Error("Redis PING failed");
      }
    } finally {
      redis.disconnect();
    }
  }

  private async checkObjectStorage(): Promise<void> {
    const s3Config = this.config.s3;
    const client = new S3Client({
      endpoint: s3Config.endpoint,
      forcePathStyle: true,
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });

    try {
      await client.send(new HeadBucketCommand({ Bucket: s3Config.bucketPrivate }));
    } finally {
      client.destroy();
    }
  }
}
