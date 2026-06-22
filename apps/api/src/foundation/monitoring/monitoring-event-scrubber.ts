const redacted = "[REDACTED]";

const sensitiveKeyPatterns = [
  /token/i,
  /secret/i,
  /password/i,
  /otp/i,
  /phone/i,
  /email/i,
  /iin/i,
  /document/i,
  /object.?key/i,
  /coordinate/i,
  /latitude/i,
  /longitude/i,
  /location/i,
];

const riskyValuePatterns = [
  /\+[1-9]\d{7,14}/g,
  /\b\d{12}\b/g,
  /(token|secret|password|otp)=([^&\s]+)/gi,
  /(latitude|longitude|lat|lng)=(-?\d+(?:\.\d+)?)/gi,
  /(privateObjectKey|objectKey)["'=:\s]+[^\s"',}]+/gi,
];

export type MonitoringContext = Readonly<Record<string, unknown>>;

export function scrubMonitoringContext(context: MonitoringContext): MonitoringContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      isSensitiveKey(key) ? redacted : scrubMonitoringValue(value),
    ]),
  );
}

export function scrubMonitoringText(value: string, maxLength = 500): string {
  const scrubbed = riskyValuePatterns.reduce(
    (current, pattern) => current.replace(pattern, redacted),
    value,
  );
  return scrubbed.slice(0, maxLength);
}

function scrubMonitoringValue(value: unknown): unknown {
  if (typeof value === "string") {
    return scrubMonitoringText(value);
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => scrubMonitoringValue(item));
  }

  if (typeof value === "object" && value !== null) {
    return scrubMonitoringContext(value as MonitoringContext);
  }

  return undefined;
}

function isSensitiveKey(key: string): boolean {
  return sensitiveKeyPatterns.some((pattern) => pattern.test(key));
}
