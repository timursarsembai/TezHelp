import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { ModerationApplicationError } from "../../moderation/domain/moderation-errors.js";
import {
  type AdminRequest,
  DevelopmentAdminGuard,
} from "../../moderation/presentation/development-admin.guard.js";
import {
  GetAdminOrderConversationUseCase,
  GetChatAttachmentAccessUrlUseCase,
} from "../application/chat.use-cases.js";

@ApiTags("admin-order-chat")
@UseGuards(DevelopmentAdminGuard)
@Controller("admin/orders/:orderId/chat")
export class AdminOrderChatController {
  constructor(
    private readonly getConversation: GetAdminOrderConversationUseCase,
    private readonly getAttachmentAccessUrl: GetChatAttachmentAccessUrlUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: "Admin order conversation view for dispute handling." })
  async conversation(@Param("orderId") orderId: string, @Req() request: AdminRequest) {
    this.requireAdminUserId(request);
    return this.getConversation.execute(orderId);
  }

  @Get("attachments/:attachmentId/access-url")
  @ApiOkResponse({ description: "Create an audited admin private chat attachment URL." })
  async attachmentAccessUrl(
    @Param("orderId") orderId: string,
    @Param("attachmentId") attachmentId: string,
    @Req() request: AdminRequest,
  ) {
    return this.getAttachmentAccessUrl.executeForAdmin({
      orderId,
      attachmentId,
      adminUserId: this.requireAdminUserId(request),
    });
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
