import { describe, expect, it } from "vitest";

import { ApiClient, ApiClientError, FrontendErrorReporter, sanitizeRoute } from "./index";

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

  it("posts frontend error reports with sanitized routes", async () => {
    const bodies: string[] = [];
    const client = new ApiClient({
      baseUrl: "http://localhost:4000",
      fetchImpl: (_input, init) => {
        bodies.push(typeof init?.body === "string" ? init.body : "");
        return Promise.resolve(
          new Response(JSON.stringify({ data: { accepted: true }, correlationId: "corr-test" }), {
            status: 201,
          }),
        );
      },
    });
    const reporter = new FrontendErrorReporter({ apiClient: client, source: "web" });

    const response = await reporter.report({
      route: "/orders?phone=%2B77001234567#secret",
      error: new Error("render failed"),
      occurredAt: new Date("2026-06-22T10:00:00.000Z"),
    });

    expect(response).toEqual({ accepted: true });
    expect(bodies).toHaveLength(1);
    const payload = JSON.parse(bodies[0]!) as { route: string };
    expect(payload.route).toBe("/orders");
    expect(sanitizeRoute("https://example.test/orders")).toBe("/");
  });
});
