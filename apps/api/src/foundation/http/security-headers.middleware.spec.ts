import { describe, expect, it, vi } from "vitest";

import { SecurityHeadersMiddleware } from "./security-headers.middleware.js";

describe("SecurityHeadersMiddleware", () => {
  it("sets API security headers and an enforcing CSP outside Swagger UI", () => {
    const setHeader = vi.fn();
    const next = vi.fn();
    const middleware = new SecurityHeadersMiddleware();

    middleware.use({ path: "/v1/health" } as never, { setHeader } as never, next);

    expect(setHeader).toHaveBeenCalledWith("Referrer-Policy", "strict-origin-when-cross-origin");
    expect(setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
    expect(setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
    expect(setHeader).toHaveBeenCalledWith(
      "Permissions-Policy",
      "camera=(), microphone=(), payment=(), geolocation=()",
    );
    expect(setHeader).toHaveBeenCalledWith(
      "Content-Security-Policy",
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("does not apply the API-only CSP to Swagger UI", () => {
    const setHeader = vi.fn();
    const middleware = new SecurityHeadersMiddleware();

    middleware.use({ path: "/docs" } as never, { setHeader } as never, vi.fn());

    expect(setHeader).not.toHaveBeenCalledWith("Content-Security-Policy", expect.any(String));
  });
});
