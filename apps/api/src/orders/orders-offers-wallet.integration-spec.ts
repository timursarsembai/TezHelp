import { Test } from "@nestjs/testing";
import { sql } from "kysely";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { ServiceCategorySlug } from "@tezhelp/types";

import {
  GetAdminOrderConversationUseCase,
  GetChatAttachmentAccessUrlUseCase,
  GetOrderConversationUseCase,
  RecordChatSystemMessageUseCase,
  ReportChatMessageUseCase,
  SendChatMessageUseCase,
} from "../chat/application/chat.use-cases.js";
import { ChatModule } from "../chat/chat.module.js";
import { DatabaseService } from "../foundation/database/database.service.js";
import {
  GetAdminOrderLiveLocationUseCase,
  GetOrderLiveLocationUseCase,
  PublishProviderLocationUseCase,
} from "../live-location/application/live-location.use-cases.js";
import { LiveLocationModule } from "../live-location/live-location.module.js";
import { OffersModule } from "../offers/offers.module.js";
import {
  ListProviderOrdersUseCase,
  SubmitOfferUseCase,
} from "../offers/application/offers.use-cases.js";
import {
  AppealProviderSanctionUseCase,
  CreateProviderSanctionUseCase,
  GetCustomerReliabilityUseCase,
  LiftProviderSanctionUseCase,
  ListProviderSanctionsUseCase,
  SubmitOrderReviewUseCase,
} from "../reputation/application/reputation.use-cases.js";
import { ReputationModule } from "../reputation/reputation.module.js";
import { CreateOrderUseCase } from "./application/order.use-cases.js";
import { SelectProviderUseCase } from "./application/select-provider.use-case.js";
import {
  CancelOrderUseCase,
  CompleteOrderUseCase,
  ConfirmProviderArrivalUseCase,
  ConfirmProviderDepartureUseCase,
  GetOrderContactUseCase,
  StartOrderWorkUseCase,
} from "./application/order-lifecycle.use-cases.js";
import { OrdersModule } from "./orders.module.js";
import {
  GetProviderWalletUseCase,
  ManualWalletCreditUseCase,
} from "../wallet/application/wallet.use-cases.js";
import { WalletModule } from "../wallet/wallet.module.js";

const hasDockerBackedEnvironment =
  Boolean(process.env.DATABASE_URL) &&
  Boolean(process.env.REDIS_URL) &&
  Boolean(process.env.S3_ENDPOINT) &&
  Boolean(process.env.S3_BUCKET_PRIVATE);

const describeWithInfrastructure = hasDockerBackedEnvironment ? describe : describe.skip;

