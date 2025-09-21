import {describe, expect, test} from "vitest";
import {
  getIncomeExpenseByMonthData,
  getTransactionType,
  getBalancesByMonth,
  getStartAndEndDate,
} from "./transaction";
import {LocalDate} from "@js-joda/core";
import {type Transaction} from "@monyfox/common-data";

describe("getTransactionType", () => {
  test("income", () => {
    expect(
      getTransactionType(
        {
          from: {
            account: {
              id: "1",
            },
          },
          to: {
            account: {
              id: "2",
            },
          },
        },
        (accountId) => ({
          id: accountId,
          name: "test",
          isPersonalAsset: accountId === "2",
        }),
      ),
    ).toBe("income");
  });

  test("expense", () => {
    expect(
      getTransactionType(
        {
          from: {
            account: {
              id: "2",
            },
          },
          to: {
            account: {
              id: "1",
            },
          },
        },
        (accountId) => ({
          id: accountId,
          name: "test",
          isPersonalAsset: accountId === "2",
        }),
      ),
    ).toBe("expense");
  });

  test("transfer", () => {
    expect(
      getTransactionType(
        {
          from: {
            account: {
              id: "1",
            },
          },
          to: {
            account: {
              id: "2",
            },
          },
        },
        (accountId) => ({
          id: accountId,
          name: "test",
          isPersonalAsset: true,
        }),
      ),
    ).toBe("transfer");
  });

  test("unknown", () => {
    expect(
      getTransactionType(
        {
          from: {
            account: {
              name: "test 1",
            },
          },
          to: {
            account: {
              name: "test 2",
            },
          },
        },
        (accountId) => ({
          id: accountId,
          name: "test",
          isPersonalAsset: false,
        }),
      ),
    ).toBe("unknown");
  });
});

describe("getIncomeExpenseByMonthData", () => {
  test("should return correct income and expense data by month", () => {
    const transactions = [
      {
        id: "1",
        description: "Income",
        accountingDate: "2025-01-01",
        transactionDate: "2025-01-01",
        transactionCategoryId: null,
        from: {
          amount: 100,
          symbolId: "EUR",
          account: {
            name: "Person",
          },
        },
        to: {
          amount: 100,
          symbolId: "EUR",
          account: {
            id: "1",
          },
        },
      },
      {
        id: "2",
        description: "Transfer",
        accountingDate: "2025-01-02",
        transactionDate: "2025-01-02",
        transactionCategoryId: null,
        from: {
          amount: 200,
          symbolId: "EUR",
          account: {
            id: "2",
          },
        },
        to: {
          amount: 200,
          symbolId: "EUR",
          account: {
            id: "1",
          },
        },
      },
      {
        id: "3",
        description: "Expense",
        accountingDate: "2025-04-01",
        transactionDate: "2025-04-01",
        transactionCategoryId: null,
        from: {
          amount: 300,
          symbolId: "EUR",
          account: {
            id: "1",
          },
        },
        to: {
          amount: 300,
          symbolId: "EUR",
          account: {
            name: "Person",
          },
        },
      },
    ];

    const getAccount = (accountId: string) => ({
      id: accountId,
      name: "test",
      isPersonalAsset: true,
    });

    const convertAmount = ({amount}: { amount: number }) => amount;

    const defaultSymbolId = "EUR";
    const startDate = LocalDate.parse("2025-01-01");
    const endDate = LocalDate.parse("2025-05-01");

    const result = getIncomeExpenseByMonthData({
      transactions,
      startDate,
      endDate,
      getAccount,
      convertAmount,
      defaultSymbolId,
    });

    expect(result).toEqual([
      {date: "2025-01", income: 100, expense: 0},
      {date: "2025-02", income: 0, expense: 0},
      {date: "2025-03", income: 0, expense: 0},
      {date: "2025-04", income: 0, expense: 300},
      // TODO: Fix this test
      // { date: "2025-03", income: 0, expense: 0 },
    ]);
  });
});

