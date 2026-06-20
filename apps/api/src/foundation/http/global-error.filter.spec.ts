import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { GlobalErrorFilter } from "./global-error.filter.js";

describe("GlobalErrorFilter", () => {
  it("uses a stable error envelope", () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const filter = new GlobalErrorFilter();

    filter.catch(new BadRequestException(), {
      switchToHttp: () => ({
        getRequest: () => ({ correlationId: "corr-test" }),
        getResponse: () => ({ status }),
      }),
    } as never);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: "BadRequestException",
        messageKey: "errors.BadRequestException",
        correlationId: "corr-test",
      },
    });
  });
});
