import { describe, expect, it } from "vitest";
import {
  DraftTransactionStatus,
  DraftTransaction,
  getDraftTransactionsByStatus,
} from "./utils";
import { ParsedTransaction } from "@monyfox/client-transactions-importer";

const parsedTransaction: ParsedTransaction = {
  providerTransactionId: "id",
  transactionType: "income",
  from: {},
  to: {},
};

describe("getDraftTransactionsByStatus", () => {
  it("should group transactions by their status", () => {
    const transactions: DraftTransaction[] = [
      { ...parsedTransaction, status: DraftTransactionStatus.NeedsReview },
      { ...parsedTransaction, status: DraftTransactionStatus.ReadyToImport },
      {
        ...parsedTransaction,
        status: DraftTransactionStatus.SkippedAlreadyImported,
      },
      {
        ...parsedTransaction,
        status: DraftTransactionStatus.SkippedTemporarily,
      },
      {
        ...parsedTransaction,
        status: DraftTransactionStatus.SkippedPermanently,
      },
      {
        ...parsedTransaction,
        status: DraftTransactionStatus.SkippedAlreadyImported,
      },
      {
        ...parsedTransaction,
        status: DraftTransactionStatus.SkippedPermanently,
      },
    ];

    const result = getDraftTransactionsByStatus(transactions);

    expect(result[DraftTransactionStatus.NeedsReview]).toHaveLength(1);
    expect(result[DraftTransactionStatus.ReadyToImport]).toHaveLength(1);
    expect(result[DraftTransactionStatus.SkippedAlreadyImported]).toHaveLength(
      2,
    );
    expect(result[DraftTransactionStatus.SkippedTemporarily]).toHaveLength(1);
    expect(result[DraftTransactionStatus.SkippedPermanently]).toHaveLength(2);
  });
});
