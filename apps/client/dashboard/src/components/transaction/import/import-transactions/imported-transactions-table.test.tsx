import { TestContextProvider } from "@/utils/tests/contexts";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ImportedTransactionsTable } from "./imported-transactions-table";
import {
  render,
  fireEvent,
  screen,
  waitFor,
  renderHook,
} from "@testing-library/react";
import { TransactionType } from "@/utils/transaction";
import { useImmer } from "use-immer";
import { DraftTransaction, DraftTransactionStatus } from "./utils";

const originalLanguageDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "language",
);

beforeEach(() => {
  Object.defineProperty(navigator, "language", {
    value: "it-IT",
    configurable: true,
  });
});

afterEach(() => {
  if (originalLanguageDescriptor) {
    Object.defineProperty(navigator, "language", originalLanguageDescriptor);
  }
});

describe("ImportedTransactionsTable", () => {
  const mockTransactions: DraftTransaction[] = [
    {
      providerTransactionId: "1",
      date: "2023-01-01",
      description: "Test Transaction 1",
      from: {
        amount: 100,
        account: { id: "1" },
      },
      to: {
        amount: 100,
        account: { id: "2" },
      },
      transactionType: TransactionType.Transfer,
      transactionCategoryId: null,
      status: DraftTransactionStatus.ReadyToImport,
    },
    {
      providerTransactionId: "2",
      date: "2023-01-02",
      description: "Test Transaction 2",
      from: {
        amount: 200,
        account: { id: "1" },
      },
      to: {
        amount: 200,
        account: { id: "2" },
      },
      transactionType: TransactionType.Expense,
      transactionCategoryId: null,
      status: DraftTransactionStatus.ReadyToImport,
    },
    {
      providerTransactionId: "3",
      date: undefined,
      description: undefined,
      from: {
        amount: undefined,
        account: undefined,
      },
      to: {
        amount: undefined,
        account: undefined,
      },
      transactionType: TransactionType.Income,
      transactionCategoryId: null,
      status: DraftTransactionStatus.ReadyToImport,
    },
  ];

  test("updates transaction date", async () => {
    const { result } = renderHook(() =>
      useImmer<DraftTransaction[]>(mockTransactions),
    );
    let [transactions, setTransactions] = result.current;

    render(
      <TestContextProvider>
        <ImportedTransactionsTable
          transactions={transactions}
          setTransactions={setTransactions}
        />
      </TestContextProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Test Transaction 1"),
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Test Transaction 2"),
      ).toBeInTheDocument();
    });

    const dateInput = screen.getByDisplayValue("2023-01-01");
    fireEvent.change(dateInput, { target: { value: "2023-01-03" } });

    [transactions] = result.current;
    await waitFor(() => {
      expect(transactions[0].date).toBe("2023-01-03");
    });
  });

  test("updates transaction description", async () => {
    const { result } = renderHook(() =>
      useImmer<DraftTransaction[]>(mockTransactions),
    );
    let [transactions, setTransactions] = result.current;

    render(
      <TestContextProvider>
        <ImportedTransactionsTable
          transactions={transactions}
          setTransactions={setTransactions}
        />
      </TestContextProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Test Transaction 1"),
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Test Transaction 2"),
      ).toBeInTheDocument();
    });

    const descriptionInput = screen.getByDisplayValue("Test Transaction 1");
    fireEvent.change(descriptionInput, {
      target: { value: "Updated Transaction 1" },
    });

    [transactions] = result.current;
    await waitFor(() => {
      expect(transactions[0].description).toBe("Updated Transaction 1");
    });
  });

  test("updates transaction amount", async () => {
    const { result } = renderHook(() =>
      useImmer<DraftTransaction[]>(mockTransactions),
    );
    let [transactions, setTransactions] = result.current;

    render(
      <TestContextProvider>
        <ImportedTransactionsTable
          transactions={transactions}
          setTransactions={setTransactions}
        />
      </TestContextProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Test Transaction 1"),
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Test Transaction 2"),
      ).toBeInTheDocument();
    });

    const amountInput = screen.getByDisplayValue("100.00");
    fireEvent.change(amountInput, { target: { value: "150.00" } });

    [transactions] = result.current;
    await waitFor(() => {
      expect(transactions[0].from.amount).toBe(150);
      expect(transactions[0].to.amount).toBe(150);
    });
  });

  test("updates transaction category", async () => {
    const { result } = renderHook(() =>
      useImmer<DraftTransaction[]>(mockTransactions),
    );
    let [transactions, setTransactions] = result.current;

    render(
      <TestContextProvider>
        <ImportedTransactionsTable
          transactions={transactions}
          setTransactions={setTransactions}
        />
      </TestContextProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Test Transaction 1"),
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Test Transaction 2"),
      ).toBeInTheDocument();
    });

    const categorySelect = screen.getAllByText("(None)")[0];
    fireEvent.click(categorySelect);
    fireEvent.click(
      screen.getByText("- Subcategory 1-1", { selector: "span" }),
    );

    [transactions] = result.current;
    await waitFor(() => {
      expect(transactions[0].transactionCategoryId).toBe("CATEGORY_1_1");
    });
  });

  test("updates transaction type", async () => {
    const { result } = renderHook(() =>
      useImmer<DraftTransaction[]>(mockTransactions),
    );
    let [transactions, setTransactions] = result.current;

    render(
      <TestContextProvider>
        <ImportedTransactionsTable
          transactions={transactions}
          setTransactions={setTransactions}
        />
      </TestContextProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Test Transaction 1"),
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Test Transaction 2"),
      ).toBeInTheDocument();
    });

    expect(transactions[0].transactionType).toBe(TransactionType.Transfer);

    const typeSelect = screen.getByText("Transfer");
    fireEvent.click(typeSelect);
    fireEvent.click(screen.getAllByText("Expense")[1]);

    [transactions] = result.current;
    await waitFor(() => {
      expect(transactions[0].transactionType).toBe(TransactionType.Expense);
    });
  });
});
