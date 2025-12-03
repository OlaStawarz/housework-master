import { ConfirmDialog } from "./ConfirmDialog";

interface ConfirmDeleteTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  taskName: string;
  isDeleting: boolean;
}

export function ConfirmDeleteTaskDialog({
  isOpen,
  onClose,
  onConfirm,
  taskName,
  isDeleting,
}: ConfirmDeleteTaskDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Czy na pewno chcesz usunąć zadanie: ${taskName}?`}
      description="Ta operacja jest nieodwracalna."
      confirmText="Usuń"
      isConfirming={isDeleting}
    />
  );
}

