import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountsBalance } from "@/components/accounts-balance";
import { TransactionsTable } from "@/components/transaction/transactions-table";
import { AddTransactionButton } from "@/components/transaction/transaction-form";
import { useAssetSymbolExchangeRate } from "@/hooks/use-asset-symbol-exchange-rate";
import { Spinner } from "@/components/ui/spinner";
import { DestructiveAlert } from "@/components/ui/alert";
import { ChartExpenseByCategory } from "@/components/charts/chart-expense-by-category";
import { Button } from "./ui/button";
import { ImportIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";

export function DashboardPage() {
  const {
    user: { id: profileId },
  } = useProfile();
  const { isLoading, error } = useAssetSymbolExchangeRate();

  return (
    <div className="flex flex-wrap -mx-2 gap-y-4 pb-12">
      {isLoading && (
        <div className="w-full px-2 flex justify-center gap-2">
          <Spinner size="small" />
          <span className="text-center">Loading exchange rates...</span>
        </div>
      )}
      {error && (
        <DestructiveAlert title="Error loading exchange rates">
          The exchange rates could not be loaded. Numbers may not be accurate.
          <br />
          {error}
        </DestructiveAlert>
      )}
      <div className="w-full md:w-3/6 px-2">
        <ChartExpenseByCategory />
      </div>
      <div className="w-full md:w-3/6 px-2">
        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountsBalance />
          </CardContent>
        </Card>
      </div>
      <div className="w-full px-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div>Transactions</div>
              <div className="flex justify-end gap-2">
                <Link
                  to="/p/$profileId/transactions/import"
                  params={{ profileId }}
                >
                  <Button
                    variant={"secondary"}
                    size={"icon"}
                    title="Import transactions"
                  >
                    <ImportIcon />
                  </Button>
                </Link>
                <AddTransactionButton type="icon" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionsTable />
          </CardContent>
        </Card>
      </div>
      <AddTransactionButton isFloating type="icon" />
    </div>
  );
}
