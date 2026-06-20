import { z } from "zod";

import { supportedLocales } from "@tezhelp/types";

export const localeSchema = z.enum(supportedLocales);

export const apiEnvSchema = z.object({
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
});

export type ApiEnvironment = z.infer<typeof apiEnvSchema>;

export const publicWebEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:4000"),
});

export type PublicWebEnvironment = z.infer<typeof publicWebEnvSchema>;
