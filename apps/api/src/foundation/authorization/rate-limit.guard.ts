import { CanActivate, ExecutionContext, HttpException, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import type { RateLimitPort } from "../rate-limit/rate-limit.port.js";
import { RATE_LIMIT_PORT } from "../rate-limit/rate-limit.token.js";
import { RATE_LIMIT_METADATA, type RateLimitOptions } from "./rate-limit.decorator.js";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(RATE_LIMIT_PORT) private readonly rateLimitPort: RateLimitPort,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const opts = this.reflector.get<RateLimitOptions>(RATE_LIMIT_METADATA, context.getHandler());
    if (!opts) return true;

    const req = context.switchToHttp().getRequest<Request & { identityUserId?: string; adminUserId?: string }>();
    const subject = req.identityUserId ?? req.adminUserId ?? req.ip ?? "anonymous";
    const key = `rl:${context.getClass().name}:${context.getHandler().name}:${subject}`;

    const allowed = await this.rateLimitPort.hit(key, opts.limit, opts.windowSeconds);
    if (!allowed) {
      throw new HttpException("Too Many Requests", 429);
    }
    return true;
  }
}
