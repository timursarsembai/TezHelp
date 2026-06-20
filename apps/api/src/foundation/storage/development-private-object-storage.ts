import { createHmac } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { AppConfigService } from "../configuration/app-config.service.js";
import type {
  PrivateObjectStoragePort,
  SignedPrivateObjectUrl,
} from "./private-object-storage.port.js";

@Injectable()
export class DevelopmentPrivateObjectStorage implements PrivateObjectStoragePort {
  constructor(private readonly config: AppConfigService) {}

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
