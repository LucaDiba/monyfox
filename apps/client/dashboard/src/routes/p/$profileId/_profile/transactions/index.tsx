import { TransactionsPage } from "@/components/transaction/transactions-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/p/$profileId/_profile/transactions/")({
  component: TransactionsPage,
});
