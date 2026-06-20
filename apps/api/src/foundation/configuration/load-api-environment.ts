import { apiEnvSchema } from "@tezhelp/validation";

export function loadApiEnvironment() {
  return apiEnvSchema.parse(process.env);
}
