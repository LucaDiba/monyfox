import { describe, expect, test } from "vitest";
import { ChaseAccountTransactionsImporter } from "./chase-account";

describe("ChaseAccountTransactionsImporter", () => {
  const accountId = "test-account-id";
  const symbolId = "test-symbol-id";
  const importer = new ChaseAccountTransactionsImporter({ accountId, symbolId });

  describe("getTransactions", () => {
    test("parses account CSV rows into parsed transactions", async () => {
      const file = new File(
        [
          `Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\n` +
          `CREDIT,09/15/2025,Employer Payroll,1000.00,ACH_CREDIT,1500.00,,\n` +
          `DEBIT,09/14/2025,"CHASE CREDIT CRD AUTOPAY                    PPD ID: 123456789",-45.67,ACH_DEBIT,1454.33,,\n` +
          `DEBIT,09/10/2025,Loan Payment,200.00,LOAN_PMT,1200.00,,\n` +
          `DEBIT,09/09/2025,ATM Withdrawal,100.00,ATM,1100.00,,\n`,
        ],
        "chase_account.csv",
        { type: "text/csv" },
      );

      const transactions = await importer.getTransactions(file);

      expect(transactions).toHaveLength(4);

      // ACH_CREDIT -> income, from unknown -> to this account
      expect(transactions[0]).toEqual({
        providerTransactionId:
          "chase-account-09/15/2025-1000.00-Employer Payroll",
        transactionType: "income",
        description: "Employer Payroll",
        date: "2025-09-15",
        transactionCategoryId: null,
        from: {
          amount: 1000,
          symbolId,
          account: { name: "" },
        },
        to: {
          amount: 1000,
          symbolId,
          account: { id: accountId },
        },
      });

      // ACH_DEBIT -> expense, from this account -> to unknown (amount is absolute)
      expect(transactions[1]).toEqual({
        providerTransactionId: "chase-account-09/14/2025--45.67-CHASE CREDIT CRD AUTOPAY                    PPD ID: 123456789",
        transactionType: "expense",
        description: "CHASE CREDIT CRD AUTOPAY                    PPD ID: 123456789",
        date: "2025-09-14",
        transactionCategoryId: null,
        from: {
          amount: 45.67,
          symbolId,
          account: { id: accountId },
        },
        to: {
          amount: 45.67,
          symbolId,
          account: { name: "" },
        },
      });

      // LOAN_PMT -> transfer, from this account -> to unknown
      expect(transactions[2]).toEqual({
        providerTransactionId: "chase-account-09/10/2025-200.00-Loan Payment",
        transactionType: "transfer",
        description: "Loan Payment",
        date: "2025-09-10",
        transactionCategoryId: null,
        from: {
          amount: 200,
          symbolId,
          account: { id: accountId },
        },
        to: {
          amount: 200,
          symbolId,
          account: { name: "" },
        },
      });

      // ATM -> default -> transfer with undefined accounts
      expect(transactions[3]).toEqual({
        providerTransactionId: "chase-account-09/09/2025-100.00-ATM Withdrawal",
        transactionType: "transfer",
        description: "ATM Withdrawal",
        date: "2025-09-09",
        transactionCategoryId: null,
        from: {
          amount: 100,
          symbolId,
          account: undefined,
        },
        to: {
          amount: 100,
          symbolId,
          account: undefined,
        },
      });
    });
  });
});
