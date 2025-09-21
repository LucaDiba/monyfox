import { SidebarProvider } from "@/components/ui/sidebar";
import { AssetSymbolExchangeRateProvider } from "@/contexts/asset-symbol-exchange-rate-provider";
import { ProfileProvider } from "@/contexts/profile-provider";
import { SettingsProvider } from "@/contexts/settings-provider";
import {
  type TransactionCategory,
  type Profile,
  TransactionsImporter,
} from "@monyfox/common-data";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { ReactNode, useState } from "react";
import { getTestRouter } from "./router";
import { DatabaseContext } from "@/contexts/database-context";
import { type ExchangeRateDb } from "@/database/database";

export function TestDatabaseProvider({
  children,
  withEncryptedData = false,
  withInvalidSchema = false,
  withInvalidData = false,
  withTransactions = true,
  withOptionalField = false,
  withFiat = true,
  withStocks = true,
}: {
  children: ReactNode;
  withEncryptedData?: boolean;
  withInvalidSchema?: boolean;
  withInvalidData?: boolean;
  withTransactions?: boolean;
  withOptionalField?: boolean;
  withFiat?: boolean;
  withStocks?: boolean;
}) {
  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: "TEST_PROFILE_ID",
      user: "TEST_USER",
      data: withEncryptedData
        ? {
          encrypted: true,
          data: "ENCRYPTED_DATA",
        }
        : {
          encrypted: false,
          data: {
            accounts: [
              {
                id: "ACCOUNT_1",
                name: "Account 1",
                isPersonalAsset: true,
              },
              {
                id: "ACCOUNT_2",
                name: "Account 2",
                isPersonalAsset: true,
              },
            ],
            assetSymbols: [
              ...(withFiat
                ? [
                  {
                    id: "EUR",
                    code: "EUR",
                    displayName: "EUR",
                    type: "fiat" as const,
                  },
                  {
                    id: "USD",
                    code: "USD",
                    displayName: "USD",
                    type: "fiat" as const,
                  },
                  {
                    id: "CHF",
                    code: "CHF",
                    displayName: "CHF",
                    type: "fiat" as const,
                  },
                ]
                : []),
              ...(withStocks
                ? [
                  {
                    id: "MWRD",
                    code: "MWRD",
                    displayName: "MWRD ETF name",
                    type: "stock" as const,
                  },
                ]
                : []),
            ],
            assetSymbolExchanges: [],
            assetSymbolExchangersMetadata: {
              alphavantage: withStocks ? { apiKey: "TEST_API_KEY" } : null,
            },
            transactions: withTransactions
              ? [
                {
                  id: "TRANSACTION_1",
                  description: "Income",
                  transactionDate: "2024-01-01",
                  accountingDate: "2024-01-01",
                  transactionCategoryId: "CATEGORY_1",
                  from: {
                    account: { name: "Income" },
                    amount: 950,
                    symbolId: "EUR",
                  },
                  to: {
                    account: { id: "ACCOUNT_1" },
                    amount: 950,
                    symbolId: "EUR",
                  },
                },
                {
                  id: "TRANSACTION_2",
                  description: "Expense",
                  transactionDate: "2024-01-01",
                  accountingDate: "2024-01-01",
                  transactionCategoryId: null,
                  from: {
                    account: { id: "ACCOUNT_1" },
                    amount: 23,
                    symbolId: "EUR",
                  },
                  to: {
                    account: { name: "Expense" },
                    amount: 23,
                    symbolId: "EUR",
                  },
                },
                {
                  id: "TRANSACTION_3",
                  description: "Income USD",
                  transactionDate: "2024-01-01",
                  accountingDate: "2024-01-01",
                  transactionCategoryId: "CATEGORY_1",
                  from: {
                    account: { name: "Income" },
                    amount: 950,
                    symbolId: "USD",
                  },
                  to: {
                    account: { id: "ACCOUNT_1" },
                    amount: 950,
                    symbolId: "USD",
                  },
                },
              ]
              : [],
            transactionCategories: withInvalidSchema
              ? // @ts-expect-error - Invalid schema
              (null as TransactionCategory[])
              : [
                {
                  id: "CATEGORY_1",
                  name: "Category 1",
                  parentTransactionCategoryId: withInvalidData
                    ? "CATEGORY_1_1" // Cyclic dependency for invalid data
                    : null,
                },
                {
                  id: "CATEGORY_1_1",
                  name: "Subcategory 1-1",
                  parentTransactionCategoryId: "CATEGORY_1",
                },
              ],
            transactionsImporters: withOptionalField
              ? // @ts-expect-error - Invalid schema
              (undefined as TransactionsImporter[])
              : [
                {
                  id: "IMPORTER_1",
                  name: "Importer 1",
                  data: {
                    provider: "chase-card",
                    defaultAccountId: "ACCOUNT_1",
                    defaultSymbolId: "USD",
                  },
                },
              ],
            importedTransactions: [],
            lastUpdated: "2024-01-01T00:00:00.000Z",
          },
        },
      schemaVersion: "1",
    },
  ]);

  const saveProfile = useMutation({
    mutationFn: async (profile: Profile) => {
      setProfiles((p) => {
        const index = p.findIndex((p) => p.id === profile.id);
        if (index === -1) {
          return [...p, profile];
        }
        return p.map((p, i) => (i === index ? profile : p));
      });
    },
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      setProfiles((p) => p.filter((profile) => profile.id !== id));
    },
  });

  const [exchangeRates] = useState<ExchangeRateDb[]>([]);

  const saveExchangeRatesAsync = async () => {
    // No-op: calling this function does not change the state.
  };

  return (
    <DatabaseContext.Provider
      value={{
        profiles,
        saveProfile,
        deleteProfile,
        exchangeRates,
        saveExchangeRatesAsync,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export function TestQueryClientProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function TestContextProvider({
  children,
  profileId = "TEST_PROFILE_ID",
  withEncryptedData = false,
  withInvalidSchema = false,
  withInvalidData = false,
  withTransactions = true,
  withOptionalField = false,
  withFiat = true,
  withStocks = true,
}: {
  children: ReactNode;
  profileId?: string;
  withEncryptedData?: boolean;
  withInvalidSchema?: boolean;
  withInvalidData?: boolean;
  withTransactions?: boolean;
  withOptionalField?: boolean;
  withFiat?: boolean;
  withStocks?: boolean;
}) {
  const router = getTestRouter(() => (
    <TestQueryClientProvider>
      <TestDatabaseProvider
        withEncryptedData={withEncryptedData}
        withInvalidSchema={withInvalidSchema}
        withInvalidData={withInvalidData}
        withTransactions={withTransactions}
        withOptionalField={withOptionalField}
        withFiat={withFiat}
        withStocks={withStocks}
      >
        <ProfileProvider profileId={profileId}>
          <AssetSymbolExchangeRateProvider>
            <SettingsProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </SettingsProvider>
          </AssetSymbolExchangeRateProvider>
        </ProfileProvider>
      </TestDatabaseProvider>
    </TestQueryClientProvider>
  ));

  return <RouterProvider router={router} />;
}
