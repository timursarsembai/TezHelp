import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  createProviderServiceProfileSchema,
  registerProviderDocumentSchema,
  updateProviderProfileSchema,
} from "@tezhelp/validation";

import { resolveApiLocale } from "../../foundation/http/locale-query.js";
import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import { DevelopmentIdentityGuard } from "../../identity/presentation/development-identity.guard.js";
import type { IdentityRequest } from "../../identity/presentation/identity-request.js";
import { parseBody } from "../../identity/presentation/zod-body.js";
import {
  CreateProviderServiceProfileUseCase,
  GetProviderDocumentAccessUrlUseCase,
  GetProviderOfferEligibilityUseCase,
  GetProviderProfileUseCase,
  ListProviderServiceProfilesUseCase,
  RegisterProviderDocumentUseCase,
  SubmitProviderServiceProfileUseCase,
  UpdateProviderProfileUseCase,
} from "../application/provider-profile.use-cases.js";

@ApiTags("provider-services")
@UseGuards(DevelopmentIdentityGuard)
@Controller("provider")
export class ProviderServicesController {
  constructor(
    private readonly getProfile: GetProviderProfileUseCase,
    private readonly updateProfile: UpdateProviderProfileUseCase,
    private readonly createServiceProfile: CreateProviderServiceProfileUseCase,
    private readonly listServiceProfiles: ListProviderServiceProfilesUseCase,
    private readonly registerDocument: RegisterProviderDocumentUseCase,
    private readonly submitServiceProfile: SubmitProviderServiceProfileUseCase,
    private readonly getDocumentAccessUrl: GetProviderDocumentAccessUrlUseCase,
    private readonly getOfferEligibility: GetProviderOfferEligibilityUseCase,
  ) {}

  @Get("profile")
  @ApiOkResponse({ description: "Current provider profile." })
  async profile(@Req() request: IdentityRequest) {
    return this.getProfile.execute(this.requireUserId(request));
  }

  @Patch("profile")
  @ApiOkResponse({ description: "Update current provider profile." })
  async update(@Body() body: unknown, @Req() request: IdentityRequest) {
    const input = parseBody(updateProviderProfileSchema, body);
    return this.updateProfile.execute(this.requireUserId(request), input);
  }

  @Get("service-profiles")
  @ApiOkResponse({ description: "Provider service profiles." })
  async serviceProfiles(@Req() request: IdentityRequest, @Query("locale") rawLocale?: string) {
    return this.listServiceProfiles.execute(
      this.requireUserId(request),
      resolveApiLocale(rawLocale),
    );
  }

  @Post("service-profiles")
  @ApiOkResponse({ description: "Create or return a provider service profile." })
  async createServiceProfileForCategory(@Body() body: unknown, @Req() request: IdentityRequest) {
    const input = parseBody(createProviderServiceProfileSchema, body);
    return this.createServiceProfile.execute(this.requireUserId(request), input.categorySlug);
  }

  @Post("service-profiles/:serviceProfileId/submit")
  @ApiOkResponse({ description: "Submit a provider service profile for moderation." })
  async submit(
    @Param("serviceProfileId") serviceProfileId: string,
    @Req() request: IdentityRequest,
  ) {
    return this.submitServiceProfile.execute(this.requireUserId(request), serviceProfileId);
  }

  @Get("service-profiles/:serviceProfileId/offer-eligibility")
  @ApiOkResponse({ description: "Future offer eligibility for this service profile." })
  async offerEligibility(
    @Param("serviceProfileId") serviceProfileId: string,
    @Req() request: IdentityRequest,
  ) {
    return this.getOfferEligibility.execute(this.requireUserId(request), serviceProfileId);
  }

  @Post("documents")
  @ApiOkResponse({ description: "Register private provider document metadata." })
  async document(@Body() body: unknown, @Req() request: IdentityRequest) {
    const input = parseBody(registerProviderDocumentSchema, body);
    return this.registerDocument.execute({
      providerUserId: this.requireUserId(request),
      documentType: input.documentType,
      privateObjectKey: input.privateObjectKey,
      originalFilename: input.originalFilename,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      metadata: input.metadata,
      ...(input.serviceProfileId ? { serviceProfileId: input.serviceProfileId } : {}),
    });
  }

  @Get("documents/:documentId/access-url")
  @ApiOkResponse({ description: "Create an audited short-lived private document URL." })
  async documentAccessUrl(
    @Param("documentId") documentId: string,
    @Req() request: IdentityRequest,
  ) {
    return this.getDocumentAccessUrl.execute(this.requireUserId(request), documentId);
  }

  private requireUserId(request: IdentityRequest): string {
    if (!request.identityUserId) {
      throw new IdentityApplicationError(
        "UNAUTHORIZED_IDENTITY_USER",
        "User header is required",
        401,
      );
    }

    return request.identityUserId;
  }
}
