import { ParsedTransaction } from "@monyfox/client-transactions-importer";

export enum DraftTransactionStatus {
  /** The transaction can't be imported and needs to be manually reviewed. */
  NeedsReview = "needs-review",

  /** The transactio is ready to be imported. */
  ReadyToImport = "ready-to-import",

  /** The transaction has already been imported (or skipped permanently) in the
   * past. */
  SkippedAlreadyImported = "skipped-already-imported",

  /** The user wants to skip the import this time, but the transaction will be
   * processed again next time. */
  SkippedTemporarily = "skipped-temporarily",

  /** The transaction will always be skipped in the future. */
  SkippedPermanently = "skipped-permanently",
}

export type DraftTransaction = ParsedTransaction & {
  status: DraftTransactionStatus;
};

export function getDraftTransactionsByStatus(transactions: DraftTransaction[]) {
  const result = {
    [DraftTransactionStatus.NeedsReview]: [] as DraftTransaction[],
    [DraftTransactionStatus.ReadyToImport]: [] as DraftTransaction[],
    [DraftTransactionStatus.SkippedAlreadyImported]: [] as DraftTransaction[],
    [DraftTransactionStatus.SkippedTemporarily]: [] as DraftTransaction[],
    [DraftTransactionStatus.SkippedPermanently]: [] as DraftTransaction[],
  } as const;

  transactions.forEach((t) => {
    result[t.status].push(t);
  });

  return result;
}
