import { describe, expect, it } from "vitest";

import { apiEnvSchema, localeSchema } from "./index";

describe("validation schemas", () => {
  it("accepts the three supported locales", () => {
    expect(localeSchema.parse("ru")).toBe("ru");
    expect(localeSchema.parse("kk")).toBe("kk");
    expect(localeSchema.parse("en")).toBe("en");
  });

  it("rejects unsupported locales", () => {
    expect(() => localeSchema.parse("de")).toThrow();
  });

  it("parses the API environment without secrets in source code", () => {
    const env = apiEnvSchema.parse({
      DATABASE_URL: "postgres://tezhelp:tezhelp_dev_password@localhost:5432/tezhelp",
      REDIS_URL: "redis://localhost:6379",
      S3_ENDPOINT: "http://localhost:9000",
      S3_REGION: "local",
      S3_ACCESS_KEY_ID: "tezhelp_dev_access_key",
      S3_SECRET_ACCESS_KEY: "tezhelp_dev_secret_key",
      S3_BUCKET_PRIVATE: "tezhelp-private-dev",
    });

    expect(env.PORT).toBe(4000);
  });
});
