import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import {
  PRIVATE_OBJECT_STORAGE,
  type PrivateObjectStoragePort,
} from "../../foundation/storage/private-object-storage.port.js";

export interface OrderImageUploadResult {
  readonly privateObjectKey: string;
  readonly originalFilename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

function isAllowedContentType(value: string): value is AllowedContentType {
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(value);
}

@Injectable()
export class UploadOrderImageUseCase {
  constructor(
    @Inject(PRIVATE_OBJECT_STORAGE) private readonly storage: PrivateObjectStoragePort,
  ) {}

  async execute(input: {
    readonly customerUserId: string;
    readonly originalFilename: string;
    readonly contentType: string;
    readonly sizeBytes: number;
    readonly body: Uint8Array;
  }): Promise<OrderImageUploadResult> {
    if (!isAllowedContentType(input.contentType)) {
      throw new Error(`Unsupported content type: ${input.contentType}`);
    }

    const privateObjectKey = `order-images/${input.customerUserId}/${randomUUID()}`;

    await this.storage.putObject({
      privateObjectKey,
      contentType: input.contentType,
      body: input.body,
    });

    return {
      privateObjectKey,
      originalFilename: input.originalFilename,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    };
  }
}
