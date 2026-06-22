import { describe, expect, it } from "vitest";

import {
  apiEnvSchema,
  appealProviderSanctionSchema,
  cancelOrderSchema,
  chatAttachmentMetadataSchema,
  createProviderSanctionSchema,
  frontendErrorReportSchema,
  liftProviderSanctionSchema,
  localeSchema,
  liveLocationUpdateSchema,
  orderLifecycleCommandSchema,
  providerDiscoveryPreferenceSchema,
  reportChatMessageSchema,
  requestOtpSchema,
  serviceCategoryCommercialConfigSchema,
  sendChatMessageSchema,
  submitOrderReviewSchema,
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
    expect(env.ERROR_MONITORING_SINK).toBe("local");
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

  it("validates live location update public contracts", () => {
    const update = liveLocationUpdateSchema.parse({
      latitude: 43.2389,
      longitude: 76.8897,
      accuracyMeters: 12,
      recordedAt: "2026-06-22T10:00:00.000Z",
      sequence: 7,
      resumed: true,
    });

    expect(update.sequence).toBe(7);
    expect(update.resumed).toBe(true);
    expect(
      liveLocationUpdateSchema.parse({ latitude: 43, longitude: 76, accuracyMeters: 0 }).resumed,
    ).toBe(false);
    expect(() =>
      liveLocationUpdateSchema.parse({ latitude: 91, longitude: 76, accuracyMeters: 12 }),
    ).toThrow();
    expect(() =>
      liveLocationUpdateSchema.parse({ latitude: 43, longitude: 76, accuracyMeters: 5001 }),
    ).toThrow();
  });

  it("validates review and sanction public contracts", () => {
    expect(submitOrderReviewSchema.parse({ rating: 5, comment: "  solid work  " }).comment).toBe(
      "solid work",
    );
    expect(() => submitOrderReviewSchema.parse({ rating: 6 })).toThrow();

    const sanction = createProviderSanctionSchema.parse({
      sanctionType: "temporary_block",
      serviceProfileId: "11111111-1111-4111-8111-111111111111",
      reason: "manual moderation decision",
      startsAt: "2026-06-22T10:00:00.000Z",
      endsAt: "2026-06-23T10:00:00.000Z",
    });
    expect(sanction.sanctionType).toBe("temporary_block");
    expect(() =>
      createProviderSanctionSchema.parse({
        sanctionType: "temporary_block",
        reason: "manual moderation decision",
        startsAt: "2026-06-23T10:00:00.000Z",
        endsAt: "2026-06-22T10:00:00.000Z",
      }),
    ).toThrow();

    expect(appealProviderSanctionSchema.parse({ reason: "documents updated" }).reason).toBe(
      "documents updated",
    );
    expect(liftProviderSanctionSchema.parse({ reason: "appeal accepted" }).reason).toBe(
      "appeal accepted",
    );
  });

  it("validates frontend error monitoring reports without route query data", () => {
    const report = frontendErrorReportSchema.parse({
      source: "web",
      route: "/orders",
      errorName: "TypeError",
      message: "render failed",
      occurredAt: "2026-06-22T10:00:00.000Z",
    });

    expect(report.severity).toBe("error");
    expect(() =>
      frontendErrorReportSchema.parse({
        source: "web",
        route: "/orders?phone=%2B77001234567",
        errorName: "TypeError",
        message: "render failed",
        occurredAt: "2026-06-22T10:00:00.000Z",
      }),
    ).toThrow();
    expect(() =>
      frontendErrorReportSchema.parse({
        source: "admin",
        route: "/moderation",
        errorName: "Error",
        message: "x".repeat(501),
        occurredAt: "2026-06-22T10:00:00.000Z",
      }),
    ).toThrow();
  });
});
