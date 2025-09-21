import { ImportDashboardPage } from "@/components/transaction/import/import-dashboard-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/p/$profileId/_profile/transactions/import/",
)({
  component: ImportDashboardPage,
});
