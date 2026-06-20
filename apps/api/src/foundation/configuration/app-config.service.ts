import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { ApiEnvironment } from "@tezhelp/validation";

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<ApiEnvironment, true>) {}

  get port(): number {
    return this.config.get("PORT", { infer: true });
  }

  get databaseUrl(): string {
    return this.config.get("DATABASE_URL", { infer: true });
  }

  get redisUrl(): string {
    return this.config.get("REDIS_URL", { infer: true });
  }

  get corsOrigins(): string[] {
    return this.config
      .get("CORS_ORIGINS", { infer: true })
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  get s3() {
    return {
      endpoint: this.config.get("S3_ENDPOINT", { infer: true }),
      region: this.config.get("S3_REGION", { infer: true }),
      accessKeyId: this.config.get("S3_ACCESS_KEY_ID", { infer: true }),
      secretAccessKey: this.config.get("S3_SECRET_ACCESS_KEY", { infer: true }),
      bucketPrivate: this.config.get("S3_BUCKET_PRIVATE", { infer: true }),
    };
  }
}
