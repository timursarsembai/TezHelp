import { Inject, Injectable } from "@nestjs/common";

import type {
  Locale,
  ProviderModerationQueueItem,
  ProviderModerationStatus,
  ServiceCategorySlug,
  SignedDocumentUrlResponse,
} from "@tezhelp/types";

import {
  PRIVATE_OBJECT_STORAGE,
  type PrivateObjectStoragePort,
} from "../../foundation/storage/private-object-storage.port.js";
import {
  type ModerationDetail,
  ModerationRepository,
} from "../infrastructure/moderation.repository.js";

@Injectable()
export class ListModerationQueueUseCase {
  constructor(private readonly repository: ModerationRepository) {}

  async execute(input: {
    readonly locale: Locale;
    readonly status?: ProviderModerationStatus;
    readonly categorySlug?: ServiceCategorySlug;
  }): Promise<ReadonlyArray<ProviderModerationQueueItem>> {
    return this.repository.listQueue(
      {
        ...(input.status ? { status: input.status } : {}),
        ...(input.categorySlug ? { categorySlug: input.categorySlug } : {}),
      },
      input.locale,
      new Date(),
    );
  }
}

@Injectable()
export class GetModerationDetailUseCase {
  constructor(private readonly repository: ModerationRepository) {}

  async execute(serviceProfileId: string, locale: Locale): Promise<ModerationDetail> {
    return this.repository.getDetail(serviceProfileId, locale);
  }
}

@Injectable()
export class MarkModerationUnderReviewUseCase {
  constructor(private readonly repository: ModerationRepository) {}

  async execute(serviceProfileId: string, adminUserId: string) {
    return this.repository.markUnderReview(serviceProfileId, adminUserId);
  }
}

@Injectable()
export class ApproveProviderServiceProfileUseCase {
  constructor(private readonly repository: ModerationRepository) {}

  async execute(serviceProfileId: string, adminUserId: string, reason: string) {
    return this.repository.approve(serviceProfileId, adminUserId, reason);
  }
}

@Injectable()
export class RejectProviderServiceProfileUseCase {
  constructor(private readonly repository: ModerationRepository) {}

  async execute(serviceProfileId: string, adminUserId: string, reason: string) {
    return this.repository.reject(serviceProfileId, adminUserId, reason);
  }
}

@Injectable()
export class SuspendProviderServiceProfileUseCase {
  constructor(private readonly repository: ModerationRepository) {}

  async execute(serviceProfileId: string, adminUserId: string, reason: string) {
    return this.repository.suspend(serviceProfileId, adminUserId, reason);
  }
}

@Injectable()
export class GetAdminDocumentAccessUrlUseCase {
  constructor(
    private readonly repository: ModerationRepository,
    @Inject(PRIVATE_OBJECT_STORAGE) private readonly storage: PrivateObjectStoragePort,
  ) {}

  async execute(adminUserId: string, documentId: string): Promise<SignedDocumentUrlResponse> {
    const document = await this.repository.findDocumentForAdmin(documentId);
    const signed = this.storage.signReadUrl({
      privateObjectKey: document.privateObjectKey,
      expiresInSeconds: 300,
    });
    await this.repository.auditDocumentAccess({ documentId, adminUserId });

    return {
      url: signed.url,
      expiresAt: signed.expiresAt.toISOString(),
    };
  }
}
