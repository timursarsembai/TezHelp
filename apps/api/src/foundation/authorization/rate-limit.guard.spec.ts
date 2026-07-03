import { ExecutionContext, HttpException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";

import type { RateLimitPort } from "../rate-limit/rate-limit.port.js";
import { RATE_LIMIT_METADATA } from "./rate-limit.decorator.js";
import { RateLimitGuard } from "./rate-limit.guard.js";

function makeContext(opts: {
  handlerMeta?: { limit: number; windowSeconds: number };
  identityUserId?: string;
  adminUserId?: string;
  ip?: string;
  handlerName?: string;
  className?: string;
}): ExecutionContext {
  const req = {
    identityUserId: opts.identityUserId,
    adminUserId: opts.adminUserId,
    ip: opts.ip ?? "127.0.0.1",
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({ name: opts.handlerName ?? "testHandler" }),
    getClass: () => ({ name: opts.className ?? "TestController" }),
  } as unknown as ExecutionContext;
}

function makeReflector(meta: { limit: number; windowSeconds: number } | undefined): Reflector {
  return { get: vi.fn().mockReturnValue(meta) } as unknown as Reflector;
}

describe("RateLimitGuard", () => {
  it("passes through when no @RateLimit metadata is present", async () => {
    const port: RateLimitPort = { hit: vi.fn() };
    const guard = new RateLimitGuard(port, makeReflector(undefined));

    const result = await guard.canActivate(makeContext({}));

    expect(result).toBe(true);
    expect(port.hit).not.toHaveBeenCalled();
  });

  it("allows the request when hit returns true", async () => {
    const port: RateLimitPort = { hit: vi.fn().mockResolvedValue(true) };
    const guard = new RateLimitGuard(port, makeReflector({ limit: 10, windowSeconds: 3600 }));

    const result = await guard.canActivate(makeContext({ identityUserId: "user-1" }));

    expect(result).toBe(true);
    expect(port.hit).toHaveBeenCalledOnce();
  });

  it("throws 429 when hit returns false", async () => {
    const port: RateLimitPort = { hit: vi.fn().mockResolvedValue(false) };
    const guard = new RateLimitGuard(port, makeReflector({ limit: 5, windowSeconds: 900 }));

    await expect(guard.canActivate(makeContext({ ip: "1.2.3.4" }))).rejects.toThrow(HttpException);
    await expect(guard.canActivate(makeContext({ ip: "1.2.3.4" }))).rejects.toMatchObject({
      status: 429,
    });
  });

  it("keys by identityUserId when present", async () => {
    const port: RateLimitPort = { hit: vi.fn().mockResolvedValue(true) };
    const guard = new RateLimitGuard(port, makeReflector({ limit: 20, windowSeconds: 3600 }));

    await guard.canActivate(makeContext({ identityUserId: "user-abc", ip: "9.9.9.9" }));

    const [key] = (port.hit as ReturnType<typeof vi.fn>).mock.calls[0] as [string, number, number];
    expect(key).toContain("user-abc");
    expect(key).not.toContain("9.9.9.9");
  });

  it("keys by adminUserId when identityUserId is absent", async () => {
    const port: RateLimitPort = { hit: vi.fn().mockResolvedValue(true) };
    const guard = new RateLimitGuard(port, makeReflector({ limit: 30, windowSeconds: 3600 }));

    await guard.canActivate(makeContext({ adminUserId: "admin-xyz", ip: "9.9.9.9" }));

    const [key] = (port.hit as ReturnType<typeof vi.fn>).mock.calls[0] as [string, number, number];
    expect(key).toContain("admin-xyz");
  });

  it("keys by IP when no user IDs are present", async () => {
    const port: RateLimitPort = { hit: vi.fn().mockResolvedValue(true) };
    const guard = new RateLimitGuard(port, makeReflector({ limit: 5, windowSeconds: 900 }));

    await guard.canActivate(makeContext({ ip: "203.0.113.1" }));

    const [key] = (port.hit as ReturnType<typeof vi.fn>).mock.calls[0] as [string, number, number];
    expect(key).toContain("203.0.113.1");
  });

  it("passes limit and windowSeconds from metadata to port.hit", async () => {
    const port: RateLimitPort = { hit: vi.fn().mockResolvedValue(true) };
    const guard = new RateLimitGuard(port, makeReflector({ limit: 42, windowSeconds: 7200 }));

    await guard.canActivate(makeContext({ identityUserId: "u1" }));

    expect(port.hit).toHaveBeenCalledWith(expect.any(String), 42, 7200);
  });

  it("uses separate Redis keys for different users", async () => {
    const port: RateLimitPort = { hit: vi.fn().mockResolvedValue(true) };
    const reflector = makeReflector({ limit: 10, windowSeconds: 3600 });
    const guard = new RateLimitGuard(port, reflector);

    await guard.canActivate(makeContext({ identityUserId: "user-A" }));
    await guard.canActivate(makeContext({ identityUserId: "user-B" }));

    const calls = (port.hit as ReturnType<typeof vi.fn>).mock.calls as [string, number, number][];
    const key0 = calls[0]?.[0];
    const key1 = calls[1]?.[0];
    expect(key0).toBeDefined();
    expect(key1).toBeDefined();
    expect(key0).not.toBe(key1);
  });

  it("exposes the RATE_LIMIT_METADATA symbol used by the decorator", () => {
    expect(typeof RATE_LIMIT_METADATA).toBe("symbol");
  });
});