describeWithInfrastructure("orders, offers, wallet, and selection integration", () => {
  let closeModule: (() => Promise<void>) | undefined;
  let database: DatabaseService;
  let createOrder: CreateOrderUseCase;
  let submitOffer: SubmitOfferUseCase;
  let selectProvider: SelectProviderUseCase;
  let departOrder: ConfirmProviderDepartureUseCase;
  let arriveOrder: ConfirmProviderArrivalUseCase;
  let startOrderWork: StartOrderWorkUseCase;
  let completeOrder: CompleteOrderUseCase;
  let cancelOrder: CancelOrderUseCase;
  let getOrderContact: GetOrderContactUseCase;
  let getConversation: GetOrderConversationUseCase;
  let sendChatMessage: SendChatMessageUseCase;
  let getChatAttachmentAccessUrl: GetChatAttachmentAccessUrlUseCase;
  let reportChatMessage: ReportChatMessageUseCase;
  let recordChatSystemMessage: RecordChatSystemMessageUseCase;
  let getAdminConversation: GetAdminOrderConversationUseCase;
  let publishProviderLocation: PublishProviderLocationUseCase;
  let getOrderLiveLocation: GetOrderLiveLocationUseCase;
  let getAdminOrderLiveLocation: GetAdminOrderLiveLocationUseCase;
  let submitOrderReview: SubmitOrderReviewUseCase;
  let getCustomerReliability: GetCustomerReliabilityUseCase;
  let createProviderSanction: CreateProviderSanctionUseCase;
  let listProviderSanctions: ListProviderSanctionsUseCase;
  let appealProviderSanction: AppealProviderSanctionUseCase;
  let liftProviderSanction: LiftProviderSanctionUseCase;
  let manualCredit: ManualWalletCreditUseCase;
  let getWallet: GetProviderWalletUseCase;
  let listProviderOrders: ListProviderOrdersUseCase;

  const customerUserId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const secondCustomerUserId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const providerUserId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const secondProviderUserId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
  const adminUserId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

  beforeEach(async () => {
    await closeModule?.();
    const moduleRef = await Test.createTestingModule({
      imports: [
        WalletModule,
        OrdersModule,
        OffersModule,
        ChatModule,
        LiveLocationModule,
        ReputationModule,
      ],
    }).compile();
    closeModule = () => moduleRef.close();

    database = moduleRef.get(DatabaseService);
    createOrder = moduleRef.get(CreateOrderUseCase);
    submitOffer = moduleRef.get(SubmitOfferUseCase);
    selectProvider = moduleRef.get(SelectProviderUseCase);
    departOrder = moduleRef.get(ConfirmProviderDepartureUseCase);
    arriveOrder = moduleRef.get(ConfirmProviderArrivalUseCase);
    startOrderWork = moduleRef.get(StartOrderWorkUseCase);
    completeOrder = moduleRef.get(CompleteOrderUseCase);
    cancelOrder = moduleRef.get(CancelOrderUseCase);
    getOrderContact = moduleRef.get(GetOrderContactUseCase);
    getConversation = moduleRef.get(GetOrderConversationUseCase);
    sendChatMessage = moduleRef.get(SendChatMessageUseCase);
    getChatAttachmentAccessUrl = moduleRef.get(GetChatAttachmentAccessUrlUseCase);
    reportChatMessage = moduleRef.get(ReportChatMessageUseCase);
    recordChatSystemMessage = moduleRef.get(RecordChatSystemMessageUseCase);
    getAdminConversation = moduleRef.get(GetAdminOrderConversationUseCase);
    publishProviderLocation = moduleRef.get(PublishProviderLocationUseCase);
    getOrderLiveLocation = moduleRef.get(GetOrderLiveLocationUseCase);
    getAdminOrderLiveLocation = moduleRef.get(GetAdminOrderLiveLocationUseCase);
    submitOrderReview = moduleRef.get(SubmitOrderReviewUseCase);
    getCustomerReliability = moduleRef.get(GetCustomerReliabilityUseCase);
    createProviderSanction = moduleRef.get(CreateProviderSanctionUseCase);
    listProviderSanctions = moduleRef.get(ListProviderSanctionsUseCase);
    appealProviderSanction = moduleRef.get(AppealProviderSanctionUseCase);
    liftProviderSanction = moduleRef.get(LiftProviderSanctionUseCase);
    manualCredit = moduleRef.get(ManualWalletCreditUseCase);
    getWallet = moduleRef.get(GetProviderWalletUseCase);
    listProviderOrders = moduleRef.get(ListProviderOrdersUseCase);

    await sql`
      truncate table
        provider_sanction_events,
        provider_sanctions,
        order_reviews,
        live_location_updates,
        live_location_sessions,
        chat_attachment_access_audit,
        chat_message_reports,
        chat_attachments,
        chat_messages,
        order_conversations,
        commission_reservations,
        offers,
        wallet_ledger_entries,
        wallet_accounts,
        order_images,
        order_status_history,
        orders,
        provider_order_discovery_preferences,
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
        activeUser(customerUserId, "+77001000001", "customer"),
        activeUser(secondCustomerUserId, "+77001000002", "customer"),
        activeUser(providerUserId, "+77002000001", "provider"),
        activeUser(secondProviderUserId, "+77002000002", "provider"),
        activeUser(adminUserId, "+77003000001", "customer"),
      ])
      .execute();
    await database.db
      .insertInto("customer_profiles")
      .values([{ user_id: customerUserId }, { user_id: secondCustomerUserId }])
      .execute();
    await database.db
      .insertInto("provider_profiles")
      .values([{ user_id: providerUserId }, { user_id: secondProviderUserId }])
      .execute();
  });

  afterAll(async () => {
    await closeModule?.();
  });

  it("publishes an order, consumes a free offer, selects provider, and reserves commission", async () => {
    const serviceProfileId = await approveProviderCategory(providerUserId, "tow_truck");
    await manualCredit.execute({
      providerUserId,
      adminUserId,
      amountKzt: 3000,
      reason: "initial test credit",
      idempotencyKey: "credit-provider-1",
    });
    const order = await createOrder.execute({
      customerUserId,
      categorySlug: "tow_truck",
      latitude: 43.2389,
      longitude: 76.8897,
      addressLandmark: "Abay Ave",
      vehicleMake: "Toyota",
      vehicleModel: "Camry",
      vehicleYear: 2015,
      description: "Need tow truck",
      images: [],
      unlockingLawfulAccess: {},
    });

    const discovery = await listProviderOrders.execute(providerUserId);
    const offer = await submitOffer.execute({
      providerUserId,
      orderId: order.id,
      providerServiceProfileId: serviceProfileId,
      priceKzt: 10_000,
      arrivalMinutes: 20,
      comment: "Can arrive soon",
      idempotencyKey: "offer-free-1",
    });
    const selected = await selectProvider.execute({
      customerUserId,
      orderId: order.id,
      offerId: offer.id,
      idempotencyKey: "select-1",
    });
    const wallet = await getWallet.execute(providerUserId);

    expect(discovery.map((item) => item.order.id)).toContain(order.id);
    expect(offer.responseFeeKzt).toBe(0);
    expect(offer.freeResponseCreditUsed).toBe(true);
    expect(selected.status).toBe("provider_selected");
    expect(selected.acceptedPriceKzt).toBe(10_000);
    expect(selected.selectedOfferId).toBe(offer.id);
    expect(wallet.availableBalanceKzt).toBe(2000);
    expect(wallet.reservedBalanceKzt).toBe(1000);
    expect(wallet.freeResponsesRemaining).toBe(4);
  });

  it("charges response fee after free credits are exhausted", async () => {
    const serviceProfileId = await approveProviderCategory(providerUserId, "jump_start");
    await manualCredit.execute({
      providerUserId,
      adminUserId,
      amountKzt: 4000,
      reason: "paid response test credit",
      idempotencyKey: "credit-paid-response",
    });
    await database.db
      .updateTable("wallet_accounts")
      .set({ free_responses_remaining: 0 })
      .where("provider_user_id", "=", providerUserId)
      .execute();
    const order = await createOrder.execute({
      customerUserId,
      categorySlug: "jump_start",
      latitude: 43.24,
      longitude: 76.9,
      addressLandmark: "Satpayev St",
      description: "Battery is dead",
      images: [],
      unlockingLawfulAccess: {},
    });

    const offer = await submitOffer.execute({
      providerUserId,
      orderId: order.id,
      providerServiceProfileId: serviceProfileId,
      priceKzt: 8000,
      arrivalMinutes: 15,
      comment: "I have cables",
      idempotencyKey: "offer-paid-1",
    });
    const wallet = await getWallet.execute(providerUserId);

    expect(offer.responseFeeKzt).toBe(100);
    expect(offer.freeResponseCreditUsed).toBe(false);
    expect(wallet.availableBalanceKzt).toBe(3900);
  });

  it("rejects insufficient balance and keeps the offer uncreated", async () => {
    const serviceProfileId = await approveProviderCategory(providerUserId, "fuel_delivery");
    const order = await createOrder.execute({
      customerUserId,
      categorySlug: "fuel_delivery",
      latitude: 43.24,
      longitude: 76.9,
      addressLandmark: "Furmanov",
      description: "Need fuel",
      images: [],
      unlockingLawfulAccess: {},
    });

    await expect(
      submitOffer.execute({
        providerUserId,
        orderId: order.id,
        providerServiceProfileId: serviceProfileId,
        priceKzt: 5000,
        arrivalMinutes: 30,
        comment: "Can bring fuel",
        idempotencyKey: "offer-insufficient",
      }),
    ).rejects.toMatchObject({ code: "PROVIDER_BALANCE_INSUFFICIENT" });
    const offers = await database.db
      .selectFrom("offers")
      .select("id")
      .where("order_id", "=", order.id)
      .execute();
    expect(offers).toHaveLength(0);
  });

  it("makes duplicate offer submission idempotent for the same key", async () => {
    const serviceProfileId = await approveProviderCategory(providerUserId, "wheel_inflation");
    await manualCredit.execute({
      providerUserId,
      adminUserId,
      amountKzt: 3000,
      reason: "idempotency credit",
      idempotencyKey: "credit-idempotency",
    });
    const order = await createOrder.execute({
      customerUserId,
      categorySlug: "wheel_inflation",
      latitude: 43.24,
      longitude: 76.9,
      addressLandmark: "Dostyk",
      description: "Need wheel inflation",
      images: [],
      unlockingLawfulAccess: {},
    });

    const first = await submitOffer.execute({
      providerUserId,
      orderId: order.id,
      providerServiceProfileId: serviceProfileId,
      priceKzt: 3000,
      arrivalMinutes: 12,
      comment: "I have compressor",
      idempotencyKey: "offer-idempotent",
    });
    const second = await submitOffer.execute({
      providerUserId,
      orderId: order.id,
      providerServiceProfileId: serviceProfileId,
      priceKzt: 3000,
      arrivalMinutes: 12,
      comment: "I have compressor",
      idempotencyKey: "offer-idempotent",
    });

    expect(second.id).toBe(first.id);
    expect((await getWallet.execute(providerUserId)).freeResponsesRemaining).toBe(4);
  });

  it("allows only one provider to be selected for an order under race", async () => {
    const firstProfileId = await approveProviderCategory(providerUserId, "wheel_replacement");
    const secondProfileId = await approveProviderCategory(
      secondProviderUserId,
      "wheel_replacement",
    );
    await manualCredit.execute({
      providerUserId,
      adminUserId,
      amountKzt: 3000,
      reason: "race credit one",
      idempotencyKey: "credit-race-one",
    });
    await manualCredit.execute({
      providerUserId: secondProviderUserId,
      adminUserId,
      amountKzt: 3000,
      reason: "race credit two",
      idempotencyKey: "credit-race-two",
    });
    const order = await createOrder.execute({
      customerUserId,
      categorySlug: "wheel_replacement",
      latitude: 43.24,
      longitude: 76.9,
      addressLandmark: "Al-Farabi",
      description: "Need wheel replacement",
      images: [],
      unlockingLawfulAccess: {},
    });
    const firstOffer = await submitOffer.execute({
      providerUserId,
      orderId: order.id,
      providerServiceProfileId: firstProfileId,
      priceKzt: 10_000,
      arrivalMinutes: 20,
      comment: "First provider",
      idempotencyKey: "offer-race-one",
    });
    const secondOffer = await submitOffer.execute({
      providerUserId: secondProviderUserId,
      orderId: order.id,
      providerServiceProfileId: secondProfileId,
      priceKzt: 11_000,
      arrivalMinutes: 18,
      comment: "Second provider",
      idempotencyKey: "offer-race-two",
    });

    const results = await Promise.allSettled([
      selectProvider.execute({
        customerUserId,
        orderId: order.id,
        offerId: firstOffer.id,
        idempotencyKey: "select-race-one",
      }),
      selectProvider.execute({
        customerUserId,
        orderId: order.id,
        offerId: secondOffer.id,
        idempotencyKey: "select-race-two",
      }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    const selected = await database.db
      .selectFrom("orders")
      .select(["status", "selected_offer_id"])
      .where("id", "=", order.id)
      .executeTakeFirstOrThrow();
    expect(selected.status).toBe("provider_selected");
    expect([firstOffer.id, secondOffer.id]).toContain(selected.selected_offer_id);
  });

  it("moves through active lifecycle, reveals contact after departure, and captures commission", async () => {
    const selected = await createSelectedOrder({
      categorySlug: "tow_truck",
      offerPriceKzt: 10_000,
      idSuffix: "complete",
    });

    const beforeDepartureContact = await getOrderContact.execute({
      viewerUserId: customerUserId,
      orderId: selected.id,
    });
    const departed = await departOrder.execute({ providerUserId, orderId: selected.id });
    const afterDepartureContact = await getOrderContact.execute({
      viewerUserId: customerUserId,
      orderId: selected.id,
    });
    const arrived = await arriveOrder.execute({ providerUserId, orderId: selected.id });
    const inProgress = await startOrderWork.execute({ providerUserId, orderId: selected.id });
    const completed = await completeOrder.execute({
      providerUserId,
      orderId: selected.id,
      idempotencyKey: "complete-order-1",
    });
    const duplicateCompletion = await completeOrder.execute({
      providerUserId,
      orderId: selected.id,
      idempotencyKey: "complete-order-1",
    });
    const wallet = await getWallet.execute(providerUserId);
    const reservation = await database.db
      .selectFrom("commission_reservations")
      .select(["state"])
      .where("id", "=", selected.commissionReservationId!)
      .executeTakeFirstOrThrow();
    const captureEntries = await database.db
      .selectFrom("wallet_ledger_entries")
      .select("id")
      .where("provider_user_id", "=", providerUserId)
      .where("entry_type", "=", "commission_capture")
      .execute();

    expect(beforeDepartureContact.contactVisible).toBe(false);
    expect(beforeDepartureContact.customerPhone).toBeUndefined();
    expect(departed.status).toBe("provider_en_route");
    expect(afterDepartureContact.contactVisible).toBe(true);
    expect(afterDepartureContact.customerPhone).toBe("+77001000001");
    expect(afterDepartureContact.providerPhone).toBe("+77002000001");
    expect(arrived.status).toBe("provider_arrived");
    expect(inProgress.status).toBe("in_progress");
    expect(completed.status).toBe("completed");
    expect(duplicateCompletion.status).toBe("completed");
    expect(wallet.availableBalanceKzt).toBe(2000);
    expect(wallet.reservedBalanceKzt).toBe(0);
    expect(reservation.state).toBe("captured");
    expect(captureEntries).toHaveLength(1);
  });

  it("releases reserved commission when customer cancels before departure", async () => {
    const selected = await createSelectedOrder({
      categorySlug: "fuel_delivery",
      offerPriceKzt: 10_000,
      idSuffix: "cancel-before-departure",
    });

    const cancelled = await cancelOrder.execute({
      actor: "customer",
      actorUserId: customerUserId,
      orderId: selected.id,
      reason: "customer no longer needs service",
      idempotencyKey: "customer-cancel-before-departure",
    });
    const wallet = await getWallet.execute(providerUserId);
    const reservation = await database.db
      .selectFrom("commission_reservations")
      .select(["state"])
      .where("id", "=", selected.commissionReservationId!)
      .executeTakeFirstOrThrow();

    expect(cancelled.status).toBe("cancelled_by_customer");
    expect(wallet.availableBalanceKzt).toBe(3000);
    expect(wallet.reservedBalanceKzt).toBe(0);
    expect(reservation.state).toBe("released");
  });

  it("holds reserved commission when customer cancels after provider arrival", async () => {
    const selected = await createSelectedOrder({
      categorySlug: "wheel_replacement",
      offerPriceKzt: 10_000,
      idSuffix: "cancel-after-arrival",
    });
    await departOrder.execute({ providerUserId, orderId: selected.id });
    await arriveOrder.execute({ providerUserId, orderId: selected.id });

    const cancelled = await cancelOrder.execute({
      actor: "customer",
      actorUserId: customerUserId,
      orderId: selected.id,
      reason: "customer disputes service after arrival",
      idempotencyKey: "customer-cancel-after-arrival",
    });
    const wallet = await getWallet.execute(providerUserId);
    const reservation = await database.db
      .selectFrom("commission_reservations")
      .select(["state"])
      .where("id", "=", selected.commissionReservationId!)
      .executeTakeFirstOrThrow();

    expect(cancelled.status).toBe("cancelled_by_customer");
    expect(wallet.availableBalanceKzt).toBe(2000);
    expect(wallet.reservedBalanceKzt).toBe(1000);
    expect(reservation.state).toBe("held_for_review");
  });

  it("allows assigned participants and admin to use audited order chat attachments", async () => {
    const selected = await createSelectedOrder({
      categorySlug: "tow_truck",
      offerPriceKzt: 10_000,
      idSuffix: "chat",
    });

    const textMessage = await sendChatMessage.execute({
      orderId: selected.id,
      senderUserId: customerUserId,
      message: { messageType: "text", text: "Please keep price changes in chat" },
    });
    const attachmentMessage = await sendChatMessage.execute({
      orderId: selected.id,
      senderUserId: providerUserId,
      message: {
        messageType: "attachment",
        attachment: {
          kind: "photo",
          privateObjectKey: "orders/chat/photo.webp",
          originalFilename: "photo.webp",
          contentType: "image/webp",
          sizeBytes: 1024,
        },
      },
    });
    const conversation = await getConversation.execute({
      orderId: selected.id,
      viewerUserId: customerUserId,
    });
    const signed = await getChatAttachmentAccessUrl.execute({
      orderId: selected.id,
      actorUserId: customerUserId,
      attachmentId: attachmentMessage.attachment!.id,
    });
    const adminConversation = await getAdminConversation.execute(selected.id);
    await reportChatMessage.execute({
      orderId: selected.id,
      messageId: textMessage.id,
      reporterUserId: providerUserId,
      reason: "dispute evidence",
    });
    await reportChatMessage.execute({
      orderId: selected.id,
      messageId: textMessage.id,
      reporterUserId: providerUserId,
      reason: "updated dispute evidence",
    });
    const systemMessage = await recordChatSystemMessage.execute({
      orderId: selected.id,
      systemEventType: "provider_departed",
    });
    const audits = await database.db
      .selectFrom("chat_attachment_access_audit")
      .select("id")
      .where("attachment_id", "=", attachmentMessage.attachment!.id)
      .execute();
    const reports = await database.db
      .selectFrom("chat_message_reports")
      .select(["id", "reason"])
      .where("message_id", "=", textMessage.id)
      .where("reporter_user_id", "=", providerUserId)
      .execute();

    const conversationAfterSystemEvent = await getConversation.execute({
      orderId: selected.id,
      viewerUserId: providerUserId,
    });

    expect(conversation.messages).toHaveLength(2);
    expect(conversation.disputeEvidenceNotice).toContain("dispute");
    expect(attachmentMessage.attachment?.kind).toBe("photo");
    expect(systemMessage.messageType).toBe("system");
    expect(systemMessage.systemEventType).toBe("provider_departed");
    expect(conversationAfterSystemEvent.messages).toHaveLength(3);
    expect(signed.url).toContain("orders/chat/photo.webp");
    expect(adminConversation.messages).toHaveLength(2);
    expect(audits).toHaveLength(1);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.reason).toBe("updated dispute evidence");
  });

  it("rejects chat from unrelated users and outside active selected order states", async () => {
    const selected = await createSelectedOrder({
      categorySlug: "jump_start",
      offerPriceKzt: 10_000,
      idSuffix: "chat-forbidden",
    });
    const draftLikeOrder = await createOrder.execute({
      customerUserId,
      categorySlug: "fuel_delivery",
      latitude: 43.24,
      longitude: 76.9,
      addressLandmark: "Before selection",
      description: "Before selection chat",
      images: [],
      unlockingLawfulAccess: {},
    });

    await expect(
      getConversation.execute({
        orderId: selected.id,
        viewerUserId: secondCustomerUserId,
      }),
    ).rejects.toMatchObject({ code: "CHAT_FORBIDDEN" });
    await expect(
      sendChatMessage.execute({
        orderId: draftLikeOrder.id,
        senderUserId: customerUserId,
        message: { messageType: "text", text: "Too early" },
      }),
    ).rejects.toMatchObject({ code: "CHAT_NOT_SENDABLE" });

    await departOrder.execute({ providerUserId, orderId: selected.id });
    await arriveOrder.execute({ providerUserId, orderId: selected.id });
    await startOrderWork.execute({ providerUserId, orderId: selected.id });
    await completeOrder.execute({
      providerUserId,
      orderId: selected.id,
      idempotencyKey: "complete-chat-forbidden",
    });

    await expect(
      sendChatMessage.execute({
        orderId: selected.id,
        senderUserId: customerUserId,
        message: { messageType: "text", text: "Too late" },
      }),
    ).rejects.toMatchObject({ code: "CHAT_NOT_SENDABLE" });
  });

  it("allows assigned parties and admin to use live tracking after departure", async () => {
    const selected = await createSelectedOrder({
      categorySlug: "tow_truck",
      offerPriceKzt: 10_000,
      idSuffix: "live-location",
    });

    const beforeDeparture = await getOrderLiveLocation.execute({
      orderId: selected.id,
      viewerUserId: customerUserId,
    });
    await expect(
      publishProviderLocation.execute({
        orderId: selected.id,
        providerUserId,
        latitude: 43.25,
        longitude: 76.91,
        accuracyMeters: 15,
        sequence: 1,
        resumed: false,
      }),
    ).rejects.toMatchObject({ code: "LIVE_LOCATION_NOT_TRACKABLE" });

    await departOrder.execute({ providerUserId, orderId: selected.id });
    const published = await publishProviderLocation.execute({
      orderId: selected.id,
      providerUserId,
      latitude: 43.25,
      longitude: 76.91,
      accuracyMeters: 15,
      recordedAt: "2000-01-01T00:00:00.000Z",
      sequence: 1,
      resumed: true,
    });
    const customerSnapshot = await getOrderLiveLocation.execute({
      orderId: selected.id,
      viewerUserId: customerUserId,
    });
    const adminSnapshot = await getAdminOrderLiveLocation.execute(selected.id);

    expect(beforeDeparture.visible).toBe(false);
    expect(beforeDeparture.visibilityState).toBe("hidden");
    expect(published.visible).toBe(true);
    expect(published.visibilityState).toBe("stale");
    expect(published.providerPoint?.sequence).toBe(1);
    expect(published.providerPoint?.resumed).toBe(true);
    expect(customerSnapshot.customerPoint?.latitude).toBeCloseTo(43.24, 2);
    expect(customerSnapshot.providerPoint?.latitude).toBeCloseTo(43.25, 5);
    expect(customerSnapshot.routeRebuildRequired).toBe(true);
    expect(adminSnapshot.providerPoint?.longitude).toBeCloseTo(76.91, 5);
  });

  it("protects live tracking from unrelated users and terminal orders", async () => {
    const selected = await createSelectedOrder({
      categorySlug: "jump_start",
      offerPriceKzt: 10_000,
      idSuffix: "live-location-forbidden",
    });
    await departOrder.execute({ providerUserId, orderId: selected.id });
    await publishProviderLocation.execute({
      orderId: selected.id,
      providerUserId,
      latitude: 43.25,
      longitude: 76.91,
      accuracyMeters: 10,
      sequence: 1,
      resumed: false,
    });

    await expect(
      getOrderLiveLocation.execute({
        orderId: selected.id,
        viewerUserId: secondCustomerUserId,
      }),
    ).rejects.toMatchObject({ code: "LIVE_LOCATION_FORBIDDEN" });
    await expect(
      publishProviderLocation.execute({
        orderId: selected.id,
        providerUserId: secondProviderUserId,
        latitude: 43.26,
        longitude: 76.92,
        accuracyMeters: 10,
        sequence: 1,
        resumed: false,
      }),
    ).rejects.toMatchObject({ code: "LIVE_LOCATION_FORBIDDEN" });

    await arriveOrder.execute({ providerUserId, orderId: selected.id });
    await startOrderWork.execute({ providerUserId, orderId: selected.id });
    await completeOrder.execute({
      providerUserId,
      orderId: selected.id,
      idempotencyKey: "complete-live-location-forbidden",
    });
    const afterCompletion = await getOrderLiveLocation.execute({
      orderId: selected.id,
      viewerUserId: customerUserId,
    });

    expect(afterCompletion.visible).toBe(false);
    expect(afterCompletion.visibilityState).toBe("hidden");
    await expect(
      publishProviderLocation.execute({
        orderId: selected.id,
        providerUserId,
        latitude: 43.27,
        longitude: 76.93,
        accuracyMeters: 10,
        sequence: 2,
        resumed: false,
      }),
    ).rejects.toMatchObject({ code: "LIVE_LOCATION_NOT_TRACKABLE" });
  });

  it("records completed-order reviews and derives provider/customer reputation", async () => {
    const selected = await createSelectedOrder({
      categorySlug: "tow_truck",
      offerPriceKzt: 10_000,
      idSuffix: "reputation",
    });
    await departOrder.execute({ providerUserId, orderId: selected.id });
    await arriveOrder.execute({ providerUserId, orderId: selected.id });
    await startOrderWork.execute({ providerUserId, orderId: selected.id });
    await completeOrder.execute({
      providerUserId,
      orderId: selected.id,
      idempotencyKey: "complete-reputation",
    });

    const customerToProvider = await submitOrderReview.execute({
      orderId: selected.id,
      reviewerUserId: customerUserId,
      rating: 5,
      comment: "clean service",
    });
    const providerToCustomer = await submitOrderReview.execute({
      orderId: selected.id,
      reviewerUserId: providerUserId,
      rating: 4,
      comment: "clear instructions",
    });
    const serviceProfile = await database.db
      .selectFrom("provider_service_profiles")
      .select(["rating_average", "rating_count"])
      .where("id", "=", selected.assignedProviderServiceProfileId!)
      .executeTakeFirstOrThrow();
    const reliability = await getCustomerReliability.execute({
      orderId: selected.id,
      providerUserId,
    });

    expect(customerToProvider.direction).toBe("customer_to_provider");
    expect(providerToCustomer.direction).toBe("provider_to_customer");
    expect(serviceProfile.rating_average).toBe("5.00");
    expect(serviceProfile.rating_count).toBe(1);
    expect(reliability.customerUserId).toBe(customerUserId);
    expect(reliability.completedOrders).toBeGreaterThanOrEqual(1);
    expect(reliability.providerReviewAverage).toBe("4.00");
    expect(reliability.providerReviewCount).toBe(1);
    await expect(
      submitOrderReview.execute({
        orderId: selected.id,
        reviewerUserId: customerUserId,
        rating: 3,
      }),
    ).rejects.toMatchObject({ code: "REVIEW_ALREADY_EXISTS" });
  });

  it("rejects reviews before completion", async () => {
    const selected = await createSelectedOrder({
      categorySlug: "jump_start",
      offerPriceKzt: 10_000,
      idSuffix: "early-review",
    });

    await expect(
      submitOrderReview.execute({
        orderId: selected.id,
        reviewerUserId: customerUserId,
        rating: 5,
      }),
    ).rejects.toMatchObject({ code: "REVIEW_ORDER_NOT_COMPLETED" });
  });

  it("blocks offers while an active provider sanction exists and records appeal history", async () => {
    const serviceProfileId = await approveProviderCategory(providerUserId, "fuel_delivery");
    const sanction = await createProviderSanction.execute({
      providerUserId,
      adminUserId,
      serviceProfileId,
      sanctionType: "temporary_block",
      reason: "manual review in progress",
    });
    const order = await createOrder.execute({
      customerUserId,
      categorySlug: "fuel_delivery",
      latitude: 43.24,
      longitude: 76.9,
      addressLandmark: "Sanction test",
      description: "Need fuel delivery after sanction",
      images: [],
      unlockingLawfulAccess: {},
    });

    await expect(
      submitOffer.execute({
        providerUserId,
        orderId: order.id,
        providerServiceProfileId: serviceProfileId,
        priceKzt: 7000,
        arrivalMinutes: 25,
        comment: "blocked while sanctioned",
        idempotencyKey: "offer-sanction-blocked",
      }),
    ).rejects.toMatchObject({ code: "PROVIDER_SANCTIONED" });

    const listed = await listProviderSanctions.execute(providerUserId);
    const appealed = await appealProviderSanction.execute({
      sanctionId: sanction.id,
      providerUserId,
      reason: "documents were updated",
    });
    const lifted = await liftProviderSanction.execute({
      sanctionId: sanction.id,
      adminUserId,
      reason: "appeal accepted",
    });
    await manualCredit.execute({
      providerUserId,
      adminUserId,
      amountKzt: 3000,
      reason: "post sanction lift credit",
      idempotencyKey: "credit-sanction-lifted",
    });
    const offer = await submitOffer.execute({
      providerUserId,
      orderId: order.id,
      providerServiceProfileId: serviceProfileId,
      priceKzt: 7000,
      arrivalMinutes: 25,
      comment: "available after lift",
      idempotencyKey: "offer-sanction-lifted",
    });

    expect(listed).toHaveLength(1);
    expect(appealed.appealStatus).toBe("submitted");
    expect(lifted.liftReason).toBe("appeal accepted");
    expect(lifted.events?.map((event) => event.eventType)).toEqual([
      "applied",
      "appealed",
      "lifted",
    ]);
    expect(offer.status).toBe("active");
  });

  async function approveProviderCategory(
    providerUserIdInput: string,
    categorySlug: string,
  ): Promise<string> {
    const row = await database.db
      .insertInto("provider_service_profiles")
      .values({
        provider_user_id: providerUserIdInput,
        category_slug: categorySlug,
        moderation_status: "approved",
        updated_at: new Date(),
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    return row.id;
  }

  async function createSelectedOrder(input: {
    readonly categorySlug: ServiceCategorySlug;
    readonly offerPriceKzt: number;
    readonly idSuffix: string;
  }) {
    const serviceProfileId = await approveProviderCategory(providerUserId, input.categorySlug);
    await manualCredit.execute({
      providerUserId,
      adminUserId,
      amountKzt: 3000,
      reason: `lifecycle credit ${input.idSuffix}`,
      idempotencyKey: `credit-${input.idSuffix}`,
    });
    const order = await createOrder.execute({
      customerUserId,
      categorySlug: input.categorySlug,
      latitude: 43.24,
      longitude: 76.9,
      addressLandmark: `Lifecycle ${input.idSuffix}`,
      description: `Lifecycle order ${input.idSuffix}`,
      images: [],
      unlockingLawfulAccess: {},
    });
    const offer = await submitOffer.execute({
      providerUserId,
      orderId: order.id,
      providerServiceProfileId: serviceProfileId,
      priceKzt: input.offerPriceKzt,
      arrivalMinutes: 20,
      comment: `Lifecycle offer ${input.idSuffix}`,
      idempotencyKey: `offer-${input.idSuffix}`,
    });

    return selectProvider.execute({
      customerUserId,
      orderId: order.id,
      offerId: offer.id,
      idempotencyKey: `select-${input.idSuffix}`,
    });
  }
});

function activeUser(id: string, phone: string, selectedRole: "customer" | "provider") {
  return {
    id,
    preferred_locale: "ru" as const,
    status: "active" as const,
    selected_role: selectedRole,
    verified_phone: phone,
    phone_verified_at: new Date(),
    updated_at: new Date(),
  };
}
