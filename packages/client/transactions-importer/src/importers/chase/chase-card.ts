import { format, parse } from "date-fns";
import { ParsedTransaction, TransactionsImporter } from "..";
import { CsvParser } from "../../utils/csv-parser";
import z from "zod";

// (Added spaces between columns to make it easier to read.)
// Transaction Date, Post Date , Description             , Category    , Type   , Amount, Memo
// 09/12/2025      , 09/14/2025, MERCHANT 1              , Shopping    , Return ,  25.00,
// 09/12/2025      , 09/14/2025, MERCHANT 2              , Food & Drink, Sale   , -21.45,
// 09/06/2025      , 09/07/2025, MERCHANT 1              , Shopping    , Sale   , -25.00,
// 08/01/2025      , 08/03/2025, Payment Thank You-Mobile,             , Payment,  50.00,

const RowSchema = z.object({
  "Transaction Date": z.string(),
  "Post Date": z.string(),
  Description: z.string(),
  Category: z.string(),
  Type: z.union([
    z.literal("Sale"),
    z.literal("Return"),
    z.literal("Payment"),
    z.literal("Fee"),
    z.literal("Adjustment"),
  ]),
  Amount: z.string(),
  Memo: z.string(),
});
type Row = z.infer<typeof RowSchema>;

export class ChaseCardTransactionsImporter
  implements TransactionsImporter<File>
{
  private static importerName = "chase-card";

  private accountId: string;
  private symbolId: string;

  constructor({
    accountId,
    symbolId,
  }: {
    accountId: string;
    symbolId: string;
  }) {
    this.accountId = accountId;
    this.symbolId = symbolId;
  }

  async getTransactions(file: File): Promise<ParsedTransaction[]> {
    const csvParser = new CsvParser(RowSchema, { header: true });
    const rows = await csvParser.fromFile(file);
    return rows.map(this.toImportedTransaction, this);
  }

  async getCategories(file: File): Promise<string[]> {
    const csvParser = new CsvParser(RowSchema, { header: true });
    const rows = await csvParser.fromFile(file);

    const categories = new Set<string>();

    rows.forEach((row) => {
      const category = row["Category"];
      if (category !== "") {
        categories.add(category);
      }
    });

    return Array.from(categories);
  }

  private toImportedTransaction(row: Row): ParsedTransaction {
    const merchantAccount = { name: row.Description };
    const date = ChaseCardTransactionsImporter.freedomDateToIso(
      row["Transaction Date"],
    );
    const signedAmount = parseFloat(row.Amount);
    const amount = Math.abs(signedAmount);

    let transactionType: ParsedTransaction["transactionType"];
    let fromAccount: ParsedTransaction["from"]["account"] = undefined;
    let toAccount: ParsedTransaction["from"]["account"] = undefined;

    if (row["Type"] === "Payment") {
      transactionType = "transfer";
    } else {
      if (signedAmount < 0) {
        transactionType = "expense";
        fromAccount = { id: this.accountId };
        toAccount = merchantAccount;
      } else {
        transactionType = "income";
        fromAccount = merchantAccount;
        toAccount = { id: this.accountId };
      }
    }

    return {
      providerTransactionId:
        ChaseCardTransactionsImporter.getProviderTransactionId(row),
      transactionType,
      description: row.Description,
      date: date,
      transactionCategoryId: null,
      from: {
        amount,
        symbolId: this.symbolId,
        account: fromAccount,
      },
      to: {
        amount,
        symbolId: this.symbolId,
        account: toAccount,
      },
    };
  }

  private static getProviderTransactionId(row: Row) {
    return `${this.importerName}-${row["Transaction Date"]}-${row.Amount}-${row.Description}`;
  }

  private static freedomDateToIso(date: string): string {
    return format(parse(date, "MM/dd/yyyy", new Date()), "yyyy-MM-dd");
  }
}
