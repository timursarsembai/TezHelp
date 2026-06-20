import { describe, expect, it } from "vitest";

import { ApiClient, ApiClientError } from "./index";

describe("ApiClient", () => {
  it("throws a stable error envelope", async () => {
    const client = new ApiClient({
      baseUrl: "http://localhost:4000",
      fetchImpl: () =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error: {
                code: "TEST_ERROR",
                messageKey: "errors.test",
                correlationId: "corr-test",
              },
            }),
            { status: 503 },
          ),
        ),
    });

    await expect(client.get("/v1/health")).rejects.toBeInstanceOf(ApiClientError);
  });
});
