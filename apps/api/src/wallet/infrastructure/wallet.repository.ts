import { Injectable } from "@nestjs/common";
import type { Transaction } from "kysely";

import type {
  WalletLedgerEntrySummary,
  WalletLedgerEntryType,
  WalletSummary,
} from "@tezhelp/types";

import { DatabaseService } from "../../foundation/database/database.service.js";
import type { DatabaseSchema } from "../../foundation/database/database.types.js";
import { WalletApplicationError } from "../domain/wallet-errors.js";

export interface WalletAccountRecord {
  readonly providerUserId: string;
  readonly availableBalanceKzt: number;
  readonly reservedBalanceKzt: number;
  readonly freeResponsesRemaining: number;
}

export interface LedgerEntryInput {
  readonly providerUserId: string;
  readonly entryType: WalletLedgerEntryType;
  readonly amountKzt: number;
  readonly availableDeltaKzt: number;
  readonly reservedDeltaKzt: number;
  readonly idempotencyKey: string;
  readonly actorUserId: string;
  readonly reason: string;
  readonly relatedOrderId?: string;
  readonly relatedOfferId?: string;
  readonly relatedCommissionReservationId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface CommissionReservationLedgerInput {
  readonly providerUserId: string;
  readonly reservationId: string;
  readonly actorUserId: string;
  readonly idempotencyKey: string;
  readonly reason: string;
}

@Injectable()
export class WalletRepository {
  constructor(private readonly database: DatabaseService) {}

  async transaction<T>(callback: (trx: Transaction<DatabaseSchema>) => Promise<T>): Promise<T> {
    return this.database.transaction(callback);
  }

  async getWallet(providerUserId: string): Promise<WalletSummary> {
    await this.ensureWallet(providerUserId);
    const row = await this.database.db
      .selectFrom("wallet_accounts")
      .selectAll()
      .where("provider_user_id", "=", providerUserId)
      .executeTakeFirstOrThrow();

    return this.toWalletSummary(row);
  }

  async listLedger(providerUserId: string): Promise<ReadonlyArray<WalletLedgerEntrySummary>> {
    const rows = await this.database.db
      .selectFrom("wallet_ledger_entries")
      .selectAll()
      .where("provider_user_id", "=", providerUserId)
      .orderBy("created_at", "desc")
      .limit(100)
      .execute();

    return rows.map((row) => this.toLedgerSummary(row));
  }

  async applyStandaloneEntry(input: LedgerEntryInput): Promise<WalletLedgerEntrySummary> {
    return this.database.transaction(async (trx) => {
      await this.ensureWalletForUpdate(trx, input.providerUserId);
      return this.applyLedgerEntry(trx, input);
    });
  }

  async ensureWallet(providerUserId: string): Promise<void> {
    await this.database.db
      .insertInto("wallet_accounts")
      .values({ provider_user_id: providerUserId })
      .onConflict((oc) => oc.column("provider_user_id").doNothing())
      .execute();
  }

  async ensureWalletForUpdate(
    trx: Transaction<DatabaseSchema>,
    providerUserId: string,
  ): Promise<WalletAccountRecord> {
    await trx
      .insertInto("wallet_accounts")
      .values({ provider_user_id: providerUserId })
      .onConflict((oc) => oc.column("provider_user_id").doNothing())
      .execute();

    const row = await trx
      .selectFrom("wallet_accounts")
      .selectAll()
      .where("provider_user_id", "=", providerUserId)
      .forUpdate()
      .executeTakeFirstOrThrow();

    return {
      providerUserId: row.provider_user_id,
      availableBalanceKzt: row.available_balance_kzt,
      reservedBalanceKzt: row.reserved_balance_kzt,
      freeResponsesRemaining: row.free_responses_remaining,
    };
  }

  async consumeFreeResponse(
    trx: Transaction<DatabaseSchema>,
    providerUserId: string,
  ): Promise<void> {
    const result = await trx
      .updateTable("wallet_accounts")
      .set((eb) => ({
        free_responses_remaining: eb("free_responses_remaining", "-", 1),
        updated_at: new Date(),
      }))
      .where("provider_user_id", "=", providerUserId)
      .where("free_responses_remaining", ">", 0)
      .executeTakeFirst();

    if (Number(result.numUpdatedRows) !== 1) {
      throw new WalletApplicationError(
        "PROVIDER_BALANCE_INSUFFICIENT",
        "Free response credit is not available",
        409,
      );
    }
  }

