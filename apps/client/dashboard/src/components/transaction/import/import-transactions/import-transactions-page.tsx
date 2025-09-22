import { ReactNode } from "react";
import { useImmer } from "use-immer";
import { ImportedTransactionsCard } from "./imported-transactions-card";
import { useProfile } from "@/hooks/use-profile";
import {
  ChaseCardImporter,
  ChaseAccountImporter,
} from "../importers/providers/chase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DraftTransaction, DraftTransactionStatus } from "./utils";
import { ParsedTransaction } from "@monyfox/client-transactions-importer";
import { needsReview } from "@/utils/imported-transaction";

export function ImportTransactionsPage({ importerId }: { importerId: string }) {
  const {
    data: { transactionsImporters },
    getImportedTransaction,
    getAccount,
  } = useProfile();
  const [draftTransactions, setDraftTransactions] = useImmer<
    DraftTransaction[]
  >([]);

  function onImport(parsedTransactions: ParsedTransaction[]) {
    const draftTransactions = parsedTransactions.map((pt) => {
      let status = DraftTransactionStatus.ReadyToImport;

      if (getImportedTransaction(pt.providerTransactionId) !== null) {
        status = DraftTransactionStatus.SkippedAlreadyImported;
      } else if (needsReview(pt, getAccount)) {
        status = DraftTransactionStatus.NeedsReview;
      }

      return {
        ...pt,
        status,
      };
    });

    setDraftTransactions(draftTransactions);
  }

  const transactionsImporter = transactionsImporters.find(
    (ti) => ti.id === importerId,
  );

  if (!transactionsImporter) {
    return (
      <Alert>
        <AlertDescription>Importer not found</AlertDescription>
      </Alert>
    );
  }

  let Form: ReactNode;
  switch (transactionsImporter.data.provider) {
    case "chase-card": {
      Form = (
        <ChaseCardImporter.ImportForm
          transactionsImporter={transactionsImporter}
          onSuccess={onImport}
        />
      );
      break;
    }
    case "chase-account": {
      Form = (
        <ChaseAccountImporter.ImportForm
          transactionsImporter={transactionsImporter}
          onSuccess={onImport}
        />
      );
      break;
    }
  }

  return (
    <>
      {draftTransactions.length === 0 ? (
        Form
      ) : (
        <ImportedTransactionsCard
          importerId={importerId}
          draftTransactions={draftTransactions}
          setDraftTransactions={setDraftTransactions}
          onReset={() => setDraftTransactions([])}
        />
      )}
    </>
  );
}
