import { SetMetadata } from "@nestjs/common";

export const RATE_LIMIT_METADATA = Symbol("RATE_LIMIT_METADATA");

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
}

export const RateLimit = (opts: RateLimitOptions) => SetMetadata(RATE_LIMIT_METADATA, opts);
