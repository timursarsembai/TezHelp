import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { reportChatMessageSchema, sendChatMessageSchema } from "@tezhelp/validation";

import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import { DevelopmentIdentityGuard } from "../../identity/presentation/development-identity.guard.js";
import type { IdentityRequest } from "../../identity/presentation/identity-request.js";
import { parseBody } from "../../identity/presentation/zod-body.js";
import {
  GetChatAttachmentAccessUrlUseCase,
  GetOrderConversationUseCase,
  ReportChatMessageUseCase,
  SendChatMessageUseCase,
} from "../application/chat.use-cases.js";

@ApiTags("order-chat")
@UseGuards(DevelopmentIdentityGuard)
@Controller("orders/:orderId/chat")
export class OrderChatController {
  constructor(
    private readonly getConversation: GetOrderConversationUseCase,
    private readonly sendMessage: SendChatMessageUseCase,
    private readonly getAttachmentAccessUrl: GetChatAttachmentAccessUrlUseCase,
    private readonly reportMessage: ReportChatMessageUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: "Order conversation for assigned participants." })
  async conversation(@Param("orderId") orderId: string, @Req() request: IdentityRequest) {
    return this.getConversation.execute({
      orderId,
      viewerUserId: this.requireUserId(request),
    });
  }

  @Post("messages")
  @ApiOkResponse({ description: "Send a text or attachment message in an active selected order." })
  async message(
    @Param("orderId") orderId: string,
    @Body() body: unknown,
    @Req() request: IdentityRequest,
  ) {
    const input = parseBody(sendChatMessageSchema, body);
    return this.sendMessage.execute({
      orderId,
      senderUserId: this.requireUserId(request),
      message: input,
    });
  }

  @Post("messages/:messageId/report")
  @ApiOkResponse({ description: "Report a chat message for dispute review." })
  async report(
    @Param("orderId") orderId: string,
    @Param("messageId") messageId: string,
    @Body() body: unknown,
    @Req() request: IdentityRequest,
  ) {
    const input = parseBody(reportChatMessageSchema, body);
    return this.reportMessage.execute({
      orderId,
      messageId,
      reporterUserId: this.requireUserId(request),
      reason: input.reason,
    });
  }

  @Get("attachments/:attachmentId/access-url")
  @ApiOkResponse({ description: "Create an audited short-lived private chat attachment URL." })
  async attachmentAccessUrl(
    @Param("orderId") orderId: string,
    @Param("attachmentId") attachmentId: string,
    @Req() request: IdentityRequest,
  ) {
    return this.getAttachmentAccessUrl.execute({
      orderId,
      attachmentId,
      actorUserId: this.requireUserId(request),
    });
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
