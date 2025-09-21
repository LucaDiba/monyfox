import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Modal, useModal } from "@/components/ui/modal";
import { useProfile } from "@/hooks/use-profile";
import { TransactionsImporter } from "@monyfox/common-data";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { ChaseCardImporter } from "./providers/chase";

export function Importer({ importer }: { importer: TransactionsImporter }) {
  const {
    user: { id: profileId },
  } = useProfile();
  const { closeModal, openModal, isOpen } = useModal();

  function onSuccess() {
    closeModal();
  }

  function onError(e: Error) {
    console.error(e);
    toast.error(e.message);
  }

  return (
    <>
      <Card>
        <CardContent>
          <CardTitle className="flex justify-between items-center">
            <span>{importer.name}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={openModal}>
                <PencilIcon />
              </Button>
              <Link
                to={"/p/$profileId/transactions/import/importers/$importerId"}
                params={{ profileId, importerId: importer.id }}
              >
                <Button variant="secondary" size="icon">
                  <ArrowRightIcon />
                </Button>
              </Link>
            </div>
          </CardTitle>
        </CardContent>
      </Card>
      <Modal
        title="Edit importer"
        isOpen={isOpen}
        onClose={closeModal}
        description={"Edit the configuration of the importer."}
      >
        {importer.data.provider === "chase-card" && (
          <ChaseCardImporter.EditForm
            importer={importer}
            onSuccess={onSuccess}
            onError={onError}
          />
        )}
      </Modal>
    </>
  );
}
