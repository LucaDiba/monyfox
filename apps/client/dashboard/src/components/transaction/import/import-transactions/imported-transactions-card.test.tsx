import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestContextProvider } from "@/utils/tests/contexts";
import { useImmer } from "use-immer";
import { renderHook } from "@testing-library/react";
import { ImportedTransactionsCard } from "./imported-transactions-card";
import { DraftTransaction, DraftTransactionStatus } from "./utils";
import { TransactionType } from "@/utils/transaction";
import { ulid } from "ulid";
import { toast } from "sonner";

vi.mock("sonner", () => {
  return {
    toast: {
      error: vi.fn(),
      success: vi.fn(),
      message: vi.fn(),
    },
  };
});

function makeTx(
  type: "income" | "expense" | "transfer",
  status: DraftTransactionStatus,
): DraftTransaction {
  const id = ulid();

  let from: DraftTransaction["from"];
  let to: DraftTransaction["to"];

  switch (type) {
    case "income":
      from = {
        amount: 10,
        symbolId: "USD",
        account: { name: "From account" },
      };
      to = { amount: 10, symbolId: "USD", account: { id: "ACCOUNT_1" } };
      break;
    case "expense":
      from = { amount: 10, symbolId: "USD", account: { id: "ACCOUNT_1" } };
      to = { amount: 10, symbolId: "USD", account: { name: "" } };
      break;
    case "transfer":
      from = { amount: 10, symbolId: "USD", account: { id: "ACCOUNT_1" } };
      to = { amount: 10, symbolId: "USD", account: { id: "ACCOUNT_2" } };
      break;
  }

  return {
    providerTransactionId: id,
    date: "2024-01-01",
    description: `Tx ${id}`,
    from,
    to,
    transactionType: type,
    transactionCategoryId: null,
    status,
  };
}

