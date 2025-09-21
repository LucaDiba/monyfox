import { useProfile } from "@/hooks/use-profile";
import { formatCurrency } from "@/utils/currency";
import { getTransactionType, TransactionType } from "@/utils/transaction";
import { type Transaction, type Account } from "@monyfox/common-data";
import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { ArrowRightIcon, PencilIcon, TriangleAlert } from "lucide-react";
import { useModal } from "../ui/modal";
import { TransactionFormModal } from "./transaction-form";
import { DataTable } from "../data-table";

type MaybeNonExistentTransaction = Transaction & { nonExistentText?: string };

export function TransactionsTable({
  transactions: transactionsOverride,
}: {
  transactions?: MaybeNonExistentTransaction[];
}) {
  const {
    data: { transactions: reversedTransactions },
    getAccount,
    getTransactionCategory,
  } = useProfile();

  const transactions = transactionsOverride ?? reversedTransactions.reverse();

  const data = useMemo(() => {
    return [...transactions].map((t) => ({
      ...t,
      fromAccountName: getAccountName(t.from, getAccount),
      toAccountName: getAccountName(t.to, getAccount),
      transactionCategoryName:
        t.transactionCategoryId === null
          ? ""
          : getTransactionCategory(t.transactionCategoryId).name,
    }));
  }, [getAccount, getTransactionCategory, reversedTransactions]);

  return <DataTable data={data} columns={columns} getRowId={(r) => r.id} />;
}

function AmountText({ transaction }: { transaction: Transaction }) {
  const { getAccount, getAssetSymbol } = useProfile();
  const transactionType = getTransactionType(transaction, getAccount);
  const fromSymbol = getAssetSymbol(transaction.from.symbolId);
  const toSymbol = getAssetSymbol(transaction.to.symbolId);
  let amount: string;
  if (
    formatCurrency(transaction.from.amount, fromSymbol) !==
    formatCurrency(transaction.to.amount, toSymbol)
  ) {
    amount = `${formatCurrency(transaction.from.amount, fromSymbol)} 🡢 ${formatCurrency(transaction.to.amount, toSymbol)}`;
  } else {
    amount = formatCurrency(transaction.from.amount, fromSymbol);
    if (transactionType === TransactionType.Expense) {
      amount = `(${amount})`;
    }
  }
  return (
    <span
      className={`text-right ${transactionType === TransactionType.Expense ? "text-red-600" : transactionType === TransactionType.Income ? "text-green-700" : ""}`}
    >
      {amount}
    </span>
  );
}

function TransactionActions({
  transaction,
}: {
  transaction: MaybeNonExistentTransaction;
}) {
  const { getAccount } = useProfile();
  const { isOpen, openModal, closeModal } = useModal();

  if (transaction.nonExistentText !== undefined) {
    return (
      <span className="italic text-gray-500">
        {transaction.nonExistentText}
      </span>
    );
  }

  const isUnknown =
    getTransactionType(transaction, getAccount) === TransactionType.Unknown;
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant={isUnknown ? "destructive" : "ghost"}
        size="icon"
        onClick={openModal}
      >
        {isUnknown ? <TriangleAlert /> : <PencilIcon />}
      </Button>
      <TransactionFormModal
        isOpen={isOpen}
        onClose={closeModal}
        transaction={transaction}
      />
    </div>
  );
}

function getAccountName(
  data: {
    amount: number;
    symbolId: string;
    account:
      | {
          id: string;
        }
      | {
          name: string;
        };
  },
  getAccount: (accountId: string) => Account,
) {
  if ("id" in data.account) {
    return getAccount(data.account.id).name;
  }
  return data.account.name;
}

const columns: ColumnDef<
  Transaction & {
    fromAccountName: string;
    toAccountName: string;
    transactionCategoryName: string;
  }
>[] = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <div className="flex items-center justify-center">
  //       <Checkbox
  //         checked={
  //           table.getIsAllPageRowsSelected() ||
  //           (table.getIsSomePageRowsSelected() && "indeterminate")
  //         }
  //         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //         aria-label="Select all"
  //       />
  //     </div>
  //   ),
  //   cell: ({ row }) => (
  //     <div className="flex items-center justify-center">
  //       <Checkbox
  //         checked={row.getIsSelected()}
  //         onCheckedChange={(value) => row.toggleSelected(!!value)}
  //         aria-label="Select row"
  //       />
  //     </div>
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => row.original.accountingDate,
  },
  {
    accessorKey: "account",
    header: "Account",
    cell: ({ row }) => {
      return (
        <span className="flex items-center gap-2">
          {row.original.fromAccountName}
          <ArrowRightIcon size="1em" />
          {row.original.toAccountName}
        </span>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.transactionCategoryName,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <AmountText transaction={row.original} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <TransactionActions transaction={row.original} />,
  },
];
