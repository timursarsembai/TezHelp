import { BadRequestException } from "@nestjs/common";

interface ParseSuccess<TValue> {
  readonly success: true;
  readonly data: TValue;
}

interface ParseFailure {
  readonly success: false;
  readonly error: {
    readonly issues: ReadonlyArray<{
      readonly path: ReadonlyArray<PropertyKey>;
      readonly message: string;
    }>;
  };
}

interface SafeParseSchema<TValue> {
  safeParse(body: unknown): ParseSuccess<TValue> | ParseFailure;
}

export function parseBody<TValue>(schema: SafeParseSchema<TValue>, body: unknown): TValue {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException({
      code: "VALIDATION_FAILED",
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  return result.data;
}
