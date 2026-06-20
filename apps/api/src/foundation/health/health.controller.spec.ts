import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { HealthController } from "./health.controller.js";
import { HealthReadinessService } from "./health-readiness.service.js";

describe("HealthController", () => {
  it("returns liveness status", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthReadinessService,
          useValue: {
            check: () => ({
              status: "ok",
              service: "tezhelp-api",
              checkedAt: new Date().toISOString(),
              dependencies: {},
            }),
          },
        },
      ],
    }).compile();

    const controller = moduleRef.get(HealthController);

    expect(controller.live().status).toBe("ok");
  });
});
