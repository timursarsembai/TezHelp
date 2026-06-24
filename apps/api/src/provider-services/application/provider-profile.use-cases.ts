import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";

import type {
  Locale,
  ProviderDocumentSummary,
  ProviderProfileSummary,
  ProviderServiceProfileSummary,
  ServiceCategorySlug,
  SignedDocumentUrlResponse,
} from "@tezhelp/types";

import {
  PRIVATE_OBJECT_STORAGE,
  type PrivateObjectStoragePort,
} from "../../foundation/storage/private-object-storage.port.js";
import {
  type RegisterDocumentInput,
  type UpdateProviderProfileInput,
  ProviderServicesRepository,
} from "../infrastructure/provider-services.repository.js";

@Injectable()
export class GetProviderProfileUseCase {
  constructor(private readonly repository: ProviderServicesRepository) {}

  async execute(userId: string): Promise<ProviderProfileSummary> {
    return this.repository.getProviderProfile(userId);
  }
}

@Injectable()
export class UpdateProviderProfileUseCase {
  constructor(private readonly repository: ProviderServicesRepository) {}

  async execute(
    userId: string,
    input: UpdateProviderProfileInput,
  ): Promise<ProviderProfileSummary> {
    return this.repository.updateProviderProfile(userId, input);
  }
}

@Injectable()
export class CreateProviderServiceProfileUseCase {
  constructor(private readonly repository: ProviderServicesRepository) {}

  async execute(
    providerUserId: string,
    categorySlug: ServiceCategorySlug,
  ): Promise<ProviderServiceProfileSummary> {
    return this.repository.createServiceProfile(providerUserId, categorySlug);
  }
}

@Injectable()
export class ListProviderServiceProfilesUseCase {
  constructor(private readonly repository: ProviderServicesRepository) {}

  async execute(
    providerUserId: string,
    locale: Locale,
  ): Promise<ReadonlyArray<ProviderServiceProfileSummary>> {
    return this.repository.listServiceProfiles(providerUserId, locale);
  }
}

@Injectable()
export class RegisterProviderDocumentUseCase {
  constructor(private readonly repository: ProviderServicesRepository) {}

  async execute(input: RegisterDocumentInput) {
    return this.repository.registerDocument(input);
  }
}

@Injectable()
export class UploadProviderDocumentUseCase {
  constructor(
    private readonly repository: ProviderServicesRepository,
    @Inject(PRIVATE_OBJECT_STORAGE) private readonly storage: PrivateObjectStoragePort,
  ) {}

  async execute(input: {
    readonly providerUserId: string;
    readonly serviceProfileId?: string;
    readonly documentType: string;
    readonly originalFilename: string;
    readonly contentType: string;
    readonly sizeBytes: number;
    readonly body: Uint8Array;
  }): Promise<ProviderDocumentSummary> {
    const privateObjectKey = `provider-documents/${input.providerUserId}/${randomUUID()}`;

    await this.storage.putObject({
      privateObjectKey,
      contentType: input.contentType,
      body: input.body,
    });

    try {
      return await this.repository.registerDocument({
        providerUserId: input.providerUserId,
        documentType: input.documentType,
        privateObjectKey,
        originalFilename: input.originalFilename,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        metadata: {},
        ...(input.serviceProfileId ? { serviceProfileId: input.serviceProfileId } : {}),
      });
    } catch (error) {
      await this.storage.deleteObject(privateObjectKey).catch(() => undefined);
      throw error;
    }
  }
}

@Injectable()
export class SubmitProviderServiceProfileUseCase {
  constructor(private readonly repository: ProviderServicesRepository) {}

  async execute(
    providerUserId: string,
    serviceProfileId: string,
  ): Promise<ProviderServiceProfileSummary> {
    return this.repository.submitServiceProfile(providerUserId, serviceProfileId, new Date());
  }
}

@Injectable()
export class GetProviderDocumentAccessUrlUseCase {
  constructor(
    private readonly repository: ProviderServicesRepository,
    @Inject(PRIVATE_OBJECT_STORAGE) private readonly storage: PrivateObjectStoragePort,
  ) {}

  async execute(providerUserId: string, documentId: string): Promise<SignedDocumentUrlResponse> {
    const document = await this.repository.findProviderDocument(providerUserId, documentId);
    const signed = await this.storage.signReadUrl({
      privateObjectKey: document.privateObjectKey,
      expiresInSeconds: 300,
    });
    await this.repository.auditDocumentAccess({
      documentId,
      actorUserId: providerUserId,
      reason: "provider_self_review",
    });

    return {
      url: signed.url,
      expiresAt: signed.expiresAt.toISOString(),
    };
  }
}

@Injectable()
export class GetProviderOfferEligibilityUseCase {
  constructor(private readonly repository: ProviderServicesRepository) {}

  async execute(providerUserId: string, serviceProfileId: string) {
    return {
      eligible: await this.repository.isOfferEligible(providerUserId, serviceProfileId),
    };
  }
}
