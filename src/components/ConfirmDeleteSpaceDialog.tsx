import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDeleteSpaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  spaceName: string;
  isDeleting: boolean;
}

export function ConfirmDeleteSpaceDialog({
  isOpen,
  onClose,
  onConfirm,
  spaceName,
  isDeleting,
}: ConfirmDeleteSpaceDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć przestrzeń: {spaceName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Zostaną również usunięte wszystkie przypisane do niej zadania. Ta operacja jest nieodwracalna.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

