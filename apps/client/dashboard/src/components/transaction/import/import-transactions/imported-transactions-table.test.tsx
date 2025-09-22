import { TestContextProvider } from "@/utils/tests/contexts";
import { beforeEach, describe, expect, test, vi } from "vitest";
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
import { toast } from "sonner";

vi.mock("sonner");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ImportedTransactionsTable", () => {
  const mockTransactions: DraftTransaction[] = [
    {
      providerTransactionId: "1",
      date: "2023-01-01",
      description: "Test Transaction 1",
      from: {
        amount: 100,
        symbolId: "EUR",
        account: { id: "ACCOUNT_1" },
      },
      to: {
        amount: 100,
        symbolId: "EUR",
        account: { id: "ACCOUNT_2" },
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
        symbolId: "EUR",
        account: { id: "ACCOUNT_1" },
      },
      to: {
        amount: 200,
        symbolId: "EUR",
        account: { name: "" },
      },
      transactionType: TransactionType.Expense,
      transactionCategoryId: null,
      status: DraftTransactionStatus.ReadyToImport,
    },
    {
      providerTransactionId: "3",
      date: "2023-01-03",
      description: "Test Transaction 3",
      from: {
        amount: 200,
        symbolId: "EUR",
        account: { name: "" },
      },
      to: {
        amount: 200,
        symbolId: "EUR",
        account: { id: "ACCOUNT_1" },
      },
      transactionType: TransactionType.Income,
      transactionCategoryId: null,
      status: DraftTransactionStatus.ReadyToImport,
    },
    {
      providerTransactionId: "4",
      date: "2023-01-03",
      description: "Test Transaction 4",
      from: {
        amount: 200,
        symbolId: "EUR",
        account: undefined,
      },
      to: {
        amount: 200,
        symbolId: "EUR",
        account: undefined,
      },
      transactionType: TransactionType.Income,
      transactionCategoryId: null,
      status: DraftTransactionStatus.NeedsReview,
    },
  ];

  async function renderComponent(initialTransactions = mockTransactions) {
    const { result } = renderHook(() =>
      useImmer<DraftTransaction[]>(initialTransactions),
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
      for (const transaction of initialTransactions) {
        screen.getByDisplayValue(transaction.description!);
      }
    });

    return result;
  }

  test("updates transaction date", async () => {
    const result = await renderComponent();

    const dateInput = screen.getByDisplayValue("2023-01-01");
    fireEvent.change(dateInput, { target: { value: "2023-01-03" } });

    await waitFor(() => {
      const [transactions] = result.current;
      expect(transactions[0].date).toBe("2023-01-03");
    });
  });

  test("updates transaction from account", async () => {
    const result = await renderComponent();

    const [transactions] = result.current;
    expect(transactions[0].from.account).toEqual({ id: "ACCOUNT_1" });

    const fromAccountSelect = screen.getByText("Account 1");
    fireEvent.click(fromAccountSelect);
    fireEvent.click(screen.getAllByText("Account 2")[1]);

    await waitFor(() => {
      const [transactions] = result.current;
      expect(transactions[0].from.account).toEqual({ id: "ACCOUNT_2" });
    });
  });

  test("updates transaction to account", async () => {
    const result = await renderComponent();

    const [transactions] = result.current;
    expect(transactions[0].to.account).toEqual({ id: "ACCOUNT_2" });

    const toAccountSelect = screen.getByText("Account 2");
    fireEvent.click(toAccountSelect);
    fireEvent.click(screen.getAllByText("Account 1")[1]);

    await waitFor(() => {
      const [transactions] = result.current;
      expect(transactions[0].to.account).toEqual({ id: "ACCOUNT_1" });
    });
  });

  test("updates transaction description", async () => {
    const result = await renderComponent();

    const descriptionInput = screen.getByDisplayValue("Test Transaction 1");
    fireEvent.change(descriptionInput, {
      target: { value: "Updated Transaction 1" },
    });

    await waitFor(() => {
      const [transactions] = result.current;
      expect(transactions[0].description).toBe("Updated Transaction 1");
    });
  });

  test("updates transaction amount", async () => {
    const result = await renderComponent();

    const amountInput = screen.getByDisplayValue("100.00");
    fireEvent.change(amountInput, { target: { value: "150.00" } });

    await waitFor(() => {
      const [transactions] = result.current;
      expect(transactions[0].from.amount).toBe(150);
      expect(transactions[0].to.amount).toBe(150);
    });
  });

  test("updates transaction category", async () => {
    const result = await renderComponent();

    const categorySelect = screen.getAllByText("(None)")[0];
    fireEvent.click(categorySelect);
    fireEvent.click(
      screen.getByText("- Subcategory 1-1", { selector: "span" }),
    );

    await waitFor(() => {
      const [transactions] = result.current;
      expect(transactions[0].transactionCategoryId).toBe("CATEGORY_1_1");
    });
  });

  test("updates transaction type and updates status when needed", async () => {
    const result = await renderComponent();

    let [transactions] = result.current;
    expect(transactions[0].transactionType).toBe(TransactionType.Transfer);
    expect(transactions[0].status).toBe(DraftTransactionStatus.ReadyToImport);

    const typeSelect = screen.getByText("Transfer");
    fireEvent.click(typeSelect);
    fireEvent.click(screen.getAllByText("Expense")[1]);

    await waitFor(() => {
      [transactions] = result.current;
      expect(transactions[0].transactionType).toBe(TransactionType.Expense);
      // Changing from Transfer -> Expense should move to Review needed
      expect(transactions[0].status).toBe(DraftTransactionStatus.NeedsReview);
      expect(toast.warning).toHaveBeenCalled();
    });
  });

  test("changing Expense ↔ Income swaps from/to but keeps status", async () => {
    const { result } = renderHook(() =>
      useImmer<DraftTransaction[]>([
        {
          providerTransactionId: "X1",
          date: "2023-01-10",
          description: "Expense 1",
          from: { amount: 10, symbolId: "USD", account: { id: "ACCOUNT_1" } },
          to: { amount: 10, symbolId: "USD", account: { name: "Vendor" } },
          transactionType: TransactionType.Expense,
          transactionCategoryId: null,
          status: DraftTransactionStatus.ReadyToImport,
        },
      ]),
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

    // Open type selects and chooses Income
    fireEvent.click(screen.getByText("Expense"));
    fireEvent.click(screen.getAllByText("Income")[0]);

    await waitFor(() => {
      [transactions] = result.current;
      expect(transactions[0].transactionType).toBe(TransactionType.Income);
      // Status should remain ReadyToImport for expense<->income
      expect(transactions[0].status).toBe(DraftTransactionStatus.ReadyToImport);
      // from/to swapped
      const fromHasName = "name" in (transactions[0].from.account as any);
      const toHasId = "id" in (transactions[0].to.account as any);
      expect(fromHasName).toBe(true);
      expect(toHasId).toBe(true);
    });
  });

  describe("Actions cell", () => {
    test("ReadyToImport → Skip sets SkippedTemporarily", async () => {
      const result = await renderComponent([mockTransactions[0]]);

      const skipBtn = screen.getByTestId("skip-button");
      fireEvent.click(skipBtn);

      await waitFor(() => {
        const [transactions] = result.current;
        expect(transactions[0].status).toBe(
          DraftTransactionStatus.SkippedTemporarily,
        );
      });
    });

    test("NeedsReview + invalid → Mark as reviewed shows error and stays NeedsReview", async () => {
      const result = await renderComponent([
        {
          providerTransactionId: "A1",
          date: "2024-01-01",
          description: "Tx",
          from: { amount: 1, account: { id: "ACCOUNT_1" } }, // missing symbolId -> invalid
          to: { amount: 1, symbolId: "USD", account: { name: "Store" } },
          transactionType: TransactionType.Expense,
          transactionCategoryId: null,
          status: DraftTransactionStatus.NeedsReview,
        },
      ]);

      const markReviewedBtn = screen.getByTestId("mark-reviewed-button");
      fireEvent.click(markReviewedBtn);

      await waitFor(() => {
        const [transactions] = result.current;
        expect(transactions[0].status).toBe(DraftTransactionStatus.NeedsReview);
        expect(toast.error).toHaveBeenCalledWith(
          "Please fix the errors before marking as reviewed",
        );
      });
    });

    test("NeedsReview + valid → Mark as reviewed sets ReadyToImport", async () => {
      const result = await renderComponent([
        { ...mockTransactions[0], status: DraftTransactionStatus.NeedsReview },
      ]);

      const markReviewedBtn = screen.getByTestId("mark-reviewed-button");
      fireEvent.click(markReviewedBtn);

      await waitFor(() => {
        const [transactions] = result.current;
        expect(toast.error).not.toHaveBeenCalled();
        expect(transactions[0].status).toBe(
          DraftTransactionStatus.ReadyToImport,
        );
      });
    });

    test("SkippedTemporarily + valid → Do not skip sets ReadyToImport", async () => {
      const result = await renderComponent([
        {
          ...mockTransactions[0],
          status: DraftTransactionStatus.SkippedTemporarily,
        },
      ]);

      const doNotSkipBtn = screen.getByTestId("do-not-skip-button");
      fireEvent.click(doNotSkipBtn);

      await waitFor(() => {
        const [transactions] = result.current;
        expect(transactions[0].status).toBe(
          DraftTransactionStatus.ReadyToImport,
        );
      });
    });

    test("SkippedTemporarily + invalid → Do not skip sets NeedsReview", async () => {
      const result = await renderComponent([
        {
          ...mockTransactions[0],
          date: undefined, // missing date -> invalid
          status: DraftTransactionStatus.SkippedTemporarily,
        },
      ]);

      const doNotSkipBtn = screen.getByTestId("do-not-skip-button");
      fireEvent.click(doNotSkipBtn);

      await waitFor(() => {
        const [transactions] = result.current;
        expect(transactions[0].status).toBe(DraftTransactionStatus.NeedsReview);
      });
    });

    test("SkippedAlreadyImported → no action buttons rendered", async () => {
      await renderComponent([
        {
          ...mockTransactions[0],
          status: DraftTransactionStatus.SkippedAlreadyImported,
        },
      ]);

      expect(
        screen.queryByTestId("do-not-skip-button"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("skip-button")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("mark-reviewed-button"),
      ).not.toBeInTheDocument();
    });
  });
});
