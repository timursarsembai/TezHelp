import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import type { HealthResponse } from "@tezhelp/types";

import { HealthReadinessService } from "./health-readiness.service.js";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly readiness: HealthReadinessService) {}

  @Get("live")
  @ApiOkResponse({ description: "API process is running." })
  live(): HealthResponse {
    return {
      status: "ok",
      service: "tezhelp-api",
      checkedAt: new Date().toISOString(),
    };
  }

  @Get("ready")
  @ApiOkResponse({ description: "API dependencies are reachable." })
  async ready(): Promise<HealthResponse> {
    return this.readiness.check();
  }

  @Get()
  @ApiOkResponse({ description: "Combined API health status." })
  async combined(): Promise<HealthResponse> {
    return this.readiness.check();
  }
}
