import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Test } from "@nestjs/testing";
import { sql } from "kysely";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { DatabaseService } from "../foundation/database/database.service.js";
import {
  ApproveProviderServiceProfileUseCase,
  GetAdminDocumentAccessUrlUseCase,
  ListModerationQueueUseCase,
} from "../moderation/application/moderation.use-cases.js";
import { ModerationModule } from "../moderation/moderation.module.js";
import {
  CreateProviderServiceProfileUseCase,
  GetProviderDocumentAccessUrlUseCase,
  GetProviderOfferEligibilityUseCase,
  RegisterProviderDocumentUseCase,
  SubmitProviderServiceProfileUseCase,
  UpdateProviderProfileUseCase,
  UploadProviderDocumentUseCase,
} from "./application/provider-profile.use-cases.js";
import { ProviderServicesApplicationError } from "./domain/provider-services-errors.js";
import { ProviderServicesModule } from "./provider-services.module.js";
import { ListServiceCategoriesUseCase } from "../service-catalog/application/list-service-categories.use-case.js";
import { ServiceCatalogModule } from "../service-catalog/service-catalog.module.js";

const hasDockerBackedEnvironment =
  Boolean(process.env.DATABASE_URL) &&
  Boolean(process.env.REDIS_URL) &&
  Boolean(process.env.S3_ENDPOINT) &&
  Boolean(process.env.S3_BUCKET_PRIVATE);

const describeWithInfrastructure = hasDockerBackedEnvironment ? describe : describe.skip;

