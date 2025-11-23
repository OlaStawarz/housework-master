import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateSpaceStep } from "./CreateSpaceStep";
import { AddTasksFromTemplatesStep } from "./AddTasksFromTemplatesStep";
import type { SpaceDto } from "@/types";

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpaceCreated: () => void;
}

type Step = "create" | "templates";

export function CreateSpaceModal({ isOpen, onClose, onSpaceCreated }: CreateSpaceModalProps) {
  const [step, setStep] = useState<Step>("create");
  const [createdSpace, setCreatedSpace] = useState<SpaceDto | null>(null);

  const handleReset = () => {
    setStep("create");
    setCreatedSpace(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSpaceCreated = (space: SpaceDto) => {
    setCreatedSpace(space);
    console.log(space);

    // Jeśli wybrano typ przestrzeni, przejdź do kroku 2
    if (space.space_type) {
      setStep("templates");
    } else {
      // Jeśli nie wybrano typu, zakończ proces
      handleClose();
      onSpaceCreated();
    }
  };

  const handleTasksFinish = () => {
    handleClose();
    onSpaceCreated();
  };

  const handleTasksSkip = () => {
    handleClose();
    onSpaceCreated();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === "create" ? "Utwórz nową przestrzeń" : "Dodaj zadania"}</DialogTitle>
          <DialogDescription>
            {step === "create"
              ? "Wypełnij podstawowe informacje o przestrzeni."
              : "Wybierz zadania, które chcesz dodać do przestrzeni."}
          </DialogDescription>
        </DialogHeader>

        {step === "create" && <CreateSpaceStep onSuccess={handleSpaceCreated} onCancel={handleClose} />}

        {step === "templates" && createdSpace && createdSpace.space_type && (
          <AddTasksFromTemplatesStep
            spaceId={createdSpace.id}
            spaceType={createdSpace.space_type}
            onFinish={handleTasksFinish}
            onSkip={handleTasksSkip}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
