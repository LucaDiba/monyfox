import type { ParsedTransaction } from "@monyfox/client-transactions-importer";
import { getTransactionType } from "@/utils/transaction.ts";
import type { Account } from "@monyfox/common-data";

export function needsReview(parsedTransaction: ParsedTransaction, getAccount: (accountId: string) => Account) {

  const transactionType = getTransactionType({
    from: {
      account: parsedTransaction.from.account !== undefined && "id" in parsedTransaction.from.account ? {
        id: parsedTransaction.from.account.id,
      } : {
        name: parsedTransaction.from.account?.name ?? "",
      },
    },
    to: {
      account: parsedTransaction.to.account !== undefined && "id" in parsedTransaction.to.account ? {
        id: parsedTransaction.to.account.id,
      } : {
        name: parsedTransaction.to.account?.name ?? "",
      },
    },
  }, getAccount);

  const isTransactionTypeCorrect =
    (parsedTransaction.transactionType === "income" && transactionType === "income") ||
    (parsedTransaction.transactionType === "expense" && transactionType === "expense") ||
    (parsedTransaction.transactionType === "transfer" && transactionType === "transfer");

  return (
    parsedTransaction.date === undefined ||
    parsedTransaction.description === undefined ||
    parsedTransaction.transactionCategoryId === undefined ||
    parsedTransaction.from.amount === undefined ||
    parsedTransaction.from.symbolId === undefined ||
    parsedTransaction.from.account === undefined ||
    parsedTransaction.to.amount === undefined ||
    parsedTransaction.to.symbolId === undefined ||
    parsedTransaction.to.account === undefined ||
    !isTransactionTypeCorrect
  );
}
