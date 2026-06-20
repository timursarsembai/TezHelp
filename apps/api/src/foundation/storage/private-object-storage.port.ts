export interface SignedPrivateObjectUrl {
  readonly url: string;
  readonly expiresAt: Date;
}

export interface PrivateObjectStoragePort {
  signReadUrl(input: {
    readonly privateObjectKey: string;
    readonly expiresInSeconds: number;
  }): SignedPrivateObjectUrl;
}

export const PRIVATE_OBJECT_STORAGE = Symbol("PRIVATE_OBJECT_STORAGE");
