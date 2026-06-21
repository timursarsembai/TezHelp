import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { submitOrderReviewSchema } from "@tezhelp/validation";

import { IdentityApplicationError } from "../../identity/domain/identity-errors.js";
import { DevelopmentIdentityGuard } from "../../identity/presentation/development-identity.guard.js";
import type { IdentityRequest } from "../../identity/presentation/identity-request.js";
import { parseBody } from "../../identity/presentation/zod-body.js";
import { SubmitOrderReviewUseCase } from "../application/reputation.use-cases.js";

@ApiTags("order-reviews")
@UseGuards(DevelopmentIdentityGuard)
@Controller("orders/:orderId/reviews")
export class OrderReviewsController {
  constructor(private readonly submitReview: SubmitOrderReviewUseCase) {}

  @Post()
  @ApiOkResponse({ description: "Submit one completed-order review for the counterparty." })
  async submit(
    @Param("orderId") orderId: string,
    @Body() body: unknown,
    @Req() request: IdentityRequest,
  ) {
    const input = parseBody(submitOrderReviewSchema, body);
    return this.submitReview.execute({
      orderId,
      reviewerUserId: this.requireUserId(request),
      rating: input.rating,
      ...(input.comment ? { comment: input.comment } : {}),
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
