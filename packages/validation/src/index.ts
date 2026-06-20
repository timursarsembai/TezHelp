import { z } from "zod";

import { supportedLocales } from "@tezhelp/types";

export const localeSchema = z.enum(supportedLocales);
export const userRoleSchema = z.enum(["customer", "provider"]);
export const otpPurposeSchema = z.enum(["sign_in", "phone_completion", "phone_change"]);

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
