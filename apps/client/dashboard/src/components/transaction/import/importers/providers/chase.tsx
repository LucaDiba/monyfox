import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import React, { useRef } from "react";
import { toast } from "sonner";
import {
  ChaseCardTransactionsImporter,
  type ParsedTransaction,
} from "@monyfox/client-transactions-importer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile } from "@/hooks/use-profile";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ulid } from "ulid";
import { TransactionsImporter } from "@monyfox/common-data";
import { TrashIcon } from "lucide-react";

const ImporterFormSchema = z.object({
  name: z.string(),
  accountId: z.string(),
  symbolId: z.string(),
});
type ImporterForm = z.infer<typeof ImporterFormSchema>;

function CreateForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (e: Error) => void;
}) {
  const {
    data: { accounts, assetSymbols },
    createTransactionsImporters,
  } = useProfile();

  const form = useForm<ImporterForm>({
    resolver: zodResolver(ImporterFormSchema),
  });

  const submit = useMutation({
    mutationFn: async ({ accountId, symbolId, name }: ImporterForm) => {
      await createTransactionsImporters.mutateAsync([
        {
          id: ulid(),
          name: name,
          data: {
            provider: "chase-card",
            defaultAccountId: accountId,
            defaultSymbolId: symbolId,
          },
        },
      ]);
    },
    onSuccess,
    onError,
  });

  function onSubmit(values: ImporterForm) {
    submit.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Create a Chase Credit Card importer</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name of the credit card</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to account</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            <FormField
              control={form.control}
              name="symbolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency" />
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
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" isLoading={submit.isPending}>
              Create
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

function EditForm({
  importer,
  onSuccess,
  onError,
}: {
  importer: TransactionsImporter & { data: { provider: "chase-card" } };
  onSuccess: () => void;
  onError: (e: Error) => void;
}) {
  const {
    data: { accounts, assetSymbols },
    updateTransactionsImporter,
    deleteTransactionsImporter,
  } = useProfile();

  const form = useForm<ImporterForm>({
    resolver: zodResolver(ImporterFormSchema),
    defaultValues: {
      name: importer.name,
      accountId: importer.data.defaultAccountId,
      symbolId: importer.data.defaultSymbolId,
    },
  });

  const submit = useMutation({
    mutationFn: async (input: ImporterForm) => {
      await updateTransactionsImporter.mutateAsync({
        id: importer.id,
        name: input.name,
        data: {
          provider: "chase-card",
          defaultAccountId: input.accountId,
          defaultSymbolId: input.symbolId,
        },
      });
    },
    onSuccess,
    onError,
  });

  function onSubmit(values: ImporterForm) {
    submit.mutate(values);
  }

  function onDelete() {
    deleteTransactionsImporter.mutate(importer.id, {
      onSuccess,
      onError: (e) => {
        console.error(e);
        toast.error(e.message);
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link to account</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
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
          <FormField
            control={form.control}
            name="symbolId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a currency" />
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
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDelete}
              title="Delete"
              isLoading={deleteTransactionsImporter.isPending}
              hideChildren={deleteTransactionsImporter.isPending}
            >
              <TrashIcon />
            </Button>
            <Button type="submit" isLoading={submit.isPending}>
              Update
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

function ImportForm({
  transactionsImporter,
  onSuccess,
}: {
  transactionsImporter: TransactionsImporter & {
    data: { provider: "chase-card" };
  };
  onSuccess: (transactions: ParsedTransaction[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = useMutation({
    mutationFn: async () => {
      const file = fileRef.current?.files?.[0];
      if (file === undefined) {
        throw new Error("No file selected");
      }

      const importer = new ChaseCardTransactionsImporter({
        accountId: transactionsImporter.data.defaultAccountId,
        symbolId: transactionsImporter.data.defaultSymbolId,
      });

      const transactions = await importer.getTransactions(file);
      onSuccess(transactions);
    },
    onError: (e) => {
      console.error(e);
      toast.error(e.message);
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit.mutate();
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Upload your Chase CSV file</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input id="file" type="file" ref={fileRef} />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" isLoading={submit.isPending}>
            Next
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export const ChaseCardImporter = {
  CreateForm,
  EditForm,
  ImportForm,
};
