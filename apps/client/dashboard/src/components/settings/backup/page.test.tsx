import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { TestContextProvider } from "@/utils/tests/contexts";
import { SettingsBackupPage } from "./page";

/**
 * Ideally we would also test that the file is actually downloaded (currently we
 * only test that the hidden <a> is generated and that it contains the correct
 * data, but that would require to spin up a browser instance for this test,
 * which might not be worth it.
 */

describe("SettingsBackupPage", () => {
  test("renders backup card with button", () => {
    render(
      <TestContextProvider>
        <SettingsBackupPage />
      </TestContextProvider>,
    );

    expect(screen.getByText("Backup")).toBeInTheDocument();
    expect(screen.getByText("Download backup")).toBeInTheDocument();
  });

  test("generates anchor to download backup on button click", async () => {
    const blobUrl = "blob:http://localhost:3000/12345";
    const createElementSpy = vi.spyOn(document, "createElement");
    const createObjectURLMock = vi.fn(() => blobUrl);
    const revokeObjectURLMock = vi.fn();
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;

    render(
      <TestContextProvider>
        <SettingsBackupPage />
      </TestContextProvider>,
    );

    fireEvent.click(screen.getByText("Download backup"));

    await waitFor(() => {
      expect(createElementSpy).toHaveBeenCalledWith("a");
    });

    const anchors = createElementSpy.mock.results.filter(
      (r) => r.value.tagName === "A",
    );
    expect(anchors.length).toBe(1);

    const downloadAnchor = anchors[0];
    expect(downloadAnchor.value.download).toMatch(
      /^monyfox-backup-\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\.json$/,
    );
    expect(downloadAnchor.value.href).toBe(blobUrl);

    expect(createObjectURLMock).toHaveBeenCalledOnce();
    expect(revokeObjectURLMock).toHaveBeenCalledOnce();

    const generatedBlobText =
      // @ts-expect-error - [0].text() exists - source: trust me bro
      (await createObjectURLMock.mock.lastCall[0].text()) as string;
    expect(generatedBlobText).toMatchInlineSnapshot(
      `"{"id":"TEST_PROFILE_ID","user":"TEST_USER","data":{"encrypted":false,"data":{"accounts":[{"id":"ACCOUNT_1","name":"Account 1","isPersonalAsset":true},{"id":"ACCOUNT_2","name":"Account 2","isPersonalAsset":true}],"assetSymbols":[{"id":"EUR","code":"EUR","displayName":"EUR","type":"fiat"},{"id":"USD","code":"USD","displayName":"USD","type":"fiat"},{"id":"CHF","code":"CHF","displayName":"CHF","type":"fiat"},{"id":"MWRD","code":"MWRD","displayName":"MWRD ETF name","type":"stock"}],"assetSymbolExchanges":[],"assetSymbolExchangersMetadata":{"alphavantage":{"apiKey":"TEST_API_KEY"}},"transactions":[{"id":"TRANSACTION_1","description":"Income","transactionDate":"2024-01-01","accountingDate":"2024-01-01","transactionCategoryId":"CATEGORY_1","from":{"account":{"name":"Income"},"amount":950,"symbolId":"EUR"},"to":{"account":{"id":"ACCOUNT_1"},"amount":950,"symbolId":"EUR"}},{"id":"TRANSACTION_2","description":"Expense","transactionDate":"2024-01-01","accountingDate":"2024-01-01","transactionCategoryId":null,"from":{"account":{"id":"ACCOUNT_1"},"amount":23,"symbolId":"EUR"},"to":{"account":{"name":"Expense"},"amount":23,"symbolId":"EUR"}},{"id":"TRANSACTION_3","description":"Income USD","transactionDate":"2024-01-01","accountingDate":"2024-01-01","transactionCategoryId":"CATEGORY_1","from":{"account":{"name":"Income"},"amount":950,"symbolId":"USD"},"to":{"account":{"id":"ACCOUNT_1"},"amount":950,"symbolId":"USD"}}],"transactionCategories":[{"id":"CATEGORY_1","name":"Category 1","parentTransactionCategoryId":null},{"id":"CATEGORY_1_1","name":"Subcategory 1-1","parentTransactionCategoryId":"CATEGORY_1"}],"transactionsImporters":[{"id":"IMPORTER_1","name":"Importer 1","data":{"provider":"chase-card","defaultAccountId":"ACCOUNT_1","defaultSymbolId":"USD"}}],"importedTransactions":[],"lastUpdated":"2024-01-01T00:00:00.000Z"}},"schemaVersion":"1"}"`,
    );
  });
});
