import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfile } from "@/hooks/use-profile";
import { Importer } from "./importer-card";

export function UserImportersCard() {
  const { data } = useProfile();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your importers</CardTitle>
        <CardDescription>
          Select one of the available importers to start importing your
          transactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.transactionsImporters.length === 0 ? (
          <NoImporters />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.transactionsImporters.map((importer) => (
              <Importer key={importer.id} importer={importer} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NoImporters() {
  return (
    <Alert variant="destructive">
      <AlertTitle>No importers found</AlertTitle>
      <AlertDescription>
        You have no importers yet. Please create one below to start importing
        your transactions.
      </AlertDescription>
    </Alert>
  );
}
