import { z } from "zod";

import { serviceCategorySlugs, supportedLocales } from "@tezhelp/types";

export const localeSchema = z.enum(supportedLocales);
export const userRoleSchema = z.enum(["customer", "provider"]);
export const otpPurposeSchema = z.enum(["sign_in", "phone_completion", "phone_change"]);
export const serviceCategorySlugSchema = z.enum(serviceCategorySlugs);
export const providerTaxStatusSchema = z.enum([
  "individual_entrepreneur",
  "self_employed_special_tax",
]);
export const providerModerationStatusSchema = z.enum([
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "suspended",
]);
export const commissionStrategySchema = z.enum(["percentage", "fixed", "combined", "zero"]);

const idempotencyKeySchema = z.string().trim().min(8).max(120);
const kztAmountSchema = z.number().int().nonnegative().max(100_000_000);
const positiveKztAmountSchema = z.number().int().positive().max(100_000_000);

export const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Phone must be in E.164 format");

export const requestOtpSchema = z.object({
  phone: phoneNumberSchema,
  purpose: otpPurposeSchema.default("sign_in"),
});

export const verifyOtpSchema = z.object({
  challengeId: z.uuid(),
  code: z.string().regex(/^\d{6}$/),
  preferredLocale: localeSchema.default("ru"),
});

export const developmentGoogleSignInSchema = z.object({
  providerSubject: z.string().min(3).max(256),
  email: z.email().optional(),
  preferredLocale: localeSchema.default("ru"),
});

export const requestPhoneChangeSchema = z.object({
  newPhone: phoneNumberSchema,
});

export const verifyPhoneChangeSchema = z.object({
  challengeId: z.uuid(),
  code: z.string().regex(/^\d{6}$/),
});

export const updateLocaleSchema = z.object({
  locale: localeSchema,
});

export const switchRoleSchema = z.object({
  role: userRoleSchema,
});

export const updateProviderProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120).optional(),
  iin: z
    .string()
    .regex(/^\d{12}$/)
    .optional(),
  city: z.string().trim().min(2).max(80).optional(),
  taxStatus: providerTaxStatusSchema.optional(),
});

export const createProviderServiceProfileSchema = z.object({
  categorySlug: serviceCategorySlugSchema,
});

export const registerProviderDocumentSchema = z.object({
  serviceProfileId: z.uuid().optional(),
  documentType: z.string().trim().min(2).max(80),
  privateObjectKey: z.string().trim().min(8).max(512),
  originalFilename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(3).max(120),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(20 * 1024 * 1024),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const moderationDecisionSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export const adminModerationQueueSchema = z.object({
  status: providerModerationStatusSchema.optional(),
  categorySlug: serviceCategorySlugSchema.optional(),
});

export const orderImageMetadataSchema = z.object({
  privateObjectKey: z.string().trim().min(8).max(512),
  originalFilename: z.string().trim().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(20 * 1024 * 1024),
});

export const createOrderSchema = z.object({
  categorySlug: serviceCategorySlugSchema,
  latitude: z.number().min(43.0).max(44.0),
  longitude: z.number().min(76.0).max(77.5),
  addressLandmark: z.string().trim().min(3).max(240),
  vehicleMake: z.string().trim().min(1).max(80).optional(),
  vehicleModel: z.string().trim().min(1).max(80).optional(),
  vehicleYear: z.number().int().min(1950).max(2100).optional(),
  description: z.string().trim().min(5).max(2000),
  images: z.array(orderImageMetadataSchema).max(5).default([]),
  unlockingLawfulAccess: z.record(z.string(), z.unknown()).default({}),
});

export const providerDiscoveryPreferenceSchema = z.object({
  nearbyEnabled: z.boolean(),
  radiusMeters: z.number().int().min(3000).max(100_000),
  referenceLatitude: z.number().min(43.0).max(44.0).default(43.2389),
  referenceLongitude: z.number().min(76.0).max(77.5).default(76.8897),
});

export const submitOfferSchema = z.object({
  providerServiceProfileId: z.uuid(),
  priceKzt: positiveKztAmountSchema,
  arrivalMinutes: z
    .number()
    .int()
    .positive()
    .max(24 * 60),
  comment: z.string().trim().min(1).max(1000),
  idempotencyKey: idempotencyKeySchema,
});

export const selectProviderSchema = z.object({
  offerId: z.uuid(),
  idempotencyKey: idempotencyKeySchema,
});

export const orderLifecycleCommandSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
  idempotencyKey: idempotencyKeySchema,
});

