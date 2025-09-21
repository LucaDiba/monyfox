import { Link } from "@tanstack/react-router";
import { TransactionsTable } from "./transactions-table";
import { Button } from "../ui/button";
import { AddTransactionButton } from "./transaction-form";
import { useProfile } from "@/hooks/use-profile";

export function TransactionsPage() {
  const {
    user: { id: profileId },
  } = useProfile();

  return (
    <>
      <div className="flex justify-end gap-2 mb-4">
        <Link to="/p/$profileId/transactions/import" params={{ profileId }}>
          <Button variant={"secondary"} title="Import transactions">
            Import
          </Button>
        </Link>
        <AddTransactionButton type="text" />
      </div>
      <TransactionsTable />
    </>
  );
}
