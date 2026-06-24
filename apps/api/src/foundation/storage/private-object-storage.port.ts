export interface SignedPrivateObjectUrl {
  readonly url: string;
  readonly expiresAt: Date;
}

export interface PrivateObjectStoragePort {
  putObject(input: {
    readonly privateObjectKey: string;
    readonly contentType: string;
    readonly body: Uint8Array;
  }): Promise<void>;
  deleteObject(privateObjectKey: string): Promise<void>;
  signReadUrl(input: {
    readonly privateObjectKey: string;
    readonly expiresInSeconds: number;
  }): SignedPrivateObjectUrl;
}

export const PRIVATE_OBJECT_STORAGE = Symbol("PRIVATE_OBJECT_STORAGE");
