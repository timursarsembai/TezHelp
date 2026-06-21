import { Injectable } from "@nestjs/common";

import type { WalletLedgerEntrySummary, WalletSummary } from "@tezhelp/types";

import { WalletRepository } from "../infrastructure/wallet.repository.js";

@Injectable()
export class GetProviderWalletUseCase {
  constructor(private readonly repository: WalletRepository) {}

  async execute(providerUserId: string): Promise<WalletSummary> {
    return this.repository.getWallet(providerUserId);
  }
}

@Injectable()
export class ListProviderLedgerUseCase {
  constructor(private readonly repository: WalletRepository) {}

  async execute(providerUserId: string): Promise<ReadonlyArray<WalletLedgerEntrySummary>> {
    return this.repository.listLedger(providerUserId);
  }
}

@Injectable()
export class ManualWalletCreditUseCase {
  constructor(private readonly repository: WalletRepository) {}

  async execute(input: {
    readonly providerUserId: string;
    readonly adminUserId: string;
    readonly amountKzt: number;
    readonly reason: string;
    readonly idempotencyKey: string;
  }): Promise<WalletLedgerEntrySummary> {
    return this.repository.applyStandaloneEntry({
      providerUserId: input.providerUserId,
      entryType: "manual_credit",
      amountKzt: input.amountKzt,
      availableDeltaKzt: input.amountKzt,
      reservedDeltaKzt: 0,
      actorUserId: input.adminUserId,
      reason: input.reason,
      idempotencyKey: input.idempotencyKey,
    });
  }
}

@Injectable()
export class ManualWalletDebitCorrectionUseCase {
  constructor(private readonly repository: WalletRepository) {}

  async execute(input: {
    readonly providerUserId: string;
    readonly adminUserId: string;
    readonly amountKzt: number;
    readonly reason: string;
    readonly idempotencyKey: string;
  }): Promise<WalletLedgerEntrySummary> {
    return this.repository.applyStandaloneEntry({
      providerUserId: input.providerUserId,
      entryType: "manual_debit_correction",
      amountKzt: input.amountKzt,
      availableDeltaKzt: -input.amountKzt,
      reservedDeltaKzt: 0,
      actorUserId: input.adminUserId,
      reason: input.reason,
      idempotencyKey: input.idempotencyKey,
    });
  }
}
