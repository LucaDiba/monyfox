import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionType } from "@/utils/transaction";
import { useProfile } from "@/hooks/use-profile";
import { ArrowRightIcon, CheckIcon, CircleOffIcon } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { createContext, useContext } from "react";
import { Updater } from "use-immer";
import { WritableDraft } from "immer";
import { SelectItemTransactionCategoryWithChildren } from "@/components/settings/transaction-categories/category-select-item";
import { getTransactionCategoriesWithChildren } from "@/utils/transaction-category";
import { DraftTransaction, DraftTransactionStatus } from "./utils";
import { Button } from "@/components/ui/button";
import { needsReview } from "@/utils/imported-transaction";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export function ImportedTransactionsTable({
  transactions,
  setTransactions,
}: {
  transactions: DraftTransaction[];
  setTransactions: Updater<DraftTransaction[]>;
}) {
  function updateTransaction(
    id: string,
    updater: (draft: DraftTransaction) => void,
  ) {
    setTransactions((draft) => {
      const t = draft?.find((t) => t.providerTransactionId === id);
      if (t) {
        updater(t);
      }
    });
  }

  return (
    <ImportedTransactionsContext.Provider
      value={{ transactions, updateTransaction }}
    >
      <DataTable
        data={transactions}
        columns={columns}
        getRowId={(r) => r.providerTransactionId}
      />
    </ImportedTransactionsContext.Provider>
  );
}

type ImportedTransactionsContext = {
  transactions: DraftTransaction[];
  updateTransaction: (
    id: string,
    updater: (draft: WritableDraft<DraftTransaction>) => void,
  ) => void;
};

const ImportedTransactionsContext =
  createContext<ImportedTransactionsContext | null>(null);

const useImportedTransactions = () => {
  const context = useContext(ImportedTransactionsContext);
  if (!context) {
    throw new Error(
      "useImportedTransactions must be used within a ImportedTransactionsProvider",
    );
  }
  return context;
};

function DateCell({ transaction }: { transaction: DraftTransaction }) {
  const { updateTransaction } = useImportedTransactions();

  function onChangeDate(e: React.ChangeEvent<HTMLInputElement>) {
    updateTransaction(transaction.providerTransactionId, (draft) => {
      draft.date = e.target.value;
    });
  }

  return (
    <Input type="date" value={transaction.date ?? ""} onChange={onChangeDate} />
  );
}

