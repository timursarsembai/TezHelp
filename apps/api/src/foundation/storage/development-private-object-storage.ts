import { createHmac } from "node:crypto";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";

import { AppConfigService } from "../configuration/app-config.service.js";
import type {
  PrivateObjectStoragePort,
  SignedPrivateObjectUrl,
} from "./private-object-storage.port.js";

@Injectable()
export class DevelopmentPrivateObjectStorage implements PrivateObjectStoragePort {
  private readonly client: S3Client;

  constructor(private readonly config: AppConfigService) {
    this.client = new S3Client({
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async putObject(input: {
    readonly privateObjectKey: string;
    readonly contentType: string;
    readonly body: Uint8Array;
  }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.s3.bucketPrivate,
        Key: input.privateObjectKey,
        ContentType: input.contentType,
        Body: input.body,
      }),
    );
  }

  async deleteObject(privateObjectKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.s3.bucketPrivate,
        Key: privateObjectKey,
      }),
    );
  }

  signReadUrl(input: {
    readonly privateObjectKey: string;
    readonly expiresInSeconds: number;
  }): SignedPrivateObjectUrl {
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
    const expires = String(Math.floor(expiresAt.getTime() / 1000));
    const signature = createHmac("sha256", this.config.s3.secretAccessKey)
      .update(`${input.privateObjectKey}:${expires}`)
      .digest("hex");
    const objectPath = input.privateObjectKey
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");

    return {
      url: `${this.config.s3.endpoint}/${this.config.s3.bucketPrivate}/${objectPath}?expires=${expires}&signature=${signature}`,
      expiresAt,
    };
  }
}