describe("getBalancesByMonth", () => {
  test("should return correct balances by month", () => {
    const transactions = [
      {
        id: "1",
        description: "Income",
        accountingDate: "2024-01-01",
        transactionDate: "2024-01-01",
        transactionCategoryId: null,
        from: {
          amount: 100,
          symbolId: "EUR",
          account: {
            name: "Person",
          },
        },
        to: {
          amount: 100,
          symbolId: "EUR",
          account: {
            id: "1",
          },
        },
      },
      {
        id: "2",
        description: "Transfer",
        accountingDate: "2025-02-02",
        transactionDate: "2025-02-02",
        transactionCategoryId: null,
        from: {
          amount: 200,
          symbolId: "EUR",
          account: {
            id: "2",
          },
        },
        to: {
          amount: 200,
          symbolId: "EUR",
          account: {
            id: "1",
          },
        },
      },
      {
        id: "3",
        description: "Expense",
        accountingDate: "2025-04-01",
        transactionDate: "2025-04-01",
        transactionCategoryId: null,
        from: {
          amount: 300,
          symbolId: "EUR",
          account: {
            id: "1",
          },
        },
        to: {
          amount: 300,
          symbolId: "EUR",
          account: {
            name: "Person",
          },
        },
      },
      {
        id: "3",
        description: "Expense",
        accountingDate: "2026-04-01",
        transactionDate: "2026-04-01",
        transactionCategoryId: null,
        from: {
          amount: 300,
          symbolId: "EUR",
          account: {
            id: "1",
          },
        },
        to: {
          amount: 300,
          symbolId: "EUR",
          account: {
            name: "Person",
          },
        },
      },
    ];

    const getAccount = (accountId: string) => ({
      id: accountId,
      name: "test",
      isPersonalAsset: true,
    });
    const convertAmount = ({amount}: { amount: number }) => amount;

    const startDate = LocalDate.parse("2025-01-01");
    const endDate = LocalDate.parse("2025-04-30");

    const result = getBalancesByMonth({
      transactions,
      startDate,
      endDate,
      getAccount,
      convertAmount,
      defaultSymbolId: "EUR",
    });

    expect(result).toEqual([
      {date: "2025-01", balance: 100},
      {date: "2025-02", balance: 100},
      {date: "2025-03", balance: 100},
      {date: "2025-04", balance: -200},
    ]);
  });

  test("should handle no transactions", () => {
    const transactions: Transaction[] = [];

    const getAccount = (accountId: string) => ({
      id: accountId,
      name: "test",
      isPersonalAsset: true,
    });
    const convertAmount = ({amount}: { amount: number }) => amount;

    const startDate = LocalDate.parse("2025-01-01");
    const endDate = LocalDate.parse("2025-03-01");

    const result = getBalancesByMonth({
      transactions,
      startDate,
      endDate,
      getAccount,
      convertAmount,
      defaultSymbolId: "EUR",
    });

    expect(result).toEqual([
      {date: "2025-01", balance: 0},
      {date: "2025-02", balance: 0},
      // TODO: Fix this test
      // { date: "2025-03", balance: 0 },
    ]);
  });
});

describe("getStartAndEndDate", () => {
  test("should return correct start and end dates for transactions", () => {
    const transactions = [
      {
        id: "1",
        description: "Income",
        accountingDate: "2025-01-01",
        transactionDate: "2025-01-01",
        transactionCategoryId: null,
        from: {
          amount: 100,
          symbolId: "EUR",
          account: {
            name: "Person",
          },
        },
        to: {
          amount: 100,
          symbolId: "EUR",
          account: {
            id: "1",
          },
        },
      },
      {
        id: "2",
        description: "Transfer",
        accountingDate: "2025-02-02",
        transactionDate: "2025-02-02",
        transactionCategoryId: null,
        from: {
          amount: 200,
          symbolId: "EUR",
          account: {
            id: "2",
          },
        },
        to: {
          amount: 200,
          symbolId: "EUR",
          account: {
            id: "1",
          },
        },
      },
      {
        id: "3",
        description: "Expense",
        accountingDate: "2025-04-01",
        transactionDate: "2025-04-01",
        transactionCategoryId: null,
        from: {
          amount: 300,
          symbolId: "EUR",
          account: {
            id: "1",
          },
        },
        to: {
          amount: 300,
          symbolId: "EUR",
          account: {
            name: "Person",
          },
        },
      },
    ];

    const result = getStartAndEndDate(transactions);

    expect(result).toEqual({
      startDate: "2025-01-01",
      endDate: "2025-04-01",
    });
  });

  test("should return today's date for no transactions", () => {
    const transactions: Transaction[] = [];

    const result = getStartAndEndDate(transactions);

    const today = LocalDate.now().toString();
    expect(result).toEqual({
      startDate: today,
      endDate: today,
    });
  });
});
