import { z } from "zod";
import { AccountSchema } from "./schemas/account";
import {
  AssetSymbolSchema,
  AssetSymbolExchangeSchema,
} from "./schemas/asset-symbol";
import { DataSchema, RawDataSchema } from "./schemas/data";
import { ProfileSchema } from "./schemas/profile";
import { TransactionSchema } from "./schemas/transaction";
import { TransactionCategorySchema } from "./schemas/transaction-category";
import {
  ImportedTransactionSchema,
  TransactionsImporterSchema,
} from "./schemas/transactions-importer";

export { AccountSchema } from "./schemas/account";
export type Account = z.infer<typeof AccountSchema>;

export {
  AssetSymbolSchema,
  AssetSymbolExchangeSchema,
  ASSET_SYMBOL_TYPES,
} from "./schemas/asset-symbol";
export type AssetSymbol = z.infer<typeof AssetSymbolSchema>;
export type AssetSymbolExchange = z.infer<typeof AssetSymbolExchangeSchema>;

export { DataSchema, RawDataSchema } from "./schemas/data";
export type Data = z.infer<typeof DataSchema>;
export type RawData = z.infer<typeof RawDataSchema>;

export { ProfileSchema } from "./schemas/profile";
export type Profile = z.infer<typeof ProfileSchema>;

export type Transaction = z.infer<typeof TransactionSchema>;
export { TransactionSchema } from "./schemas/transaction";

export type TransactionCategory = z.infer<typeof TransactionCategorySchema>;
export { TransactionCategorySchema } from "./schemas/transaction-category";

export type TransactionsImporter = z.infer<typeof TransactionsImporterSchema>;
export type ImportedTransaction = z.infer<typeof ImportedTransactionSchema>;
