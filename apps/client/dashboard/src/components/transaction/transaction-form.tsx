import { Link } from "@tanstack/react-router";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationModal, Modal, useModal } from "@/components/ui/modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/use-profile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ulid } from "ulid";
import { LocalDate } from "@js-joda/core";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { DestructiveAlert } from "@/components/ui/alert";
import { type Transaction } from "@monyfox/common-data";
import { getTransactionType, TransactionType } from "@/utils/transaction";
import { getTransactionCategoriesWithChildren } from "@/utils/transaction-category";
import { SelectItemTransactionCategoryWithChildren } from "../settings/transaction-categories/category-select-item";

export function AddTransactionButton({
  isFloating = false,
  type,
}: {
  isFloating?: boolean;
  type: "text" | "icon";
}) {
  const { isOpen, openModal, closeModal } = useModal();

  const buttonClassName = isFloating
    ? "fixed bottom-4 right-4 z-10"
    : undefined;

  const buttonSize = isFloating ? "lg" : type === "icon" ? "icon" : "default";
  const iconClassName = isFloating ? "size-7" : undefined;

  return (
    <>
      <Button onClick={openModal} className={buttonClassName} size={buttonSize}>
        {type === "text" && "New transaction"}
        {type === "icon" && <PlusIcon className={iconClassName} />}
      </Button>
      <TransactionFormModal
        isOpen={isOpen}
        onClose={closeModal}
        transaction={null}
      />
    </>
  );
}

export function TransactionFormModal({
  isOpen,
  onClose,
  transaction,
}: {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}) {
  const { getAccount } = useProfile();

  const [type, setType] = useState<TransactionType>(TransactionType.Expense);

  useEffect(() => {
    if (transaction === null) {
      setType(TransactionType.Expense);
      return;
    }

    setType(getTransactionType(transaction, getAccount));
  }, [isOpen, transaction, getAccount]);

  const title = transaction === null ? "Add transaction" : "Edit transaction";

  if (type === TransactionType.Unknown) {
    console.error("Unknown transaction type", transaction);
    return (
      <Modal
        title={title}
        isOpen={isOpen}
        onClose={onClose}
        footer={
          <>
            {transaction !== null && (
              <DeleteTransactionButton
                transaction={transaction}
                onClose={onClose}
              />
            )}
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </>
        }
      >
        <DestructiveAlert title="Error">
          Unknown transaction type
        </DestructiveAlert>
      </Modal>
    );
  }

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <Tabs defaultValue={type}>
        <TabsList>
          <TabsTrigger
            value="expense"
            onClick={() => setType(TransactionType.Expense)}
          >
            Expense
          </TabsTrigger>
          <TabsTrigger
            value="income"
            onClick={() => setType(TransactionType.Income)}
          >
            Income
          </TabsTrigger>
          <TabsTrigger
            value="transfer"
            onClick={() => setType(TransactionType.Transfer)}
          >
            Transfer
          </TabsTrigger>
        </TabsList>
        <TransactionForm
          type={type}
          onClose={onClose}
          transaction={transaction}
        />
      </Tabs>
    </Modal>
  );
}

const formSchema = z.object({
  description: z.string(),
  fromAccountId: z.string(),
  toAccountId: z.string(),
  // The input is a string, but we need to use number as a number() generic
  // because of https://github.com/react-hook-form/resolvers/issues/799
  // Ideally, we wouldn't specify it at all and leave it unknown
  amount: z.coerce.number<number>().nonnegative(),
  symbolId: z.string(),
  categoryId: z.string(),
  date: z.string().date(),
});

