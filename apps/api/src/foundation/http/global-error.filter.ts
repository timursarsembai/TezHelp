import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Response } from "express";

import type { ApiErrorEnvelope } from "@tezhelp/types";

import type { CorrelatedRequest } from "./correlation-id.js";

interface ApplicationErrorLike {
  readonly code: string;
  readonly httpStatus: number;
}

function isApplicationErrorLike(exception: unknown): exception is ApplicationErrorLike {
  return (
    typeof exception === "object" &&
    exception !== null &&
    "code" in exception &&
    "httpStatus" in exception &&
    typeof exception.code === "string" &&
    typeof exception.httpStatus === "number"
  );
}

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<CorrelatedRequest>();
    const response = http.getResponse<Response>();
    const status = isApplicationErrorLike(exception)
      ? exception.httpStatus
      : exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const code = isApplicationErrorLike(exception)
      ? exception.code
      : exception instanceof HttpException
        ? exception.name
        : "INTERNAL_SERVER_ERROR";

    const envelope: ApiErrorEnvelope = {
      error: {
        code,
        messageKey: `errors.${code}`,
        correlationId: request.correlationId ?? crypto.randomUUID(),
      },
    };

    response.status(status).json(envelope);
  }
}
