import { ImportTransactionsPage } from "@/components/transaction/import/import-transactions/import-transactions-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/p/$profileId/_profile/transactions/import/importers/$importerId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { importerId } = Route.useParams();

  return <ImportTransactionsPage importerId={importerId} />;
}
