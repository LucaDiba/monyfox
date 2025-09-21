import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ParsedTransaction } from "@monyfox/client-transactions-importer";
import { useProfile } from "@/hooks/use-profile";
import { ArrowLeftIcon } from "lucide-react";
import {
  Alert,
  AlertDescription,
  DestructiveAlert,
} from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Updater } from "use-immer";
import { ulid } from "ulid";
import { ImportedTransactionsTable } from "./imported-transactions-table";
import {
  Transaction,
  ImportedTransaction as ImporterTransactionMetadata,
} from "@monyfox/common-data";
import { TransactionsTable } from "../../transactions-table";
import { toast } from "sonner";
import {
  DraftTransaction,
  DraftTransactionStatus,
  getDraftTransactionsByStatus,
} from "./utils";
import { useMemo } from "react";

export function ImportedTransactionsCard({
  importerId,
  draftTransactions,
  setDraftTransactions,
  onReset,
}: {
  importerId: string;
  draftTransactions: DraftTransaction[];
  setDraftTransactions: Updater<DraftTransaction[]>;
  onReset: () => void;
}) {
  const { importTransactions } = useProfile();

  const transactionsByStatus = useMemo(
    () => getDraftTransactionsByStatus(draftTransactions),
    [draftTransactions],
  );

  function onImport() {
    if (transactionsByStatus[DraftTransactionStatus.NeedsReview].length > 0) {
      toast.error(
        `Please review all the transactions in the "Review needed" section.`,
      );
      return;
    }

    const now = new Date().toISOString();

    let transactions: Transaction[] = [];
    let importedTransactionsMetadata: ImporterTransactionMetadata[] = [];

    transactionsByStatus[DraftTransactionStatus.ReadyToImport].forEach((t) => {
      const transactionId = ulid();

      transactions.push({
        id: transactionId,
        description: t.description ?? "",
        transactionCategoryId: t.transactionCategoryId ?? null,
        transactionDate: t.date ?? new Date().toISOString(),
        accountingDate: t.date ?? new Date().toISOString(),
        from: {
          amount: t.from.amount ?? 0,
          symbolId: t.from.symbolId ?? "",
          account:
            t.from.account !== undefined && "id" in t.from.account
              ? {
                  id: t.from.account.id,
                }
              : {
                  name: t.from.account?.name ?? "N/A",
                },
        },
        to: {
          amount: t.to.amount ?? 0,
          symbolId: t.to.symbolId ?? "",
          account:
            t.to.account !== undefined && "id" in t.to.account
              ? {
                  id: t.to.account.id,
                }
              : {
                  name: t.to.account?.name ?? "N/A",
                },
        },
      });

      importedTransactionsMetadata.push({
        id: t.providerTransactionId,
        importerId,
        importedAt: now,
        data: {
          transactionId: transactionId,
          status: "imported",
        },
      });
    });

    importTransactions.mutate(
      {
        transactions: transactions,
        importedTransactions: importedTransactionsMetadata,
      },
      {
        onSuccess: () =>
          setDraftTransactions((dt) =>
            dt.map((t) => ({
              ...t,
              status:
                t.status === DraftTransactionStatus.ReadyToImport
                  ? DraftTransactionStatus.SkippedAlreadyImported
                  : t.status,
            })),
          ),
      },
    );
  }

  if (draftTransactions.length === 0) {
    return <NoTransactionsAlert onReset={onReset} />;
  }

  const reviewNeededTransactions =
    transactionsByStatus[DraftTransactionStatus.NeedsReview];
  const readyToImportNeededTransactions =
    transactionsByStatus[DraftTransactionStatus.ReadyToImport];
  const skippingTransactions = [
    ...transactionsByStatus[DraftTransactionStatus.SkippedTemporarily],
    ...transactionsByStatus[DraftTransactionStatus.SkippedPermanently],
  ];
  const previouslyImportedTransactions =
    transactionsByStatus[DraftTransactionStatus.SkippedAlreadyImported];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>Imported Transactions</div>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" onClick={onReset}>
              <ArrowLeftIcon />
            </Button>
            <Button
              variant="default"
              onClick={onImport}
              disabled={draftTransactions.length === 0}
              isLoading={importTransactions.isPending}
            >
              Import
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="review-needed">
          <TabsList className="w-full overflow-x-auto justify-start">
            <TabsTrigger value="review-needed">
              Review needed ({reviewNeededTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="ready-to-import">
              Importing ({readyToImportNeededTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="skipping">
              Skipping ({skippingTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="previously-imported">
              Previously imported ({previouslyImportedTransactions.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="review-needed">
            <Alert className="mb-2">
              <AlertDescription>
                These transactions need to be reviewed before they can be
                imported.
              </AlertDescription>
            </Alert>
            {reviewNeededTransactions.length > 0 && (
              <div className="flex justify-end mb-2">
                <SkipAllReviewNeededButton
                  setTransactions={setDraftTransactions}
                />
              </div>
            )}
            <ImportedTransactionsTable
              transactions={reviewNeededTransactions}
              setTransactions={setDraftTransactions}
            />
          </TabsContent>
          <TabsContent value="ready-to-import">
            <Alert className="mb-2">
              <AlertDescription>
                These transactions are ready to be imported. You can still make
                changes to them.
              </AlertDescription>
            </Alert>
            <ImportedTransactionsTable
              transactions={readyToImportNeededTransactions}
              setTransactions={setDraftTransactions}
            />
          </TabsContent>
          <TabsContent value="skipping">
            <Alert className="mb-2">
              <AlertDescription>
                These transactions are being skipped.
              </AlertDescription>
            </Alert>
            <ImportedTransactionsTable
              transactions={skippingTransactions}
              setTransactions={setDraftTransactions}
            />
          </TabsContent>
          <TabsContent value="previously-imported">
            <Alert className="mb-2">
              <AlertDescription>
                These transactions are being skipped because they have been
                imported in the past.
              </AlertDescription>
            </Alert>
            <PreviouslyImportedTransactionsTable
              transactions={previouslyImportedTransactions}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function SkipAllReviewNeededButton({
  setTransactions,
}: {
  setTransactions: Updater<DraftTransaction[]>;
}) {
  function onClick() {
    setTransactions((dt) =>
      dt.map((t) => ({
        ...t,
        status:
          t.status === DraftTransactionStatus.NeedsReview
            ? DraftTransactionStatus.SkippedTemporarily
            : t.status,
      })),
    );
  }

  return (
    <Button onClick={onClick} variant={"secondary"}>
      Skip all
    </Button>
  );
}

function PreviouslyImportedTransactionsTable({
  transactions,
}: {
  transactions: ParsedTransaction[];
}) {
  const { getImportedTransaction, getTransaction } = useProfile();

  function toTransaction(
    t: ParsedTransaction,
  ): Transaction & { nonExistentText?: string } {
    const existingImportedTransaction = getImportedTransaction(
      t.providerTransactionId,
    );

    const existingTransaction =
      existingImportedTransaction &&
      existingImportedTransaction.data.status === "imported"
        ? getTransaction(existingImportedTransaction.data.transactionId)
        : null;

    if (existingTransaction !== null) {
      return existingTransaction;
    } else {
      return {
        id: t.providerTransactionId,
        description: t.description ?? "",
        transactionCategoryId: t.transactionCategoryId ?? null,
        transactionDate: t.date ?? new Date().toISOString(),
        accountingDate: t.date ?? new Date().toISOString(),
        from: {
          amount: t.from.amount ?? 0,
          symbolId: t.from.symbolId ?? "",
          account:
            t.from.account !== undefined && "id" in t.from.account
              ? {
                  id: t.from.account.id,
                }
              : {
                  name: t.from.account?.name ?? "N/A",
                },
        },
        to: {
          amount: t.to.amount ?? 0,
          symbolId: t.to.symbolId ?? "",
          account:
            t.to.account !== undefined && "id" in t.to.account
              ? {
                  id: t.to.account.id,
                }
              : {
                  name: t.to.account?.name ?? "N/A",
                },
        },
        nonExistentText:
          existingImportedTransaction?.data.status === "imported"
            ? "Deleted"
            : existingImportedTransaction?.data.status === "skipped"
              ? "Skipped"
              : "Unknown",
      };
    }
  }

  return <TransactionsTable transactions={transactions.map(toTransaction)} />;
}

function NoTransactionsAlert({ onReset }: { onReset: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Imported Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <DestructiveAlert title="No transactions found">
          No transactions were found in the file. Please check the file and try
          again.
          <br />
          <br />
          <Button onClick={onReset}>Go back</Button>
        </DestructiveAlert>
      </CardContent>
    </Card>
  );
}
