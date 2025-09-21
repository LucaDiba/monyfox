import { CreateNewImporterPage } from "@/components/transaction/import/importers/create-new-importer-page";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile.ts";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/p/$profileId/_profile/transactions/import/importers/new/$importerType",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { importerType } = Route.useParams();
  const {
    user: { id: profileId },
  } = useProfile();
  const navigate = useNavigate();

  function onSuccess() {
    toast.success("Importer created");
    navigate({
      to: "/p/$profileId/transactions/import",
      params: { profileId },
    });
  }

  return (
    <CreateNewImporterPage importerType={importerType} onSuccess={onSuccess} />
  );
}