  async applyLedgerEntry(
    trx: Transaction<DatabaseSchema>,
    input: LedgerEntryInput,
  ): Promise<WalletLedgerEntrySummary> {
    const existing = await trx
      .selectFrom("wallet_ledger_entries")
      .selectAll()
      .where("provider_user_id", "=", input.providerUserId)
      .where("idempotency_key", "=", input.idempotencyKey)
      .executeTakeFirst();
    if (existing) {
      if (
        existing.entry_type !== input.entryType ||
        existing.amount_kzt !== input.amountKzt ||
        existing.available_delta_kzt !== input.availableDeltaKzt ||
        existing.reserved_delta_kzt !== input.reservedDeltaKzt
      ) {
        throw new WalletApplicationError(
          "IDEMPOTENCY_CONFLICT",
          "Idempotency key was reused with different wallet mutation",
          409,
        );
      }

      return this.toLedgerSummary(existing);
    }

    const account = await this.ensureWalletForUpdate(trx, input.providerUserId);
    const nextAvailable = account.availableBalanceKzt + input.availableDeltaKzt;
    const nextReserved = account.reservedBalanceKzt + input.reservedDeltaKzt;
    if (nextAvailable < 0 || nextReserved < 0) {
      throw new WalletApplicationError(
        "WALLET_NEGATIVE_BALANCE",
        "Wallet mutation would make balance negative",
        409,
      );
    }

    await trx
      .updateTable("wallet_accounts")
      .set({
        available_balance_kzt: nextAvailable,
        reserved_balance_kzt: nextReserved,
        updated_at: new Date(),
      })
      .where("provider_user_id", "=", input.providerUserId)
      .execute();

    const row = await trx
      .insertInto("wallet_ledger_entries")
      .values({
        provider_user_id: input.providerUserId,
        entry_type: input.entryType,
        amount_kzt: input.amountKzt,
        available_delta_kzt: input.availableDeltaKzt,
        reserved_delta_kzt: input.reservedDeltaKzt,
        resulting_available_balance_kzt: nextAvailable,
        resulting_reserved_balance_kzt: nextReserved,
        idempotency_key: input.idempotencyKey,
        actor_user_id: input.actorUserId,
        reason: input.reason,
        related_order_id: input.relatedOrderId ?? null,
        related_offer_id: input.relatedOfferId ?? null,
        related_commission_reservation_id: input.relatedCommissionReservationId ?? null,
        metadata: input.metadata ?? {},
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.toLedgerSummary(row);
  }

  async captureCommissionReservation(
    trx: Transaction<DatabaseSchema>,
    input: CommissionReservationLedgerInput,
  ): Promise<WalletLedgerEntrySummary> {
    const existing = await this.findLedgerByIdempotency(
      trx,
      input.providerUserId,
      input.idempotencyKey,
    );
    if (existing) {
      return this.toLedgerSummary(existing);
    }

    const reservation = await this.lockReservation(trx, input);
    if (reservation.state !== "reserved") {
      throw new WalletApplicationError(
        "COMMISSION_RESERVATION_NOT_RESERVED",
        "Commission reservation is not reserved",
        409,
      );
    }

    const ledger = await this.applyLedgerEntry(trx, {
      providerUserId: input.providerUserId,
      entryType: "commission_capture",
      amountKzt: reservation.amount_kzt,
      availableDeltaKzt: 0,
      reservedDeltaKzt: -reservation.amount_kzt,
      actorUserId: input.actorUserId,
      reason: input.reason,
      idempotencyKey: input.idempotencyKey,
      relatedOrderId: reservation.order_id,
      relatedOfferId: reservation.offer_id,
      relatedCommissionReservationId: reservation.id,
    });

    await trx
      .updateTable("commission_reservations")
      .set({ state: "captured", updated_at: new Date() })
      .where("id", "=", reservation.id)
      .execute();

    return ledger;
  }

  async releaseCommissionReservation(
    trx: Transaction<DatabaseSchema>,
    input: CommissionReservationLedgerInput,
  ): Promise<WalletLedgerEntrySummary> {
    const existing = await this.findLedgerByIdempotency(
      trx,
      input.providerUserId,
      input.idempotencyKey,
    );
    if (existing) {
      return this.toLedgerSummary(existing);
    }

    const reservation = await this.lockReservation(trx, input);
    if (reservation.state !== "reserved") {
      throw new WalletApplicationError(
        "COMMISSION_RESERVATION_NOT_RESERVED",
        "Commission reservation is not reserved",
        409,
      );
    }

    const ledger = await this.applyLedgerEntry(trx, {
      providerUserId: input.providerUserId,
      entryType: "commission_release",
      amountKzt: reservation.amount_kzt,
      availableDeltaKzt: reservation.amount_kzt,
      reservedDeltaKzt: -reservation.amount_kzt,
      actorUserId: input.actorUserId,
      reason: input.reason,
      idempotencyKey: input.idempotencyKey,
      relatedOrderId: reservation.order_id,
      relatedOfferId: reservation.offer_id,
      relatedCommissionReservationId: reservation.id,
    });

    await trx
      .updateTable("commission_reservations")
      .set({ state: "released", updated_at: new Date() })
      .where("id", "=", reservation.id)
      .execute();

    return ledger;
  }

  async holdCommissionReservation(
    trx: Transaction<DatabaseSchema>,
    input: Omit<CommissionReservationLedgerInput, "idempotencyKey">,
  ): Promise<void> {
    const reservation = await this.lockReservation(trx, input);
    if (reservation.state === "held_for_review") {
      return;
    }
    if (reservation.state !== "reserved") {
      throw new WalletApplicationError(
        "COMMISSION_RESERVATION_NOT_RESERVED",
        "Commission reservation is not reserved",
        409,
      );
    }

    await trx
      .updateTable("commission_reservations")
      .set({ state: "held_for_review", updated_at: new Date() })
      .where("id", "=", reservation.id)
      .execute();
  }

  private toWalletSummary(row: {
    readonly provider_user_id: string;
    readonly available_balance_kzt: number;
    readonly reserved_balance_kzt: number;
    readonly free_responses_remaining: number;
  }): WalletSummary {
    return {
      providerUserId: row.provider_user_id,
      availableBalanceKzt: row.available_balance_kzt,
      reservedBalanceKzt: row.reserved_balance_kzt,
      freeResponsesRemaining: row.free_responses_remaining,
    };
  }

  private async findLedgerByIdempotency(
    trx: Transaction<DatabaseSchema>,
    providerUserId: string,
    idempotencyKey: string,
  ) {
    return trx
      .selectFrom("wallet_ledger_entries")
      .selectAll()
      .where("provider_user_id", "=", providerUserId)
      .where("idempotency_key", "=", idempotencyKey)
      .executeTakeFirst();
  }

  private async lockReservation(
    trx: Transaction<DatabaseSchema>,
    input: Pick<CommissionReservationLedgerInput, "providerUserId" | "reservationId">,
  ) {
    const reservation = await trx
      .selectFrom("commission_reservations")
      .selectAll()
      .where("id", "=", input.reservationId)
      .where("provider_user_id", "=", input.providerUserId)
      .forUpdate()
      .executeTakeFirst();
    if (!reservation) {
      throw new WalletApplicationError(
        "COMMISSION_RESERVATION_NOT_FOUND",
        "Commission reservation was not found",
        404,
      );
    }

    return reservation;
  }

  private toLedgerSummary(row: {
    readonly id: string;
    readonly provider_user_id: string;
    readonly entry_type: WalletLedgerEntryType;
    readonly amount_kzt: number;
    readonly available_delta_kzt: number;
    readonly reserved_delta_kzt: number;
    readonly resulting_available_balance_kzt: number;
    readonly resulting_reserved_balance_kzt: number;
    readonly reason: string;
    readonly related_order_id: string | null;
    readonly related_offer_id: string | null;
    readonly related_commission_reservation_id: string | null;
    readonly created_at: Date;
  }): WalletLedgerEntrySummary {
    return {
      id: row.id,
      providerUserId: row.provider_user_id,
      entryType: row.entry_type,
      amountKzt: row.amount_kzt,
      availableDeltaKzt: row.available_delta_kzt,
      reservedDeltaKzt: row.reserved_delta_kzt,
      resultingAvailableBalanceKzt: row.resulting_available_balance_kzt,
      resultingReservedBalanceKzt: row.resulting_reserved_balance_kzt,
      reason: row.reason,
      createdAt: row.created_at.toISOString(),
      ...(row.related_order_id ? { relatedOrderId: row.related_order_id } : {}),
      ...(row.related_offer_id ? { relatedOfferId: row.related_offer_id } : {}),
      ...(row.related_commission_reservation_id
        ? { relatedCommissionReservationId: row.related_commission_reservation_id }
        : {}),
    };
  }
}
