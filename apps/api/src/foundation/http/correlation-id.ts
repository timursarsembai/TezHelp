import type { Request } from "express";

export const correlationHeader = "x-correlation-id";

export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

export function readCorrelationId(request: Request): string {
  const header = request.header(correlationHeader);
  return header && header.length <= 128 ? header : crypto.randomUUID();
}
