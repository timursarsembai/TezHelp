import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

  async signReadUrl(input: {
    readonly privateObjectKey: string;
    readonly expiresInSeconds: number;
  }): Promise<SignedPrivateObjectUrl> {
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.config.s3.bucketPrivate,
        Key: input.privateObjectKey,
      }),
      { expiresIn: input.expiresInSeconds },
    );

    return {
      url,
      expiresAt,
    };
  }
}
