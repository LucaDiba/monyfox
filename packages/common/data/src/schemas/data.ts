import { z } from "zod";
import { AccountSchema } from "./account";
import { TransactionSchema } from "./transaction";
import {
  AssetSymbolExchangersMetadataSchema,
  AssetSymbolExchangeSchema,
  AssetSymbolSchema,
} from "./asset-symbol";
import { TransactionCategorySchema } from "./transaction-category";
import {
  ImportedTransactionSchema,
  TransactionsImporterSchema,
} from "./transactions-importer";

export const DataSchema = z.object({
  accounts: z.array(AccountSchema),
  transactions: z.array(TransactionSchema),
  transactionCategories: z.array(TransactionCategorySchema),
  transactionsImporters: z.array(TransactionsImporterSchema).default([]),
  importedTransactions: z.array(ImportedTransactionSchema).default([]),
  assetSymbols: z.array(AssetSymbolSchema),
  assetSymbolExchanges: z.array(AssetSymbolExchangeSchema),
  assetSymbolExchangersMetadata: AssetSymbolExchangersMetadataSchema,

  lastUpdated: z.iso.datetime(),
});

export const RawDataSchema = z.discriminatedUnion("encrypted", [
  z.object({
    encrypted: z.literal(true),
    data: z.string(),
  }),
  z.object({
    encrypted: z.literal(false),
    data: DataSchema,
  }),
]);