describeWithInfrastructure("provider moderation integration", () => {
  let closeModule: (() => Promise<void>) | undefined;
  let database: DatabaseService;
  let listCategories: ListServiceCategoriesUseCase;
  let updateProfile: UpdateProviderProfileUseCase;
  let createServiceProfile: CreateProviderServiceProfileUseCase;
  let registerDocument: RegisterProviderDocumentUseCase;
  let uploadDocument: UploadProviderDocumentUseCase;
  let submitServiceProfile: SubmitProviderServiceProfileUseCase;
  let offerEligibility: GetProviderOfferEligibilityUseCase;
  let listQueue: ListModerationQueueUseCase;
  let approveProfile: ApproveProviderServiceProfileUseCase;
  let getProviderDocumentAccessUrl: GetProviderDocumentAccessUrlUseCase;
  let getAdminDocumentAccessUrl: GetAdminDocumentAccessUrlUseCase;

  const providerUserId = "11111111-1111-4111-8111-111111111111";
  const secondProviderUserId = "22222222-2222-4222-8222-222222222222";
  const adminUserId = "33333333-3333-4333-8333-333333333333";

  beforeEach(async () => {
    await closeModule?.();
    const moduleRef = await Test.createTestingModule({
      imports: [ServiceCatalogModule, ProviderServicesModule, ModerationModule],
    }).compile();
    closeModule = () => moduleRef.close();

    database = moduleRef.get(DatabaseService);
    listCategories = moduleRef.get(ListServiceCategoriesUseCase);
    updateProfile = moduleRef.get(UpdateProviderProfileUseCase);
    createServiceProfile = moduleRef.get(CreateProviderServiceProfileUseCase);
    registerDocument = moduleRef.get(RegisterProviderDocumentUseCase);
    uploadDocument = moduleRef.get(UploadProviderDocumentUseCase);
    submitServiceProfile = moduleRef.get(SubmitProviderServiceProfileUseCase);
    offerEligibility = moduleRef.get(GetProviderOfferEligibilityUseCase);
    listQueue = moduleRef.get(ListModerationQueueUseCase);
    approveProfile = moduleRef.get(ApproveProviderServiceProfileUseCase);
    getProviderDocumentAccessUrl = moduleRef.get(GetProviderDocumentAccessUrlUseCase);
    getAdminDocumentAccessUrl = moduleRef.get(GetAdminDocumentAccessUrlUseCase);

    await sql`
      truncate table
        provider_document_access_audit,
        provider_moderation_events,
        provider_documents,
        provider_service_profiles,
        identity_security_events,
        user_sessions,
        otp_challenges,
        provider_profiles,
        customer_profiles,
        auth_identity_links,
        users
      cascade
    `.execute(database.db);

    await database.db
      .insertInto("users")
      .values([
        {
          id: providerUserId,
          preferred_locale: "ru",
          status: "active",
          selected_role: "provider",
          verified_phone: "+77001111111",
          phone_verified_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: secondProviderUserId,
          preferred_locale: "ru",
          status: "active",
          selected_role: "provider",
          verified_phone: "+77002222222",
          phone_verified_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: adminUserId,
          preferred_locale: "ru",
          status: "active",
          selected_role: "customer",
          verified_phone: "+77003333333",
          phone_verified_at: new Date(),
          updated_at: new Date(),
        },
      ])
      .execute();
  });

  afterAll(async () => {
    await closeModule?.();
  });

  it("seeds localized categories with configurable document rules", async () => {
    const categories = await listCategories.execute("en");
    const towTruck = categories.find((category) => category.slug === "tow_truck");
    const unlocking = categories.find((category) => category.slug === "vehicle_unlocking");

    expect(categories).toHaveLength(8);
    expect(towTruck?.name).toBe("Tow truck");
    expect(towTruck?.requiredDocuments.map((rule) => rule.documentType)).toContain(
      "vehicle_registration_certificate",
    );
    expect(unlocking?.requiredDocuments.map((rule) => rule.documentType)).toContain(
      "lawful_access_acceptance",
    );
    expect(unlocking?.requiredDocuments.map((rule) => rule.documentType)).not.toContain(
      "tow_vehicle_data",
    );
  });

  it("moderates each provider category independently and audits decisions", async () => {
    await updateProfile.execute(providerUserId, {
      displayName: "Test Provider",
      iin: "123456789012",
      city: "Almaty",
      taxStatus: "individual_entrepreneur",
    });
    const towProfile = await createServiceProfile.execute(providerUserId, "tow_truck");
    const unlockingProfile = await createServiceProfile.execute(
      providerUserId,
      "vehicle_unlocking",
    );
    await registerDocument.execute({
      providerUserId,
      documentType: "face_photo",
      privateObjectKey: "providers/111/face.png",
      originalFilename: "face.png",
      contentType: "image/png",
      sizeBytes: 1024,
      metadata: {},
    });
    await registerDocument.execute({
      providerUserId,
      documentType: "identity_document",
      privateObjectKey: "providers/111/identity.pdf",
      originalFilename: "identity.pdf",
      contentType: "application/pdf",
      sizeBytes: 1024,
      metadata: {},
    });
    const towCategory = (await listCategories.execute("en")).find(
      (category) => category.slug === "tow_truck",
    );
    const towDocuments = await Promise.all(
      (towCategory?.requiredDocuments ?? [])
        .filter((rule) => rule.required)
        .map((rule) =>
          uploadDocument.execute({
            providerUserId,
            serviceProfileId: towProfile.id,
            documentType: rule.documentType,
            originalFilename: `${rule.documentType}.pdf`,
            contentType: rule.allowedMimeTypes[0] ?? "application/pdf",
            sizeBytes: 1024,
            body: Buffer.alloc(1024, rule.documentType),
          }),
        ),
    );
    const document = towDocuments.find(
      (registered) => registered.documentType === "driver_license",
    )!;

    const submitted = await submitServiceProfile.execute(providerUserId, towProfile.id);
    const queue = await listQueue.execute({ locale: "ru" });
    const beforeApproval = await offerEligibility.execute(providerUserId, towProfile.id);
    const approved = await approveProfile.execute(
      towProfile.id,
      adminUserId,
      "Документы проверены",
    );
    const afterApproval = await offerEligibility.execute(providerUserId, towProfile.id);
    const unlockingEligibility = await offerEligibility.execute(
      providerUserId,
      unlockingProfile.id,
    );
    const adminUrl = await getAdminDocumentAccessUrl.execute(adminUserId, document.id);

    await expect(
      getProviderDocumentAccessUrl.execute(secondProviderUserId, document.id),
    ).rejects.toBeInstanceOf(ProviderServicesApplicationError);

    const audit = await database.db
      .selectFrom("audit_events")
      .select(["action", "related_entity_id"])
      .where("related_entity_id", "=", towProfile.id)
      .execute();
    const documentAccess = await database.db
      .selectFrom("provider_document_access_audit")
      .select(["document_id", "actor_user_id"])
      .where("document_id", "=", document.id)
      .execute();

    expect(submitted.moderationStatus).toBe("submitted");
    expect(queue.some((item) => item.serviceProfile.id === towProfile.id)).toBe(true);
    expect(beforeApproval.eligible).toBe(false);
    expect(approved.moderationStatus).toBe("approved");
    expect(afterApproval.eligible).toBe(true);
    expect(unlockingEligibility.eligible).toBe(false);
    expect(adminUrl.url).toContain("X-Amz-Signature=");
    expect((await fetch(adminUrl.url)).status).toBe(200);
    expect(audit.map((event) => event.action)).toContain("provider_service.approved");
    expect(documentAccess.map((event) => event.actor_user_id)).toContain(adminUserId);
  });

  it("stores uploaded provider document bytes in private object storage", async () => {
    await updateProfile.execute(providerUserId, {
      displayName: "Upload Test Provider",
      iin: "123456789012",
      city: "Almaty",
      taxStatus: "individual_entrepreneur",
    });

    const uploaded = await uploadDocument.execute({
      providerUserId,
      documentType: "face_photo",
      originalFilename: "synthetic-face.png",
      contentType: "image/png",
      sizeBytes: 14,
      body: Buffer.from("synthetic-face"),
    });
    const stored = await database.db
      .selectFrom("provider_documents")
      .select("private_object_key")
      .where("id", "=", uploaded.id)
      .executeTakeFirstOrThrow();
    const s3Endpoint = process.env.S3_ENDPOINT;
    const s3Bucket = process.env.S3_BUCKET_PRIVATE;
    if (!s3Endpoint || !s3Bucket) {
      throw new Error("S3 integration environment is not configured");
    }
    const client = new S3Client({
      endpoint: s3Endpoint,
      region: process.env.S3_REGION ?? "local",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "tezhelp_dev_access_key",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "tezhelp_dev_secret_key",
      },
      forcePathStyle: true,
    });
    const object = await client.send(
      new HeadObjectCommand({
        Bucket: s3Bucket,
        Key: stored.private_object_key,
      }),
    );

    expect(uploaded.documentType).toBe("face_photo");
    expect(object.ContentLength).toBe(14);
  });

  it("rejects moderation submission until profile and required documents are complete", async () => {
    const serviceProfile = await createServiceProfile.execute(providerUserId, "tow_truck");

    await expect(
      submitServiceProfile.execute(providerUserId, serviceProfile.id),
    ).rejects.toMatchObject({ code: "PROVIDER_PROFILE_INCOMPLETE" });
  });
});