export const adminCancelOrderSchema = cancelOrderSchema.extend({
  holdCommissionForReview: z.boolean().default(false),
});

export const chatAttachmentMetadataSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("photo"),
    privateObjectKey: z.string().trim().min(8).max(512),
    originalFilename: z.string().trim().min(1).max(255),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    sizeBytes: z
      .number()
      .int()
      .positive()
      .max(20 * 1024 * 1024),
  }),
  z.object({
    kind: z.literal("voice"),
    privateObjectKey: z.string().trim().min(8).max(512),
    originalFilename: z.string().trim().min(1).max(255),
    contentType: z.enum(["audio/webm", "audio/ogg", "audio/mpeg"]),
    sizeBytes: z
      .number()
      .int()
      .positive()
      .max(10 * 1024 * 1024),
    durationSeconds: z.number().int().positive().max(180),
  }),
]);

export const sendChatMessageSchema = z.discriminatedUnion("messageType", [
  z.object({
    messageType: z.literal("text"),
    text: z.string().trim().min(1).max(4000),
  }),
  z.object({
    messageType: z.literal("attachment"),
    attachment: chatAttachmentMetadataSchema,
  }),
]);

export const reportChatMessageSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export const liveLocationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().int().min(0).max(5000),
  recordedAt: z.iso.datetime().optional(),
  sequence: z.number().int().positive().max(2_147_483_647).optional(),
  resumed: z.boolean().default(false),
});

export const walletAdjustmentSchema = z.object({
  providerUserId: z.uuid(),
  amountKzt: positiveKztAmountSchema,
  reason: z.string().trim().min(3).max(1000),
  idempotencyKey: idempotencyKeySchema,
});

export const serviceCategoryCommercialConfigSchema = z.object({
  responseFeeKzt: kztAmountSchema,
  commissionStrategy: commissionStrategySchema,
  commissionPercentageBps: z.number().int().min(0).max(10_000),
  commissionFixedKzt: kztAmountSchema,
  operationalMinimumKzt: kztAmountSchema,
});

export const apiEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    S3_ENDPOINT: z.string().url(),
    S3_REGION: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    S3_BUCKET_PRIVATE: z.string().min(1),
    CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001"),
    IDENTITY_OTP_ADAPTER: z.enum(["development", "disabled"]).default("development"),
    IDENTITY_DEVELOPMENT_OTP: z
      .string()
      .regex(/^\d{6}$/)
      .default("123456"),
    IDENTITY_DEV_AUTH_HEADER_ENABLED: z.coerce.boolean().default(true),
    OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
    OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    OTP_PHONE_RATE_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(5),
    OTP_IP_RATE_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(30),
    SESSION_COOKIE_NAME: z.string().min(1).default("tezhelp_session"),
    SESSION_COOKIE_SECURE: z.coerce.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV !== "production") {
      return;
    }

    if (value.IDENTITY_OTP_ADAPTER === "development") {
      context.addIssue({
        code: "custom",
        path: ["IDENTITY_OTP_ADAPTER"],
        message: "Development OTP adapter is not allowed in production",
      });
    }

    if (value.IDENTITY_DEV_AUTH_HEADER_ENABLED) {
      context.addIssue({
        code: "custom",
        path: ["IDENTITY_DEV_AUTH_HEADER_ENABLED"],
        message: "Development auth header is not allowed in production",
      });
    }

    if (!value.SESSION_COOKIE_SECURE) {
      context.addIssue({
        code: "custom",
        path: ["SESSION_COOKIE_SECURE"],
        message: "Secure session cookies are required in production",
      });
    }
  });

export type ApiEnvironment = z.infer<typeof apiEnvSchema>;

export const publicWebEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:4000"),
});

export type PublicWebEnvironment = z.infer<typeof publicWebEnvSchema>;
