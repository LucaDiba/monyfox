type ImportedTransactionAccountData = {
  amount?: number;
  symbolId?: string;
  account?: { id: string } | { name: string };
};

export type ParsedTransaction = {
  providerTransactionId: string;
  transactionType: "income" | "expense" | "transfer";
  description?: string;
  transactionCategoryId?: string | null;
  date?: string; // ISO date
  from: ImportedTransactionAccountData;
  to: ImportedTransactionAccountData;
};

export interface TransactionsImporter<Input = unknown> {
  getTransactions(data: Input): Promise<ParsedTransaction[]>;
}
