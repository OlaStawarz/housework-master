import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirmText !== "USUŃ") return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/user", {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Konto zostało usunięte.");
        window.location.href = "/";
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "Wystąpił błąd podczas usuwania konta.");
        setIsLoading(false); // Only stop loading on error, on success we redirect
      }
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error("Wystąpił błąd.");
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Usuń konto</AlertDialogTitle>
          <AlertDialogDescription>
            Ta operacja jest nieodwracalna. Spowoduje trwałe usunięcie Twojego konta oraz wszystkich danych (zadań, przestrzeni).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="confirm-delete">
            Aby potwierdzić, wpisz słowo <strong>USUŃ</strong>
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="USUŃ"
            className="border-destructive/50 focus-visible:ring-destructive"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmText !== "USUŃ" || isLoading}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń konto trwale"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

