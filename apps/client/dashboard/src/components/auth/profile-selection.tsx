import { cn } from "@/utils/style";
import { ConfirmationModal, Modal, useModal } from "../ui/modal";
import { type Profile } from "@monyfox/common-data";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { InputWithLabel } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrashIcon } from "lucide-react";
import { ulid } from "ulid";
import { generateTestProfile } from "@/utils/data";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useDatabase } from "@/hooks/use-database";
import { toast } from "sonner";
import { ImportProfileForm } from "./import-profile-form";

export function ProfileSelection({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [parent] = useAutoAnimate();
  const { profiles } = useDatabase();

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            <span className="flex items-center gap-2">
              <img src="/monyfox-logo.png" className="size-10" /> MonyFox
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent ref={parent} className="flex flex-col gap-4">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
          <ManageProfiles />
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const { deleteProfile } = useDatabase();
  const { isOpen, openModal, closeModal } = useModal();
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <CardTitle>{profile.user}</CardTitle>
          <div className="flex gap-2">
            <Link to="/p/$profileId" params={{ profileId: profile.id }}>
              <Button color="primary" variant="default">
                Open
              </Button>
            </Link>
            <Button
              size="icon"
              onClick={openModal}
              variant="outline"
              title="Delete Profile"
            >
              <TrashIcon />
            </Button>
          </div>
          <ConfirmationModal
            isOpen={isOpen}
            onClose={closeModal}
            title="Delete Profile"
            onConfirm={() => {
              deleteProfile.mutate(profile.id, {
                onSuccess: () => {
                  toast.success("Profile deleted successfully");
                  closeModal();
                },
                onError: (e) => {
                  toast.error("Failed to delete profile", {
                    description: e.message,
                  });
                },
              });
            }}
            confirmText="Delete"
            cancelText="Cancel"
            actionButtonVariant="destructive"
          >
            Are you sure you want to delete this profile?
          </ConfirmationModal>
        </div>
      </CardHeader>
    </Card>
  );
}

function ManageProfiles() {
  const { isOpen, openModal, closeModal } = useModal();
  return (
    <div className="flex flex-col items-center">
      <Button onClick={openModal}>Create profile</Button>
      <CreateProfileModal isOpen={isOpen} onClose={closeModal} />
      <hr className="my-4 w-full" />
      <div className="flex justify-center gap-2">
        <ImportProfileButton />
        <CreateTestProfileButton />
      </div>
    </div>
  );
}

function CreateProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { saveProfile } = useDatabase();
  const [profileName, setProfileName] = useState("");
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create profile"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button
            onClick={() => {
              saveProfile.mutate(
                {
                  id: ulid(),
                  user: profileName,
                  data: {
                    encrypted: false,
                    data: {
                      accounts: [
                        {
                          id: ulid(),
                          name: "My Account",
                          isPersonalAsset: true,
                        },
                      ],
                      assetSymbols: [
                        {
                          id: ulid(),
                          code: "EUR",
                          displayName: "EUR",
                          type: "fiat",
                        },
                      ],
                      assetSymbolExchanges: [],
                      assetSymbolExchangersMetadata: { alphavantage: null },
                      transactions: [],
                      transactionCategories: [],
                      transactionsImporters: [],
                      importedTransactions: [],
                      lastUpdated: new Date().toISOString(),
                    },
                  },
                  schemaVersion: "1",
                },
                {
                  onSuccess: () => {
                    toast.success("Profile created");
                    setProfileName("");
                    onClose();
                  },
                  onError: (e) => {
                    toast.error("Failed to create profile", {
                      description: e.message,
                    });
                  },
                },
              );
            }}
            variant="default"
            isLoading={saveProfile.isPending}
          >
            Create
          </Button>
        </div>
      }
    >
      <InputWithLabel
        type="text"
        id="profileName"
        label="Profile Name"
        value={profileName}
        onChange={(e) => setProfileName(e.target.value)}
      />
    </Modal>
  );
}

function CreateTestProfileButton() {
  const { saveProfile } = useDatabase();

  function onClick() {
    const profile = generateTestProfile();
    saveProfile.mutate(profile);
  }

  return (
    <Button
      onClick={onClick}
      variant="secondary"
      isLoading={saveProfile.isPending}
    >
      Create a test profile
    </Button>
  );
}

function ImportProfileButton() {
  const { isOpen, openModal, closeModal } = useModal();

  return (
    <>
      <Button onClick={openModal} variant="secondary">
        Import
      </Button>
      <ImportProfileModal isOpen={isOpen} onClose={closeModal} />
    </>
  );
}

export function ImportProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import"
      description="Import a backup file"
    >
      <ImportProfileForm onClose={onClose} />
    </Modal>
  );
}
