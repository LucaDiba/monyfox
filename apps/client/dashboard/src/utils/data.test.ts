import { describe, expect, test } from "vitest";
import { generateTestProfile, getDataValidationErrors } from "./data";
import { type Data } from "@monyfox/common-data";

describe("generateTestProfile", () => {
  test("generate a profile with the correct structure", () => {
    const profile = generateTestProfile();

    if (profile.data.encrypted === true) {
      throw new Error("Profile should not be encrypted");
    }

    expect(profile.data.data.accounts.length).toBeGreaterThan(0);
    expect(profile.data.data.transactions.length).toBeGreaterThan(0);
    expect(profile.data.data.transactionCategories.length).toBeGreaterThan(0);
    expect(profile.data.data.assetSymbols.length).toBeGreaterThan(0);
  });
});

describe("getDataValidationErrors", () => {
  test("error for cycles in transaction categories", () => {
    const data: Data = {
      accounts: [],
      transactions: [],
      transactionCategories: [
        { id: "1", name: "Category 1", parentTransactionCategoryId: "2" },
        { id: "2", name: "Category 2", parentTransactionCategoryId: "1" },
      ],
      transactionsImporters: [],
      importedTransactions: [],
      assetSymbols: [],
      assetSymbolExchanges: [],
      assetSymbolExchangersMetadata: { alphavantage: null },
      lastUpdated: new Date().toISOString(),
    };

    const errors = getDataValidationErrors(data);
    expect(errors).toEqual(["There are cycles in the transaction categories"]);
  });

  test("error for category non-existing parent category", () => {
    const data: Data = {
      accounts: [],
      transactions: [],
      transactionCategories: [
        { id: "1", name: "Category 1", parentTransactionCategoryId: "2" },
      ],
      transactionsImporters: [],
      importedTransactions: [],
      assetSymbols: [],
      assetSymbolExchanges: [],
      assetSymbolExchangersMetadata: { alphavantage: null },
      lastUpdated: new Date().toISOString(),
    };

    const errors = getDataValidationErrors(data);
    expect(errors).toEqual([
      "Transaction category Category 1 has a non-existing parent category",
    ]);
  });

  test("error for transaction non-existing account", () => {
    const data: Data = {
      accounts: [{ id: "1", name: "Account 1", isPersonalAsset: true }],
      transactions: [
        {
          id: "1",
          description: "Transaction 1",
          from: { account: { id: "1" }, amount: 100, symbolId: "EUR" },
          to: { account: { id: "2" }, amount: 100, symbolId: "EUR" },
          transactionCategoryId: "1",
          accountingDate: "2025-01-01",
          transactionDate: "2025-01-01",
        },
      ],
      transactionCategories: [
        { id: "1", name: "Category 1", parentTransactionCategoryId: null },
        { id: "2", name: "Category 2", parentTransactionCategoryId: "1" },
      ],
      transactionsImporters: [],
      importedTransactions: [],
      assetSymbols: [],
      assetSymbolExchanges: [],
      assetSymbolExchangersMetadata: { alphavantage: null },
      lastUpdated: new Date().toISOString(),
    };

    const errors = getDataValidationErrors(data);
    expect(errors).toEqual(["Transaction has a non-existing account"]);
  });

  test("error for transaction non-existing category", () => {
    const data: Data = {
      accounts: [
        { id: "1", name: "Account 1", isPersonalAsset: true },
        { id: "2", name: "Account 2", isPersonalAsset: true },
      ],
      transactions: [
        {
          id: "1",
          description: "Transaction 1",
          from: { account: { id: "1" }, amount: 100, symbolId: "EUR" },
          to: { account: { id: "2" }, amount: 100, symbolId: "EUR" },
          transactionCategoryId: "1",
          accountingDate: "2025-01-01",
          transactionDate: "2025-01-01",
        },
      ],
      transactionCategories: [
        { id: "2", name: "Category 2", parentTransactionCategoryId: null },
      ],
      transactionsImporters: [],
      importedTransactions: [],
      assetSymbols: [],
      assetSymbolExchanges: [],
      assetSymbolExchangersMetadata: { alphavantage: null },
      lastUpdated: new Date().toISOString(),
    };

    const errors = getDataValidationErrors(data);
    expect(errors).toEqual(["Transaction has a non-existing category"]);
  });

  test("no errors for valid data", () => {
    const data: Data = {
      accounts: [
        { id: "1", name: "Account 1", isPersonalAsset: true },
        { id: "2", name: "Account 2", isPersonalAsset: true },
      ],
      transactions: [
        {
          id: "1",
          description: "Transaction 1",
          from: { account: { id: "1" }, amount: 100, symbolId: "EUR" },
          to: { account: { id: "2" }, amount: 100, symbolId: "EUR" },
          transactionCategoryId: "1",
          accountingDate: "2025-01-01",
          transactionDate: "2025-01-01",
        },
      ],
      transactionCategories: [
        { id: "1", name: "Category 1", parentTransactionCategoryId: null },
        { id: "2", name: "Category 2", parentTransactionCategoryId: "1" },
      ],
      transactionsImporters: [],
      importedTransactions: [],
      assetSymbols: [],
      assetSymbolExchanges: [],
      assetSymbolExchangersMetadata: { alphavantage: null },
      lastUpdated: new Date().toISOString(),
    };

    const errors = getDataValidationErrors(data);
    expect(errors).toEqual([]);
  });
});
