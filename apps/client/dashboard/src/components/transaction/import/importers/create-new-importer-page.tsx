import { toast } from "sonner";
import { ChaseCardImporter } from "./providers/chase";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreateNewImporterPage({
  importerType,
  onSuccess,
}: {
  importerType: string;
  onSuccess: () => void;
}) {
  function onError(e: Error) {
    console.error(e);
    toast.error(e.message);
  }

  if (importerType === "chase-card") {
    return (
      <ChaseCardImporter.CreateForm onSuccess={onSuccess} onError={onError} />
    );
  }

  return (
    <Alert variant="destructive">
      <AlertDescription>
        Importer type "{importerType}" not supported
      </AlertDescription>
    </Alert>
  );
}
