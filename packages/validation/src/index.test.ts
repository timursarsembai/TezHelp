import { describe, expect, it } from "vitest";

import {
  apiEnvSchema,
  cancelOrderSchema,
  chatAttachmentMetadataSchema,
  localeSchema,
  orderLifecycleCommandSchema,
  providerDiscoveryPreferenceSchema,
  reportChatMessageSchema,
  requestOtpSchema,
  serviceCategoryCommercialConfigSchema,
  sendChatMessageSchema,
  switchRoleSchema,
} from "./index";

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

  it("rejects production startup with development identity adapters", () => {
    expect(() =>
      apiEnvSchema.parse({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://tezhelp:tezhelp_dev_password@localhost:5432/tezhelp",
        REDIS_URL: "redis://localhost:6379",
        S3_ENDPOINT: "http://localhost:9000",
        S3_REGION: "local",
        S3_ACCESS_KEY_ID: "tezhelp_dev_access_key",
        S3_SECRET_ACCESS_KEY: "tezhelp_dev_secret_key",
        S3_BUCKET_PRIVATE: "tezhelp-private-dev",
        IDENTITY_OTP_ADAPTER: "development",
        IDENTITY_DEV_AUTH_HEADER_ENABLED: "true",
        SESSION_COOKIE_SECURE: "false",
      }),
    ).toThrow();
  });

  it("validates identity public contracts", () => {
    expect(requestOtpSchema.parse({ phone: "+77001234567" }).purpose).toBe("sign_in");
    expect(switchRoleSchema.parse({ role: "provider" }).role).toBe("provider");
    expect(() => requestOtpSchema.parse({ phone: "87001234567" })).toThrow();
  });

  it("validates active order lifecycle public contracts", () => {
    expect(
      orderLifecycleCommandSchema.parse({ idempotencyKey: "complete-123" }).idempotencyKey,
    ).toBe("complete-123");
    expect(
      cancelOrderSchema.parse({ reason: "Customer request", idempotencyKey: "cancel-123" }).reason,
    ).toBe("Customer request");
    expect(() => cancelOrderSchema.parse({ reason: "no", idempotencyKey: "cancel-123" })).toThrow();
  });

  it("validates marketplace public contracts", () => {
    const preference = providerDiscoveryPreferenceSchema.parse({
      nearbyEnabled: true,
      radiusMeters: 10_000,
    });
    expect(preference.referenceLatitude).toBe(43.2389);
    expect(preference.referenceLongitude).toBe(76.8897);
    expect(() =>
      serviceCategoryCommercialConfigSchema.parse({
        responseFeeKzt: 100,
        commissionStrategy: "percentage",
        commissionPercentageBps: 20_000,
        commissionFixedKzt: 0,
        operationalMinimumKzt: 3000,
      }),
    ).toThrow();
  });

  it("validates chat message and attachment public contracts", () => {
    const parsedTextMessage = sendChatMessageSchema.parse({
      messageType: "text",
      text: "  hello  ",
    });
    expect(parsedTextMessage.messageType).toBe("text");
    if (parsedTextMessage.messageType === "text") {
      expect(parsedTextMessage.text).toBe("hello");
    }
    expect(
      chatAttachmentMetadataSchema.parse({
        kind: "photo",
        privateObjectKey: "orders/chat/photo.webp",
        originalFilename: "photo.webp",
        contentType: "image/webp",
        sizeBytes: 1024,
      }).kind,
    ).toBe("photo");
    expect(
      chatAttachmentMetadataSchema.parse({
        kind: "voice",
        privateObjectKey: "orders/chat/voice.ogg",
        originalFilename: "voice.ogg",
        contentType: "audio/ogg",
        sizeBytes: 1024,
        durationSeconds: 120,
      }).kind,
    ).toBe("voice");
    expect(() => sendChatMessageSchema.parse({ messageType: "text", text: "" })).toThrow();
    expect(() =>
      chatAttachmentMetadataSchema.parse({
        kind: "voice",
        privateObjectKey: "orders/chat/voice.ogg",
        originalFilename: "voice.ogg",
        contentType: "audio/ogg",
        sizeBytes: 1024,
        durationSeconds: 181,
      }),
    ).toThrow();
    expect(reportChatMessageSchema.parse({ reason: "dispute evidence" }).reason).toBe(
      "dispute evidence",
    );
  });
});
