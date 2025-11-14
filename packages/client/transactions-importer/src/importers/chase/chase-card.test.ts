import { ChaseCardTransactionsImporter } from "./chase-card";
import { describe, expect, test } from "vitest";

describe("ChaseCardTransactionsImporter", () => {
  const accountId = "test-account-id";
  const symbolId = "test-symbol-id";
  const importer = new ChaseCardTransactionsImporter({ accountId, symbolId });

  describe("getTransactions", () => {
    test("parse transactions correctly", async () => {
      const file = new File(
        [
          `Transaction Date,Post Date,Description,Category,Type,Amount,Memo\n` +
            `09/12/2025,09/14/2025,MERCHANT 1,Shopping,Return,25.00,\n` +
            `09/12/2025,09/14/2025,MERCHANT 2,Food & Drink,Sale,-21.45,\n` +
            `09/06/2025,09/07/2025,MERCHANT 1,Shopping,Sale,-25.00,\n` +
            `08/01/2025,08/03/2025,Payment Thank You-Mobile,,Payment,50.00,\n`,
        ],
        "test.csv",
        { type: "text/csv" },
      );

      const transactions = await importer.getTransactions(file);

      expect(transactions).toHaveLength(4);
      expect(transactions[0]).toEqual({
        providerTransactionId: "chase-card-09/12/2025-25.00-MERCHANT 1",
        transactionType: "income",
        description: "MERCHANT 1",
        date: "2025-09-12",
        transactionCategoryId: null,
        from: {
          amount: 25,
          symbolId,
          account: { name: "MERCHANT 1" },
        },
        to: {
          amount: 25,
          symbolId,
          account: { id: accountId },
        },
      });

      expect(transactions[1]).toEqual({
        providerTransactionId: "chase-card-09/12/2025--21.45-MERCHANT 2",
        transactionType: "expense",
        description: "MERCHANT 2",
        date: "2025-09-12",
        transactionCategoryId: null,
        from: {
          amount: 21.45,
          symbolId,
          account: { id: accountId },
        },
        to: {
          amount: 21.45,
          symbolId,
          account: { name: "MERCHANT 2" },
        },
      });

      expect(transactions[2]).toEqual({
        providerTransactionId: "chase-card-09/06/2025--25.00-MERCHANT 1",
        transactionType: "expense",
        description: "MERCHANT 1",
        date: "2025-09-06",
        transactionCategoryId: null,
        from: {
          amount: 25,
          symbolId,
          account: { id: accountId },
        },
        to: {
          amount: 25,
          symbolId,
          account: { name: "MERCHANT 1" },
        },
      });

      expect(transactions[3]).toEqual({
        providerTransactionId:
          "chase-card-08/01/2025-50.00-Payment Thank You-Mobile",
        transactionType: "transfer",
        description: "Payment Thank You-Mobile",
        date: "2025-08-01",
        transactionCategoryId: null,
        from: {
          amount: 50,
          symbolId,
          account: undefined,
        },
        to: {
          amount: 50,
          symbolId,
          account: undefined,
        },
      });
    });
  });

  describe("getCategories", () => {
    test("should extract categories correctly", async () => {
      const file = new File(
        [
          `Transaction Date,Post Date,Description,Category,Type,Amount,Memo\n` +
            `09/12/2025,09/14/2025,MERCHANT 1,Shopping,Return,25.00,\n` +
            `09/12/2025,09/14/2025,MERCHANT 2,Food & Drink,Sale,-21.45,\n` +
            `09/06/2025,09/07/2025,MERCHANT 1,Shopping,Sale,-25.00,\n` +
            `08/01/2025,08/03/2025,Payment Thank You-Mobile,,Payment,50.00,\n`,
        ],
        "test.csv",
        { type: "text/csv" },
      );

      const categories = await importer.getCategories(file);

      expect(categories).toEqual(["Shopping", "Food & Drink"]);
    });
  });
});
