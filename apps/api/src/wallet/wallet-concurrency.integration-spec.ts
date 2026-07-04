import { Test } from "@nestjs/testing";
import { sql } from "kysely";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { DatabaseService } from "../foundation/database/database.service.js";
import { SubmitOfferUseCase } from "../offers/application/offers.use-cases.js";
import { OffersModule } from "../offers/offers.module.js";
import { CreateOrderUseCase } from "../orders/application/order.use-cases.js";
import { SelectProviderUseCase } from "../orders/application/select-provider.use-case.js";
import { OrdersModule } from "../orders/orders.module.js";
import { ManualWalletCreditUseCase } from "./application/wallet.use-cases.js";
import { WalletRepository } from "./infrastructure/wallet.repository.js";
import { WalletModule } from "./wallet.module.js";

const hasDockerBackedEnvironment =
  Boolean(process.env.DATABASE_URL) &&
  Boolean(process.env.REDIS_URL) &&
  Boolean(process.env.S3_ENDPOINT) &&
  Boolean(process.env.S3_BUCKET_PRIVATE);

const describeWithInfrastructure = hasDockerBackedEnvironment ? describe : describe.skip;

describeWithInfrastructure("wallet ledger concurrency", () => {
  let closeModule: (() => Promise<void>) | undefined;
  let database: DatabaseService;
  let walletRepository: WalletRepository;
  let manualCredit: ManualWalletCreditUseCase;
  let createOrder: CreateOrderUseCase;
  let submitOffer: SubmitOfferUseCase;
  let selectProvider: SelectProviderUseCase;

  const customerUserId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const providerUserId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const adminUserId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

  beforeEach(async () => {
    await closeModule?.();
    const moduleRef = await Test.createTestingModule({
      imports: [WalletModule, OrdersModule, OffersModule],
    }).compile();
    closeModule = () => moduleRef.close();

    database = moduleRef.get(DatabaseService);
    walletRepository = moduleRef.get(WalletRepository);
    manualCredit = moduleRef.get(ManualWalletCreditUseCase);
    createOrder = moduleRef.get(CreateOrderUseCase);
    submitOffer = moduleRef.get(SubmitOfferUseCase);
    selectProvider = moduleRef.get(SelectProviderUseCase);

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
        activeUser(providerUserId, "+77002000001", "provider"),
        activeUser(adminUserId, "+77003000001", "customer"),
      ])
      .execute();
    await database.db
      .insertInto("customer_profiles")
      .values([{ user_id: customerUserId }])
      .execute();
    await database.db
      .insertInto("provider_profiles")
      .values([{ user_id: providerUserId }])
      .execute();
  });

  afterAll(async () => {
    await closeModule?.();
  });

  it("concurrent manual credits with the same idempotency key produce exactly one ledger entry", async () => {
    const N = 8;
    const idempotencyKey = "concurrent-idempotency-test";

    await Promise.all(
      Array.from({ length: N }, () =>
        manualCredit.execute({
          providerUserId,
          adminUserId,
          amountKzt: 1000,
          reason: "concurrency test",
          idempotencyKey,
        }),
      ),
    );

    const entries = await database.db
      .selectFrom("wallet_ledger_entries")
      .selectAll()
      .where("provider_user_id", "=", providerUserId)
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0]!.resulting_available_balance_kzt).toBe(1000);
  });

  it("concurrent manual credits with distinct idempotency keys all commit and accumulate balance correctly", async () => {
    const N = 8;

    await Promise.all(
      Array.from({ length: N }, (_, i) =>
        manualCredit.execute({
          providerUserId,
          adminUserId,
          amountKzt: 1000,
          reason: "concurrency test",
          idempotencyKey: `concurrent-key-${i}`,
        }),
      ),
    );

    const account = await database.db
      .selectFrom("wallet_accounts")
      .select("available_balance_kzt")
      .where("provider_user_id", "=", providerUserId)
      .executeTakeFirstOrThrow();

    expect(account.available_balance_kzt).toBe(N * 1000);
  });

  it("concurrent commission captures with the same idempotency key produce exactly one capture", async () => {
    const { reservationId } = await createReservedOrder("cap-same-key");
    const N = 8;
    const captureKey = "complete:same-key:commission-capture";

    await Promise.allSettled(
      Array.from({ length: N }, () =>
        database.transaction((trx) =>
          walletRepository.captureCommissionReservation(trx, {
            providerUserId,
            reservationId,
            actorUserId: providerUserId,
            reason: "provider_completed_order",
            idempotencyKey: captureKey,
          }),
        ),
      ),
    );

    const captures = await database.db
      .selectFrom("wallet_ledger_entries")
      .selectAll()
      .where("idempotency_key", "=", captureKey)
      .execute();
    expect(captures).toHaveLength(1);

    const reservation = await database.db
      .selectFrom("commission_reservations")
      .select("state")
      .where("id", "=", reservationId)
      .executeTakeFirstOrThrow();
    expect(reservation.state).toBe("captured");
  });

  it("concurrent commission captures with distinct idempotency keys — exactly one succeeds, rest fail", async () => {
    const { reservationId } = await createReservedOrder("cap-diff-keys");
    const N = 5;

    const results = await Promise.allSettled(
      Array.from({ length: N }, (_, i) =>
        database.transaction((trx) =>
          walletRepository.captureCommissionReservation(trx, {
            providerUserId,
            reservationId,
            actorUserId: providerUserId,
            reason: "provider_completed_order",
            idempotencyKey: `complete:key-${i}:commission-capture`,
          }),
        ),
      ),
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(N - 1);

    const reservation = await database.db
      .selectFrom("commission_reservations")
      .select("state")
      .where("id", "=", reservationId)
      .executeTakeFirstOrThrow();
    expect(reservation.state).toBe("captured");
  });

  async function createReservedOrder(idSuffix: string): Promise<{ reservationId: string }> {
    const serviceProfileId = await approveProviderCategory(providerUserId, "tow_truck");
    await manualCredit.execute({
      providerUserId,
      adminUserId,
      amountKzt: 3000,
      reason: `concurrency test credit ${idSuffix}`,
      idempotencyKey: `credit-${idSuffix}`,
    });
    const order = await createOrder.execute({
      customerUserId,
      categorySlug: "tow_truck",
      latitude: 43.24,
      longitude: 76.9,
      addressLandmark: `Concurrency test ${idSuffix}`,
      description: `Concurrency test order ${idSuffix}`,
      images: [],
      unlockingLawfulAccess: {},
    });
    const offer = await submitOffer.execute({
      providerUserId,
      orderId: order.id,
      providerServiceProfileId: serviceProfileId,
      priceKzt: 10_000,
      arrivalMinutes: 20,
      comment: `Concurrency test offer ${idSuffix}`,
      idempotencyKey: `offer-${idSuffix}`,
    });
    await selectProvider.execute({
      customerUserId,
      orderId: order.id,
      offerId: offer.id,
      idempotencyKey: `select-${idSuffix}`,
    });

    const orderRow = await database.db
      .selectFrom("orders")
      .select("commission_reservation_id")
      .where("id", "=", order.id)
      .executeTakeFirstOrThrow();

    return { reservationId: orderRow.commission_reservation_id! };
  }

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
});

function activeUser(id: string, phone: string, selectedRole: "customer" | "provider") {
  return {
    id,
    preferred_locale: "ru" as const,
    status: "active" as const,
    selected_role: selectedRole,
    is_staff: false,
    verified_phone: phone,
    phone_verified_at: new Date(),
    updated_at: new Date(),
  };
}
