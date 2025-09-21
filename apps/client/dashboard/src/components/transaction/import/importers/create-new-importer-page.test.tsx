import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestContextProvider } from "@/utils/tests/contexts";
import { CreateNewImporterPage } from "./create-new-importer-page";
import { useProfile } from "@/hooks/use-profile.ts";

function fillAndSubmitChaseForm() {
  const nameInput = screen.getByLabelText(/Name of the credit card/i);
  fireEvent.change(nameInput, { target: { value: "My Chase" } });

  // Select account
  const accountSelectTrigger = screen.getByText(/Select an account/i);
  fireEvent.click(accountSelectTrigger);
  fireEvent.click(screen.getAllByText("Account 1")[1]);

  // Select currency
  const currencyTrigger = screen.getByText(/Select a currency/i);
  fireEvent.click(currencyTrigger);
  fireEvent.click(screen.getAllByText("USD")[1]);

  const submit = screen.getByText("Create");
  fireEvent.click(submit);
}

describe("CreateNewImporterPage", () => {
  test("unsupported importer type shows alert", () => {
    render(
      <TestContextProvider>
        <CreateNewImporterPage
          importerType="unknown-provider"
          onSuccess={() => {}}
        />
      </TestContextProvider>,
    );

    expect(
      screen.getByText(/Importer type "unknown-provider" not supported/i),
    ).toBeInTheDocument();
  });

  test("chase-card: creates importer and navigates back to dashboard", async () => {
    const onSuccess = vi.fn();
    render(
      <TestContextProvider>
        <PrintImportersForTest />
        <CreateNewImporterPage
          importerType="chase-card"
          onSuccess={onSuccess}
        />
      </TestContextProvider>,
    );
    expect(screen.getByText("Importers:Importer 1.")).toBeInTheDocument();

    // Form visible
    expect(
      screen.getByText("Create a Chase Credit Card importer"),
    ).toBeInTheDocument();

    // Fill and submit
    fillAndSubmitChaseForm();

    // After creation, navigation goes to the dashboard page
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
      expect(
        screen.getByText("Importers:Importer 1,My Chase."),
      ).toBeInTheDocument();
    });
  });
});

function PrintImportersForTest() {
  const {
    data: { transactionsImporters },
  } = useProfile();
  return (
    <div>Importers:{transactionsImporters.map((i) => i.name).join(",")}.</div>
  );
}
