import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Response } from "express";

import type { CorrelatedRequest } from "./correlation-id.js";

const apiSecurityHeaders = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), payment=(), geolocation=()",
} as const;

const apiContentSecurityPolicy = [
  "default-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(request: CorrelatedRequest, response: Response, next: NextFunction): void {
    for (const [header, value] of Object.entries(apiSecurityHeaders)) {
      response.setHeader(header, value);
    }

    if (!request.path.startsWith("/docs")) {
      response.setHeader("Content-Security-Policy", apiContentSecurityPolicy);
    }

    next();
  }
}
