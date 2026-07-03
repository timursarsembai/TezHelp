import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

import type { IdentityRequest } from "../../identity/presentation/identity-request.js";
import { SessionResolverService } from "./session-resolver.service.js";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly resolver: SessionResolverService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IdentityRequest>();
    const user = await this.resolver.resolve(request);

    request.identityUserId = user.id;
    request.currentUser = user;
    return true;
  }
}