function DescriptionCell({ transaction }: { transaction: DraftTransaction }) {
  const {
    data: { accounts },
  } = useProfile();
  const { updateTransaction } = useImportedTransactions();

  function onChangeDescription(e: React.ChangeEvent<HTMLInputElement>) {
    updateTransaction(transaction.providerTransactionId, (draft) => {
      draft.description = e.target.value;
    });
  }

  function onChangeFromAccount(accountId: string) {
    updateTransaction(transaction.providerTransactionId, (draft) => {
      draft.from.account = accountId === "-" ? { name: "" } : { id: accountId };
    });
  }

  function onChangeToAccount(accountId: string) {
    updateTransaction(transaction.providerTransactionId, (draft) => {
      draft.to.account = accountId === "-" ? { name: "" } : { id: accountId };
    });
  }

  const fromAccountId =
    transaction.from.account !== undefined && "id" in transaction.from.account
      ? transaction.from.account.id
      : "-";
  const toAccountId =
    transaction.to.account !== undefined && "id" in transaction.to.account
      ? transaction.to.account.id
      : "-";

  return (
    <>
      <Input
        type="text"
        value={transaction.description ?? ""}
        onChange={onChangeDescription}
      />
      {transaction.transactionType === "transfer" && (
        <>
          <br />
          <div className="flex gap-2">
            <div data-slot="form-item" className={"grid gap-2"}>
              <Select value={fromAccountId} onValueChange={onChangeFromAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">N/A</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ArrowRightIcon className="self-center" />
            <div data-slot="form-item" className={"grid gap-2"}>
              <Select value={toAccountId} onValueChange={onChangeToAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">N/A</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function AmountCell({ transaction }: { transaction: DraftTransaction }) {
  const { updateTransaction } = useImportedTransactions();

  function onChangeAmount(e: React.ChangeEvent<HTMLInputElement>) {
    const amount = parseFloat(e.target.value);
    if (isNaN(amount)) {
      return;
    }

    updateTransaction(transaction.providerTransactionId, (draft) => {
      draft.from.amount = amount;
      draft.to.amount = amount;
    });
  }

  return (
    <Input
      type="number"
      step={0.01}
      value={transaction.from?.amount?.toFixed(2) ?? ""}
      onChange={onChangeAmount}
      className="text-right w-[120px]"
    />
  );
}

function CategoryCell({ transaction }: { transaction: DraftTransaction }) {
  const {
    data: { transactionCategories },
  } = useProfile();
  const { updateTransaction } = useImportedTransactions();

  function onChangeCategory(categoryId: string) {
    updateTransaction(transaction.providerTransactionId, (draft) => {
      draft.transactionCategoryId = categoryId === "-" ? null : categoryId;
    });
  }

  const rootCategories = getTransactionCategoriesWithChildren(
    transactionCategories,
  );

  return (
    <Select
      value={transaction.transactionCategoryId ?? "-"}
      onValueChange={onChangeCategory}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="-">(None)</SelectItem>
        {rootCategories.map((cat) => (
          <SelectItemTransactionCategoryWithChildren
            key={cat.id}
            category={cat}
            level={0}
          />
        ))}
      </SelectContent>
    </Select>
  );
}

function TypeCell({ transaction }: { transaction: DraftTransaction }) {
  const { updateTransaction } = useImportedTransactions();

  function onChangeType(value: TransactionType) {
    updateTransaction(transaction.providerTransactionId, (draft) => {
      if (
        (draft.transactionType === "expense" && value === "income") ||
        (draft.transactionType === "income" && value === "expense")
      ) {
        const previousFrom = draft.from;
        draft.from = draft.to;
        draft.to = previousFrom;
      } else if (draft.status !== DraftTransactionStatus.NeedsReview) {
        toast.warning(`Transaction moved to "Review needed" section.`);
        draft.status = DraftTransactionStatus.NeedsReview;
      }

      draft.transactionType = value as DraftTransaction["transactionType"];
    });
  }

  let typeBgColor = "";
  switch (transaction.transactionType) {
    case TransactionType.Income:
      typeBgColor = "bg-green-50";
      break;
    case TransactionType.Expense:
      typeBgColor = "bg-red-50";
      break;
    case TransactionType.Transfer:
      typeBgColor = "bg-blue-50";
      break;
  }

  return (
    <Select value={transaction.transactionType} onValueChange={onChangeType}>
      <SelectTrigger className={typeBgColor}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TransactionType.Expense}>Expense</SelectItem>
        <SelectItem value={TransactionType.Income}>Income</SelectItem>
        <SelectItem value={TransactionType.Transfer}>Transfer</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ActionsCell({ transaction }: { transaction: DraftTransaction }) {
  const { getAccount } = useProfile();
  const { updateTransaction } = useImportedTransactions();

  function onChangeStatus(value: DraftTransactionStatus) {
    updateTransaction(transaction.providerTransactionId, (draft) => {
      draft.status = value;
    });
  }

  function onDoNotSkip() {
    if (needsReview(transaction, getAccount)) {
      onChangeStatus(DraftTransactionStatus.NeedsReview);
    } else {
      onChangeStatus(DraftTransactionStatus.ReadyToImport);
    }
  }

  function onSkip() {
    onChangeStatus(DraftTransactionStatus.SkippedTemporarily);
  }

  function onReviewed() {
    if (needsReview(transaction, getAccount)) {
      toast.error("Please fix the errors before marking as reviewed");
      return;
    }

    onChangeStatus(DraftTransactionStatus.ReadyToImport);
  }

  if (transaction.status === DraftTransactionStatus.SkippedAlreadyImported) {
    return null;
  }

  if (
    transaction.status === DraftTransactionStatus.SkippedTemporarily ||
    transaction.status === DraftTransactionStatus.SkippedPermanently
  ) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            onClick={onDoNotSkip}
            data-testid={"do-not-skip-button"}
          >
            <CircleOffIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Do not skip</TooltipContent>
      </Tooltip>
    );
  }

  if (transaction.status === DraftTransactionStatus.NeedsReview) {
    return (
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={onReviewed}
              data-testid={"mark-reviewed-button"}
            >
              <CheckIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mark as reviewed</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={onSkip}
              data-testid={"skip-button"}
            >
              <CircleOffIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Skip</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          onClick={onSkip}
          data-testid={"skip-button"}
        >
          <CircleOffIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Skip</TooltipContent>
    </Tooltip>
  );
}

const columns: ColumnDef<DraftTransaction>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <DateCell transaction={row.original} />,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <DescriptionCell transaction={row.original} />,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <AmountCell transaction={row.original} />,
  },
  {
    accessorKey: "transactionCategoryId",
    header: "Category",
    cell: ({ row }) => <CategoryCell transaction={row.original} />,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <TypeCell transaction={row.original} />,
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => <ActionsCell transaction={row.original} />,
  },
];
