import type { Request } from "express";

import type { UserRecord } from "../infrastructure/identity.repository.js";

export interface IdentityRequest extends Request {
  identityUserId?: string;
  currentUser?: UserRecord;
}

export function requestIp(request: Request): string {
  return request.ip ?? request.socket.remoteAddress ?? "unknown";
}
