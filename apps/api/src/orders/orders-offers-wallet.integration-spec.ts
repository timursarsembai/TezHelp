import { Test } from "@nestjs/testing";
import { sql } from "kysely";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { ServiceCategorySlug } from "@tezhelp/types";

import { DatabaseService } from "../foundation/database/database.service.js";
import { OffersModule } from "../offers/offers.module.js";
import {
  ListProviderOrdersUseCase,
  SubmitOfferUseCase,
} from "../offers/application/offers.use-cases.js";
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
      imports: [WalletModule, OrdersModule, OffersModule],
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
    manualCredit = moduleRef.get(ManualWalletCreditUseCase);
    getWallet = moduleRef.get(GetProviderWalletUseCase);
    listProviderOrders = moduleRef.get(ListProviderOrdersUseCase);

    await sql`
      truncate table
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
