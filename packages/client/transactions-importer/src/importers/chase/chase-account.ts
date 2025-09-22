import { format, parse } from "date-fns";
import { ParsedTransaction, TransactionsImporter } from "..";
import { CsvParser } from "../../utils/csv-parser";
import z from "zod";

const RowSchema = z.object({
  Details: z.union([
    z.literal("CREDIT"),
    z.literal("DEBIT"),
  ]),
  "Posting Date": z.string(),
  Description: z.string(),
  Amount: z.string(),
  Type: z.union([
    z.literal("ACH_CREDIT"),
    z.literal("ACH_DEBIT"),
    z.literal("DEBIT_CARD"),
    z.literal("LOAN_PMT"),
    z.literal("MISC_CREDIT"),
    z.literal("ATM"),
    z.literal("MISC_DEBIT"),
    z.literal("BILLPAY"),
    z.literal("CHASE_TO_PARTNERFI"),
    z.literal("FEE_TRANSACTION"),
    z.literal("CHECK_DEPOSIT"),
    z.literal("PARTNERFI_TO_CHASE"),
  ]),
  Balance: z.string(),
  "Check or Slip #": z.string(),
});
type Row = z.infer<typeof RowSchema>;

export class ChaseAccountTransactionsImporter
  implements TransactionsImporter<File> {
  private static importerName = "chase-account";

  private readonly accountId: string;
  private readonly symbolId: string;

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

  private toImportedTransaction(row: Row): ParsedTransaction {
    const unknownAccount = { name: "" };
    const date = ChaseAccountTransactionsImporter.freedomDateToIso(
      row["Posting Date"],
    );
    const signedAmount = parseFloat(row.Amount);
    const amount = Math.abs(signedAmount);

    let transactionType: ParsedTransaction["transactionType"];
    let fromAccount: ParsedTransaction["from"]["account"] = undefined;
    let toAccount: ParsedTransaction["from"]["account"] = undefined;

    switch (row["Type"]) {
      case "ACH_CREDIT":
      case "MISC_CREDIT":
        transactionType = "income";
        fromAccount = unknownAccount;
        toAccount = { id: this.accountId };
        break;
      case "ACH_DEBIT":
      case "DEBIT_CARD":
      case "FEE_TRANSACTION":
      case "MISC_DEBIT":
        transactionType = "expense";
        fromAccount = { id: this.accountId };
        toAccount = unknownAccount;
        break;
      case "LOAN_PMT":
        transactionType = "transfer";
        fromAccount = { id: this.accountId };
        toAccount = unknownAccount;
        break;
      default:
        // Don't set from and to, so it will be reviewed manually.
        transactionType = "transfer";
    }

    return {
      providerTransactionId:
        ChaseAccountTransactionsImporter.getProviderTransactionId(row),
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
    return `${this.importerName}-${row["Posting Date"]}-${row.Amount}-${row.Description}`;
  }

  private static freedomDateToIso(date: string): string {
    return format(parse(date, "MM/dd/yyyy", new Date()), "yyyy-MM-dd");
  }
}