describe("ImportedTransactionsCard", () => {
  let testTransactions: DraftTransaction[];

  beforeEach(() => {
    testTransactions = [
      makeTx(TransactionType.Transfer, DraftTransactionStatus.NeedsReview),
      makeTx(TransactionType.Income, DraftTransactionStatus.ReadyToImport),
      makeTx(TransactionType.Expense, DraftTransactionStatus.ReadyToImport),
      makeTx(
        TransactionType.Expense,
        DraftTransactionStatus.SkippedTemporarily,
      ),
      makeTx(TransactionType.Income, DraftTransactionStatus.SkippedPermanently),
      makeTx(
        TransactionType.Transfer,
        DraftTransactionStatus.SkippedPermanently,
      ),
      makeTx(
        TransactionType.Expense,
        DraftTransactionStatus.SkippedAlreadyImported,
      ),
      makeTx(
        TransactionType.Income,
        DraftTransactionStatus.SkippedAlreadyImported,
      ),
      makeTx(
        TransactionType.Transfer,
        DraftTransactionStatus.SkippedAlreadyImported,
      ),
      makeTx(
        TransactionType.Expense,
        DraftTransactionStatus.SkippedAlreadyImported,
      ),
    ];
  });

  function expectTransactionsToBeInDocument(
    expected: DraftTransaction[],
    isInput: boolean,
  ) {
    const expectedDescriptions = expected.map((tx) => tx.description!);
    const notExpectedDescriptions = testTransactions.filter(
      (tx) => !expectedDescriptions.includes(tx.description!),
    );

    const fn = isInput ? screen.queryByDisplayValue : screen.queryByText;

    for (const tx of expected) {
      expect(fn(tx.description!)).toBeInTheDocument();
    }
    for (const tx of notExpectedDescriptions) {
      expect(fn(tx.description!)).not.toBeInTheDocument();
    }
  }

  test("renders transactions in tabs", async () => {
    const { result } = renderHook(() => useImmer(testTransactions));
    const [transactions, setTransactions] = result.current;

    render(
      <TestContextProvider>
        <ImportedTransactionsCard
          importerId="IMPORTER_1"
          draftTransactions={transactions}
          setDraftTransactions={setTransactions}
          onReset={() => {}}
        />
      </TestContextProvider>,
    );

    screen.getByText("Review needed (1)");
    const importingTab = screen.getByRole("tab", { name: "Importing (2)" });
    const skippingTab = screen.getByRole("tab", { name: "Skipping (3)" });
    const importedTab = screen.getByRole("tab", {
      name: "Previously imported (4)",
    });

    // Review needed
    expectTransactionsToBeInDocument(
      transactions.filter(
        (tx) => tx.status === DraftTransactionStatus.NeedsReview,
      ),
      true,
    );

    // Importing
    fireEvent.mouseDown(importingTab);
    await waitFor(() => {
      expectTransactionsToBeInDocument(
        transactions.filter(
          (tx) => tx.status === DraftTransactionStatus.ReadyToImport,
        ),
        true,
      );
    });

    // Skipping
    fireEvent.mouseDown(skippingTab);
    await waitFor(() => {
      expectTransactionsToBeInDocument(
        transactions.filter(
          (tx) =>
            tx.status === DraftTransactionStatus.SkippedTemporarily ||
            tx.status === DraftTransactionStatus.SkippedPermanently,
        ),
        true,
      );
    });

    // Previously imported
    fireEvent.mouseDown(importedTab);
    await waitFor(() => {
      expectTransactionsToBeInDocument(
        transactions.filter(
          (tx) => tx.status === DraftTransactionStatus.SkippedAlreadyImported,
        ),
        false,
      );
    });
  });

  test("shows error toast when trying to import with transactions needing review", async () => {
    const { result } = renderHook(() => useImmer(testTransactions));
    const [transactions, setTransactions] = result.current;

    render(
      <TestContextProvider>
        <ImportedTransactionsCard
          importerId="IMPORTER_1"
          draftTransactions={transactions}
          setDraftTransactions={setTransactions}
          onReset={() => {}}
        />
      </TestContextProvider>,
    );

    const importBtn = screen.getByRole("button", { name: /import/i });
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        `Please review all the transactions in the "Review needed" section.`,
      );
    });
  });

  test("Import button imports ready transactions and updates statuses", async () => {
    const { result } = renderHook(() =>
      useImmer(
        testTransactions.filter(
          (t) => t.status === DraftTransactionStatus.ReadyToImport,
        ),
      ),
    );
    let [transactions, setTransactions] = result.current;

    render(
      <TestContextProvider>
        <ImportedTransactionsCard
          importerId="IMPORTER_1"
          draftTransactions={transactions}
          setDraftTransactions={setTransactions}
          onReset={() => {}}
        />
      </TestContextProvider>,
    );

    expect(screen.getByText("Importing (2)")).toBeInTheDocument();
    expect(screen.getByText("Previously imported (0)")).toBeInTheDocument();

    const importBtn = screen.getByRole("button", { name: /import/i });
    fireEvent.click(importBtn);

    await waitFor(() => {
      // Pull the latest state
      [transactions] = result.current;

      // All ready ones should become previously imported
      expect(
        transactions.every(
          (t) => t.status === DraftTransactionStatus.SkippedAlreadyImported,
        ),
      ).toBe(true);
    });
  });

  test("imported transactions are moved between tabs", async () => {
    render(
      <TestImportedTransactionsCard
        initial={testTransactions.filter(
          (t) => t.status === DraftTransactionStatus.ReadyToImport,
        )}
      />,
    );

    expect(screen.getByText("Importing (2)")).toBeInTheDocument();
    expect(screen.getByText("Previously imported (0)")).toBeInTheDocument();

    const importBtn = screen.getByRole("button", { name: /import/i });
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(screen.getByText("Importing (0)")).toBeInTheDocument();
      expect(screen.getByText("Previously imported (2)")).toBeInTheDocument();
    });
  });

  test("Skip all button marks all transactions in review as temporarily skipped", async () => {
    const { result } = renderHook(() => useImmer(testTransactions));
    let [transactions, setTransactions] = result.current;

    render(
      <TestContextProvider>
        <ImportedTransactionsCard
          importerId="IMPORTER_1"
          draftTransactions={transactions}
          setDraftTransactions={setTransactions}
          onReset={() => {}}
        />
      </TestContextProvider>,
    );

    expectTransactionsStatus(
      {
        [testTransactions[0].providerTransactionId]:
          DraftTransactionStatus.NeedsReview,
        [testTransactions[1].providerTransactionId]:
          DraftTransactionStatus.ReadyToImport,
        [testTransactions[2].providerTransactionId]:
          DraftTransactionStatus.ReadyToImport,
        [testTransactions[3].providerTransactionId]:
          DraftTransactionStatus.SkippedTemporarily,
        [testTransactions[4].providerTransactionId]:
          DraftTransactionStatus.SkippedPermanently,
        [testTransactions[5].providerTransactionId]:
          DraftTransactionStatus.SkippedPermanently,
        [testTransactions[6].providerTransactionId]:
          DraftTransactionStatus.SkippedAlreadyImported,
        [testTransactions[7].providerTransactionId]:
          DraftTransactionStatus.SkippedAlreadyImported,
        [testTransactions[8].providerTransactionId]:
          DraftTransactionStatus.SkippedAlreadyImported,
        [testTransactions[9].providerTransactionId]:
          DraftTransactionStatus.SkippedAlreadyImported,
      },
      transactions,
    );

    const skipAllBtn = screen.getByRole("button", { name: /skip all/i });
    fireEvent.click(skipAllBtn);

    await waitFor(() => {
      // Pull the latest state
      [transactions] = result.current;

      expectTransactionsStatus(
        {
          [testTransactions[0].providerTransactionId]:
            DraftTransactionStatus.SkippedTemporarily,
          [testTransactions[1].providerTransactionId]:
            DraftTransactionStatus.ReadyToImport,
          [testTransactions[2].providerTransactionId]:
            DraftTransactionStatus.ReadyToImport,
          [testTransactions[3].providerTransactionId]:
            DraftTransactionStatus.SkippedTemporarily,
          [testTransactions[4].providerTransactionId]:
            DraftTransactionStatus.SkippedPermanently,
          [testTransactions[5].providerTransactionId]:
            DraftTransactionStatus.SkippedPermanently,
          [testTransactions[6].providerTransactionId]:
            DraftTransactionStatus.SkippedAlreadyImported,
          [testTransactions[7].providerTransactionId]:
            DraftTransactionStatus.SkippedAlreadyImported,
          [testTransactions[8].providerTransactionId]:
            DraftTransactionStatus.SkippedAlreadyImported,
          [testTransactions[9].providerTransactionId]:
            DraftTransactionStatus.SkippedAlreadyImported,
        },
        transactions,
      );
    });
  });

  test("shows no transactions message when empty", () => {
    render(<TestImportedTransactionsCard initial={[]} />);

    expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
    expect(screen.queryByText(/Review needed/i)).not.toBeInTheDocument();
  });
});

function TestImportedTransactionsCard({
  initial,
}: {
  initial: DraftTransaction[];
}) {
  const [transactions, setTransactions] = useImmer(initial);
  return (
    <TestContextProvider>
      <ImportedTransactionsCard
        importerId="IMPORTER_1"
        draftTransactions={transactions}
        setDraftTransactions={setTransactions}
        onReset={() => {}}
      />
    </TestContextProvider>
  );
}

function expectTransactionsStatus(
  idToExpectedStatus: { [key: string]: DraftTransactionStatus },
  transactions: DraftTransaction[],
) {
  for (const tx of transactions) {
    expect(tx.status).toBe(idToExpectedStatus[tx.providerTransactionId]);
  }
}
