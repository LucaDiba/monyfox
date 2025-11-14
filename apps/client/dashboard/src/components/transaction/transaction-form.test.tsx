import { TestContextProvider } from "@/utils/tests/contexts";
import { describe, expect, test } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { AddTransactionButton, TransactionFormModal } from "./transaction-form";
import { Transaction } from "@monyfox/common-data";
import { TransactionsTable } from "./transactions-table";

test("AddTransactionButton", async () => {
  const { getByRole } = render(
    <TestContextProvider>
      <AddTransactionButton isFloating type="icon" />
    </TestContextProvider>,
  );

  const button = getByRole("button");
  expect(button).toBeInTheDocument();

  fireEvent.click(button);
  await waitFor(() => expect(getByRole("dialog")).toBeInTheDocument());
});

describe("TransactionFormModal", () => {
  test("renders correctly for new transaction", async () => {
    const { getByText } = render(
      <TestContextProvider>
        <TransactionFormModal
          isOpen={true}
          onClose={() => {}}
          transaction={null}
        />
      </TestContextProvider>,
    );

    expect(getByText("Add transaction")).toBeInTheDocument();
    expect(getByText("Expense")).toBeInTheDocument();
    expect(getByText("Income")).toBeInTheDocument();
    expect(getByText("Transfer")).toBeInTheDocument();
  });

  test("renders correctly for editing transaction", async () => {
    const transaction: Transaction = {
      id: "1",
      description: "Test transaction",
      from: {
        amount: 100,
        symbolId: "USD",
        account: { id: "ACCOUNT_1", name: "Account 1" },
      },
      to: {
        amount: 100,
        symbolId: "USD",
        account: { id: "ACCOUNT_2", name: "Account 2" },
      },
      transactionDate: "2023-01-01",
      accountingDate: "2023-01-01",
      transactionCategoryId: null,
    };

    const { getByText } = render(
      <TestContextProvider>
        <TransactionFormModal
          isOpen={true}
          onClose={() => {}}
          transaction={transaction}
        />
      </TestContextProvider>,
    );

    expect(getByText("Edit transaction")).toBeInTheDocument();
    expect(getByText("Expense")).toBeInTheDocument();
    expect(getByText("Income")).toBeInTheDocument();
    expect(getByText("Transfer")).toBeInTheDocument();
  });

  test("handles unknown transaction type", async () => {
    const transaction: Transaction = {
      id: "1",
      description: "Test transaction",
      from: {
        amount: 100,
        symbolId: "USD",
        account: { id: "N/A", name: "Account 1" },
      },
      to: {
        amount: 100,
        symbolId: "USD",
        account: { id: "N/A", name: "Account 2" },
      },
      transactionDate: "2023-01-01",
      accountingDate: "2023-01-01",
      transactionCategoryId: null,
    };

    const { getByText } = render(
      <TestContextProvider>
        <TransactionFormModal
          isOpen={true}
          onClose={() => {}}
          transaction={transaction}
        />
      </TestContextProvider>,
    );

    expect(getByText("Error")).toBeInTheDocument();
    expect(getByText("Unknown transaction type")).toBeInTheDocument();
  });
});

describe("TransactionForm", () => {
  test("renders correctly for expense transaction", async () => {
    const { getByText } = render(
      <TestContextProvider>
        <TransactionFormModal
          isOpen={true}
          onClose={() => {}}
          transaction={null}
        />
      </TestContextProvider>,
    );

    fireEvent.click(getByText("Expense"));
    await waitFor(() =>
      expect(getByText("Pay from account")).toBeInTheDocument(),
    );
    expect(getByText("Description")).toBeInTheDocument();
    expect(getByText("Amount")).toBeInTheDocument();
  });

  test("renders correctly for income transaction", async () => {
    const { getByText } = render(
      <TestContextProvider>
        <TransactionFormModal
          isOpen={true}
          onClose={() => {}}
          transaction={null}
        />
      </TestContextProvider>,
    );

    fireEvent.click(getByText("Income"));
    await waitFor(() =>
      expect(getByText("Pay to account")).toBeInTheDocument(),
    );
    expect(getByText("Description")).toBeInTheDocument();
    expect(getByText("Amount")).toBeInTheDocument();
  });

  test("renders correctly for transfer transaction", async () => {
    const { getByText } = render(
      <TestContextProvider>
        <TransactionFormModal
          isOpen={true}
          onClose={() => {}}
          transaction={null}
        />
      </TestContextProvider>,
    );

    fireEvent.click(getByText("Transfer"));
    await waitFor(() =>
      expect(getByText("Pay from account")).toBeInTheDocument(),
    );
    expect(getByText("Pay to account")).toBeInTheDocument();
    expect(getByText("Description")).toBeInTheDocument();
    expect(getByText("Amount")).toBeInTheDocument();
  });

  test("error - must select a source account", async () => {
    const { getByText, getByLabelText, queryByText } = render(
      <TestContextProvider>
        <TransactionFormModal
          isOpen={true}
          onClose={() => {}}
          transaction={null}
        />
        <TransactionsTable />
      </TestContextProvider>,
    );

    expect(queryByText("Please select an account")).toBeNull();

    await waitFor(() =>
      expect(getByText("Pay from account")).toBeInTheDocument(),
    );

    fireEvent.change(getByLabelText("Description"), {
      target: { value: "Test description" },
    });
    fireEvent.change(getByLabelText("Amount"), { target: { value: "100" } });

    fireEvent.click(getByText("Save"));

    await waitFor(() =>
      expect(getByText("Please select an account")).toBeInTheDocument(),
    );
  });

  test("error - must select a destination account", async () => {
    const { getByText, getAllByText, getByLabelText, queryByText } = render(
      <TestContextProvider>
        <TransactionFormModal
          isOpen={true}
          onClose={() => {}}
          transaction={null}
        />
        <TransactionsTable />
      </TestContextProvider>,
    );

    expect(queryByText("Please select an account")).toBeNull();

    fireEvent.click(getAllByText("Income")[1]);
    await waitFor(() =>
      expect(getByText("Pay to account")).toBeInTheDocument(),
    );

    fireEvent.change(getByLabelText("Description"), {
      target: { value: "Test description" },
    });
    fireEvent.change(getByLabelText("Amount"), { target: { value: "100" } });

    fireEvent.click(getByText("Save"));

    await waitFor(() =>
      expect(getByText("Please select an account")).toBeInTheDocument(),
    );
  });

  test("submits form correctly", async () => {
    const { getByText, getAllByText, getByLabelText, queryByText } = render(
      <TestContextProvider>
        <TransactionFormModal
          isOpen={true}
          onClose={() => {}}
          transaction={null}
        />
        <TransactionsTable />
      </TestContextProvider>,
    );

    expect(queryByText("Test description")).toBeNull();

    await waitFor(() =>
      expect(getByText("Pay from account")).toBeInTheDocument(),
    );

    fireEvent.change(getByLabelText("Description"), {
      target: { value: "Test description" },
    });
    fireEvent.change(getByLabelText("Date"), {
      target: { value: "2025-01-01" },
    });
    fireEvent.change(getByLabelText("Amount"), { target: { value: "100" } });
    fireEvent.click(getByText("Select an account"));
    await waitFor(() => expect(getAllByText("Account 1").length).toBe(2));
    fireEvent.click(getAllByText("Account 1")[1]);
    fireEvent.click(getByText("Save"));

    await waitFor(() =>
      expect(getByText("Test description")).toBeInTheDocument(),
    );
  });
});
