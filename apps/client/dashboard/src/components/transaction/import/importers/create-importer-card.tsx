import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfile } from "@/hooks/use-profile";
import { TransactionsImporter } from "@monyfox/common-data";
import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

export function CreateImporterCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create new importer</CardTitle>
        <CardDescription>
          Select one of the available importers to create a new importer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CreateImporterLink name="Chase" importerType="chase-card"/>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateImporterLink({
  name,
  importerType,
}: {
  name: string;
  importerType: TransactionsImporter["data"]["provider"];
}) {
  const {
    user: { id: profileId },
  } = useProfile();

  return (
    <Card>
      <CardContent>
        <CardTitle className="flex justify-between items-center">
          <span>{name}</span>
          <Link
            to={"/p/$profileId/transactions/import/importers/new/$importerType"}
            params={{ profileId, importerType }}
          >
            <Button variant="secondary" size="icon" title={`Create ${name} importer`}>
              <PlusIcon/>
            </Button>
          </Link>
        </CardTitle>
      </CardContent>
    </Card>
  );
}
