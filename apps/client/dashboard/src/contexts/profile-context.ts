import { createContext } from "react";
import { LocalDate } from "@js-joda/core";
import type {
  Data,
  Account,
  Transaction,
  TransactionCategory,
  AssetSymbol,
  AssetSymbolExchange,
  Profile,
  ImportedTransaction,
  TransactionsImporter,
} from "@monyfox/common-data";
import { MutationResult } from "./profile-provider";

interface ProfileContextProps {
  user: { id: string; name: string };
  data: Data;
  rawProfile: Profile;

  // Accounts
  getAccount: (accountId: string) => Account;
  createAccount: MutationResult<Account>;
  updateAccount: MutationResult<Account>;
  deleteAccount: MutationResult<string>;
  getTransactionCountByAccount: (accountId: string) => number;
  getBalanceByAccount: (
    accountId: string,
  ) => Array<{ symbolId: string; balance: number }>;

  // Transactions
  getTransaction: (id: string) => Transaction | null;
  createTransaction: MutationResult<Transaction>;
  createTransactions: MutationResult<Transaction[]>;
  updateTransaction: MutationResult<Transaction>;
  deleteTransaction: MutationResult<string>;
  getTransactionsBetweenDates: (
    startDate: LocalDate,
    endDate: LocalDate,
  ) => Transaction[];

  // Transaction categories
  getTransactionCategory: (categoryId: string) => TransactionCategory;
  createTransactionCategory: MutationResult<TransactionCategory>;
  updateTransactionCategory: MutationResult<TransactionCategory>;
  deleteTransactionCategory: MutationResult<string>;
  getTransactionCountByCategory: (categoryId: string) => number;

  // Transaction importers
  createTransactionsImporters: MutationResult<TransactionsImporter[]>;
  updateTransactionsImporter: MutationResult<TransactionsImporter>;
  deleteTransactionsImporter: MutationResult<string>;

  // Imported transactions
  importTransactions: MutationResult<{
    transactions: Transaction[];
    importedTransactions: ImportedTransaction[];
  }>;
  getImportedTransaction: (
    providerTransactionId: string,
  ) => ImportedTransaction | null;

  // Symbols
  getAssetSymbol: (assetSymbolId: string) => AssetSymbol;
  getTransactionCountBySymbol: (symbolId: string) => number;
  createAssetSymbol: MutationResult<AssetSymbol>;
  deleteAssetSymbol: MutationResult<string>;
  createAssetSymbolWithExchange: MutationResult<{
    assetSymbol: AssetSymbol;
    assetSymbolExchange: AssetSymbolExchange;
  }>;
  createAssetSymbolExchange: MutationResult<AssetSymbolExchange>;
  deleteAssetSymbolExchange: MutationResult<string>;
  updateAlphaVantageApiKey: MutationResult<string | null>;
}

export const ProfileContext = createContext<ProfileContextProps | undefined>(
  undefined,
);