function TransactionForm({
  type,
  onClose,
  transaction,
}: {
  type: TransactionType;
  onClose: () => void;
  transaction: Transaction | null;
}) {
  const {
    user,
    data: { accounts, assetSymbols, transactionCategories },
    createTransaction,
    updateTransaction,
  } = useProfile();
  const defaultAssetSymbol = assetSymbols[0];
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: transaction?.description ?? "",
      // TODO: support different amounts.
      amount: transaction?.from.amount ?? undefined,
      fromAccountId:
        transaction !== null && "id" in transaction.from.account
          ? transaction.from.account.id
          : "",
      toAccountId:
        transaction !== null && "id" in transaction.to.account
          ? transaction.to.account.id
          : "",
      // TODO: support different symbols.
      symbolId: transaction?.from.symbolId ?? defaultAssetSymbol?.id ?? "",
      categoryId: transaction?.transactionCategoryId ?? "-",
      date: transaction?.accountingDate ?? LocalDate.now().toString(),
    },
  });
  const rootCategories = getTransactionCategoriesWithChildren(
    transactionCategories,
  );

  if (defaultAssetSymbol === undefined) {
    return (
      <DestructiveAlert title="No asset symbol found">
        Please create an asset symbol (e.g., a currency like EUR or USD) before
        creating a transaction.
        <br />
        You can do this in the settings page.
      </DestructiveAlert>
    );
  }

  if (accounts.length === 0) {
    return (
      <DestructiveAlert title="No accounts found">
        Please create an account before creating a transaction.
        <br />
        <Link to="/p/$profileId/accounts" params={{ profileId: user.id }}>
          Click here to go to the Accounts page.
        </Link>
      </DestructiveAlert>
    );
  }

  const needFromAccount =
    type === TransactionType.Expense || type === TransactionType.Transfer;
  const needToAccount =
    type === TransactionType.Income || type === TransactionType.Transfer;

  function onSubmit(values: z.infer<typeof formSchema>) {
    let hasErrors = false;
    if (needFromAccount && values.fromAccountId === "") {
      form.setError("fromAccountId", { message: "Please select an account" });
      hasErrors = true;
    }
    if (needToAccount && values.toAccountId === "") {
      form.setError("toAccountId", { message: "Please select an account" });
      hasErrors = true;
    }
    if (hasErrors) {
      return;
    }

    const fn = transaction !== null ? updateTransaction : createTransaction;
    fn.mutate(
      {
        id: transaction?.id ?? ulid(),
        description: values.description,
        transactionCategoryId:
          values.categoryId === "-" ? null : values.categoryId,
        transactionDate: values.date,
        accountingDate: values.date,
        from: {
          amount: values.amount,
          symbolId: values.symbolId,
          account: needFromAccount
            ? {
                id: values.fromAccountId,
              }
            : {
                name: "N/A",
              },
        },
        to: {
          amount: values.amount,
          symbolId: values.symbolId,
          account: needToAccount
            ? {
                id: values.toAccountId,
              }
            : {
                name: "N/A",
              },
        },
      },
      {
        onSuccess: () => {
          onClose();
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex w-full items-center space-x-2">
          <div className="flex-grow">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      autoFocus
                      className="h-24 text-4xl md:text-4xl font-bold"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="symbolId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>&nbsp;</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent {...field}>
                      {assetSymbols.map((symbol) => (
                        <SelectItem key={symbol.id} value={symbol.id}>
                          {symbol.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-4">
          {needFromAccount && (
            <FormField
              control={form.control}
              name="fromAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay from account</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                      <SelectContent {...field}>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {needToAccount && (
            <FormField
              control={form.control}
              name="toAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay to account</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                      <SelectContent {...field}>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent {...field}>
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-2 justify-end">
          {transaction !== null && (
            <DeleteTransactionButton
              transaction={transaction}
              onClose={onClose}
            />
          )}
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}

function DeleteTransactionButton({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const { deleteTransaction } = useProfile();
  const { isOpen, openModal, closeModal } = useModal();
  return (
    <>
      <Button type="button" variant="outline" onClick={openModal}>
        <TrashIcon />
      </Button>
      <ConfirmationModal
        isOpen={isOpen}
        onClose={closeModal}
        title="Delete transaction"
        onConfirm={() => {
          deleteTransaction.mutate(transaction.id, {
            onSuccess: () => {
              toast.success("Transaction deleted successfully");
              closeModal();
              onClose();
            },
            onError: (e) => {
              toast.error("Failed to delete transaction", {
                description: e.message,
              });
            },
          });
        }}
        confirmText="Delete"
        cancelText="Cancel"
        actionButtonVariant="destructive"
        isLoading={deleteTransaction.isPending}
      >
        <span>
          Are you sure you want to delete this transaction? This action cannot
          be undone.
        </span>
      </ConfirmationModal>
    </>
  );
}
