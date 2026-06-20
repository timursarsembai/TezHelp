import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Response } from "express";
import pino from "pino";

import type { CorrelatedRequest } from "./correlation-id.js";
import { correlationHeader, readCorrelationId } from "./correlation-id.js";

const logger = pino({
  name: "tezhelp-api",
});

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(request: CorrelatedRequest, response: Response, next: NextFunction): void {
    request.correlationId = readCorrelationId(request);
    response.setHeader(correlationHeader, request.correlationId);
    response.on("finish", () => {
      logger.info({
        correlationId: request.correlationId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
      });
    });
    next();
  }
}
