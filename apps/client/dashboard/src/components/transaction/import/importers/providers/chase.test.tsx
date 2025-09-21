import { describe, test, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestContextProvider } from "@/utils/tests/contexts";
import { useProfile } from "@/hooks/use-profile";
import { useState } from "react";
import { ChaseCardImporter } from "./chase";

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
    ["09/12/2025", "09/14/2025", "MERCHANT 1", "Shopping", "Sale", "-21.45", ""],
    ["09/12/2025", "09/14/2025", "MERCHANT 2", "Food & Drink", "Return", "25.00", ""],
    ["08/01/2025", "08/03/2025", "Payment Thank You-Mobile", "", "Payment", "50.00", ""],
  ]
    .map((r) => r.join(","))
    .join("\n");

  const content = `${headers}\n${rows}\n`;
  return new File([content], "chase.csv", { type: "text/csv" });
}

function ImportFormHarness() {
  const { data } = useProfile();
  const importer = data.transactionsImporters[0];
  const [count, setCount] = useState<number | null>(null);

  return (
    <>
      <ChaseCardImporter.ImportForm
        transactionsImporter={importer as any}
        onSuccess={(txs) => setCount(txs.length)}
      />
      <div data-testid="parsed-count">{count ?? "no"}</div>
    </>
  );
}

describe("ChaseCardImporter.ImportForm", () => {
  test("parses CSV and returns transactions via onSuccess", async () => {
    render(
      <TestContextProvider>
        <ImportFormHarness/>
      </TestContextProvider>,
    );

    // Upload CSV
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();
    const file = createChaseCsvFile();
    fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByTestId("parsed-count").textContent).toBe("3");
    });
  });
});
