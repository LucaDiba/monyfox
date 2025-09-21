import { z } from "zod";

const TransactionsImporterDataSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("chase-card"),
    defaultAccountId: z.string(),
    defaultSymbolId: z.string(),
  }),
]);

export const TransactionsImporterSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: TransactionsImporterDataSchema,
});

export const ImportedTransactionSchema = z.object({
  id: z.string(), // Provider transaction ID
  importerId: z.string(),
  importedAt: z.iso.datetime(),
  data: z.discriminatedUnion("status", [
    z.object({
      status: z.literal("imported"),
      transactionId: z.string(),
    }),
    z.object({
      status: z.literal("skipped"),
    }),
  ]),
});
