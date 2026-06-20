import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { adminModerationQueueSchema, moderationDecisionSchema } from "@tezhelp/validation";

import { resolveApiLocale } from "../../foundation/http/locale-query.js";
import { parseBody } from "../../identity/presentation/zod-body.js";
import {
  ApproveProviderServiceProfileUseCase,
  GetAdminDocumentAccessUrlUseCase,
  GetModerationDetailUseCase,
  ListModerationQueueUseCase,
  MarkModerationUnderReviewUseCase,
  RejectProviderServiceProfileUseCase,
  SuspendProviderServiceProfileUseCase,
} from "../application/moderation.use-cases.js";
import { ModerationApplicationError } from "../domain/moderation-errors.js";
import { type AdminRequest, DevelopmentAdminGuard } from "./development-admin.guard.js";

@ApiTags("admin-moderation")
@UseGuards(DevelopmentAdminGuard)
@Controller("admin/provider-moderation")
export class AdminModerationController {
  constructor(
    private readonly listQueue: ListModerationQueueUseCase,
    private readonly getDetail: GetModerationDetailUseCase,
    private readonly markUnderReview: MarkModerationUnderReviewUseCase,
    private readonly approveProfile: ApproveProviderServiceProfileUseCase,
    private readonly rejectProfile: RejectProviderServiceProfileUseCase,
    private readonly suspendProfile: SuspendProviderServiceProfileUseCase,
    private readonly getDocumentAccessUrl: GetAdminDocumentAccessUrlUseCase,
  ) {}

  @Get("queue")
  @ApiOkResponse({ description: "Manual provider moderation queue." })
  async queue(
    @Query("locale") rawLocale: string | undefined,
    @Query("status") status: string | undefined,
    @Query("categorySlug") categorySlug: string | undefined,
  ) {
    const filter = parseBody(adminModerationQueueSchema, { status, categorySlug });
    return this.listQueue.execute({
      locale: resolveApiLocale(rawLocale),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.categorySlug ? { categorySlug: filter.categorySlug } : {}),
    });
  }

  @Get("service-profiles/:serviceProfileId")
  @ApiOkResponse({ description: "Provider service profile moderation detail." })
  async detail(
    @Param("serviceProfileId") serviceProfileId: string,
    @Query("locale") rawLocale?: string,
  ) {
    return this.getDetail.execute(serviceProfileId, resolveApiLocale(rawLocale));
  }

  @Post("service-profiles/:serviceProfileId/review")
  @ApiOkResponse({ description: "Mark a submitted profile as under review." })
  async review(@Param("serviceProfileId") serviceProfileId: string, @Req() request: AdminRequest) {
    return this.markUnderReview.execute(serviceProfileId, this.requireAdminUserId(request));
  }

  @Post("service-profiles/:serviceProfileId/approve")
  @ApiOkResponse({ description: "Approve a provider service profile." })
  async approve(
    @Param("serviceProfileId") serviceProfileId: string,
    @Req() request: AdminRequest,
    @Body() body: unknown,
  ) {
    const input = parseBody(moderationDecisionSchema, body);
    return this.approveProfile.execute(
      serviceProfileId,
      this.requireAdminUserId(request),
      input.reason,
    );
  }

  @Post("service-profiles/:serviceProfileId/reject")
  @ApiOkResponse({ description: "Reject a provider service profile." })
  async reject(
    @Param("serviceProfileId") serviceProfileId: string,
    @Req() request: AdminRequest,
    @Body() body: unknown,
  ) {
    const input = parseBody(moderationDecisionSchema, body);
    return this.rejectProfile.execute(
      serviceProfileId,
      this.requireAdminUserId(request),
      input.reason,
    );
  }

  @Post("service-profiles/:serviceProfileId/suspend")
  @ApiOkResponse({ description: "Suspend a provider service category." })
  async suspend(
    @Param("serviceProfileId") serviceProfileId: string,
    @Req() request: AdminRequest,
    @Body() body: unknown,
  ) {
    const input = parseBody(moderationDecisionSchema, body);
    return this.suspendProfile.execute(
      serviceProfileId,
      this.requireAdminUserId(request),
      input.reason,
    );
  }

  @Get("documents/:documentId/access-url")
  @ApiOkResponse({ description: "Create an audited admin document review URL." })
  async documentAccessUrl(@Param("documentId") documentId: string, @Req() request: AdminRequest) {
    return this.getDocumentAccessUrl.execute(this.requireAdminUserId(request), documentId);
  }

  private requireAdminUserId(request: AdminRequest): string {
    if (!request.adminUserId) {
      throw new ModerationApplicationError(
        "UNAUTHORIZED_ADMIN_USER",
        "Admin user header is required",
        401,
      );
    }

    return request.adminUserId;
  }
}
