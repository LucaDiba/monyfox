import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserImportersCard } from "./importers/user-importers-card";
import { CreateImporterCard } from "./importers/create-importer-card";

export function ImportDashboardPage() {
  return (
    <div className="space-y-4">
      <HelpAlert />
      <UserImportersCard />
      <CreateImporterCard />
    </div>
  );
}

function HelpAlert() {
  return (
    <Alert>
      <AlertTitle>What are importers and why should I use them?</AlertTitle>
      <AlertDescription>
        Importers allow you to import transactions automatically instead of
        adding each one manually. For example, you can import your debit/credit
        card transactions from your bank, or your stock trades from your
        brokerage.
        <br />
        For each account, you have to create an importer. After that, you can
        import transactions with just a few clicks. For example, you can create
        an importer for your credit card and one for your debit card.
      </AlertDescription>
    </Alert>
  );
}
