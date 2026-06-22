import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import type { FrontendErrorReport } from "@tezhelp/types";
import { frontendErrorReportSchema } from "@tezhelp/validation";

import type { CorrelatedRequest } from "../http/correlation-id.js";
import { parseBody } from "../../identity/presentation/zod-body.js";
import { ReportFrontendErrorUseCase } from "./monitoring.use-cases.js";

@ApiTags("monitoring")
@Controller("monitoring")
export class MonitoringController {
  constructor(private readonly reportFrontendError: ReportFrontendErrorUseCase) {}

  @Post("frontend-errors")
  @ApiOkResponse({ description: "Accept a sanitized frontend error report." })
  async frontendError(@Body() body: unknown, @Req() request: CorrelatedRequest) {
    const report = parseBody(frontendErrorReportSchema, body);
    const frontendReport: FrontendErrorReport = {
      source: report.source,
      severity: report.severity,
      route: report.route,
      errorName: report.errorName,
      message: report.message,
      occurredAt: report.occurredAt,
      ...(report.digest ? { digest: report.digest } : {}),
      ...(report.componentStack ? { componentStack: report.componentStack } : {}),
      ...(report.userAgent ? { userAgent: report.userAgent } : {}),
    };

    return this.reportFrontendError.execute(
      frontendReport,
      request.correlationId ?? crypto.randomUUID(),
    );
  }
}
