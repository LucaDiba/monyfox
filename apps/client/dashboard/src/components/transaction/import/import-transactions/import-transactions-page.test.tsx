import { describe, test, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestContextProvider } from "@/utils/tests/contexts";
import { ImportTransactionsPage } from "./import-transactions-page";

function createChaseCsvFile() {
  const headers = [
    "Transaction Date",
    "Post Date",
    "Description",
    "Category",
    "Type",
    "Amount",
    "Memo",
  ].join(",");

  const rows = [
    // Expense (negative amount -> Sale)
    ["09/12/2025", "09/14/2025", "MERCHANT 1", "Shopping", "Sale", "-21.45", ""],
    // Income (positive amount -> Return)
    ["09/12/2025", "09/14/2025", "MERCHANT 2", "Food & Drink", "Return", "25.00", ""],
    // Transfer (Payment)
    ["08/01/2025", "08/03/2025", "Payment Thank You-Mobile", "", "Payment", "50.00", ""],
  ]
    .map((r) => r.join(","))
    .join("\n");

  const content = `${headers}\n${rows}\n`;
  return new File([content], "chase.csv", { type: "text/csv" });
}

describe("ImportTransactionsPage", () => {
  test("shows alert when importer is not found", () => {
    render(
      <TestContextProvider>
        <ImportTransactionsPage importerId="NON_EXISTENT"/>
      </TestContextProvider>,
    );

    expect(screen.getByText("Importer not found")).toBeInTheDocument();
  });

  test("renders real Chase importer form when importer exists", () => {
    render(
      <TestContextProvider>
        <ImportTransactionsPage importerId="IMPORTER_1"/>
      </TestContextProvider>,
    );

    expect(
      screen.getByText("Upload your Chase CSV file"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  test("uploads a CSV, shows imported transactions card with tabs, then can reset", async () => {
    render(
      <TestContextProvider>
        <ImportTransactionsPage importerId="IMPORTER_1"/>
      </TestContextProvider>,
    );

    // Real form is visible
    expect(
      screen.getByText("Upload your Chase CSV file"),
    ).toBeInTheDocument();

    // Select a CSV file and submit
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();
    const file = createChaseCsvFile();
    await waitFor(() => {
      fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });
    });

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // After parsing, the ImportedTransactionsCard should appear
    await waitFor(() => {
      expect(
        screen.getByText("Imported Transactions"),
      ).toBeInTheDocument();
    });

    // Tabs exist (labels include counts, so match by text part)
    expect(screen.getByText(/Review needed/i)).toBeInTheDocument();
    expect(screen.getByText(/Importing/i)).toBeInTheDocument();
    expect(screen.getByText(/Skipping/i)).toBeInTheDocument();
    expect(screen.getByText(/Previously imported/i)).toBeInTheDocument();

    // Click the back icon button (first button in the card header that is not the Import button)
    screen.getByText("Imported Transactions").closest("div");
    const buttons = screen.getAllByRole("button");
    const importButton = screen.getByRole("button", { name: /import/i });
    const backButton = buttons.find((b) => b !== importButton) ?? buttons[0];
    fireEvent.click(backButton);

    // We should be back to the form
    await waitFor(() => {
      expect(
        screen.getByText("Upload your Chase CSV file"),
      ).toBeInTheDocument();
    });
  });
});
