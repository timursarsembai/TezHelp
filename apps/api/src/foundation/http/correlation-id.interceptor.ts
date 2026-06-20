import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs";

import type { ApiSuccessEnvelope } from "@tezhelp/types";

import type { CorrelatedRequest } from "./correlation-id.js";

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessEnvelope<unknown>> {
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();
    const correlationId = request.correlationId ?? crypto.randomUUID();

    return next.handle().pipe(map((data: unknown) => ({ data, correlationId })));
  }
}
