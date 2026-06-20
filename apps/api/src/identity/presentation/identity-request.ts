import type { Request } from "express";

export interface IdentityRequest extends Request {
  identityUserId?: string;
}

export function requestIp(request: Request): string {
  return request.ip ?? request.socket.remoteAddress ?? "unknown";
}
