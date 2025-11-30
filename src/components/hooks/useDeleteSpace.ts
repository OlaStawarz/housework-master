import { useState } from "react";
import { toast } from "sonner";

interface UseDeleteSpaceOptions {
  spaceId: string;
  onSuccess?: () => void;
}

interface UseDeleteSpaceResult {
  deleteSpace: () => Promise<void>;
  isDeleting: boolean;
}

export function useDeleteSpace({
  spaceId,
  onSuccess,
}: UseDeleteSpaceOptions): UseDeleteSpaceResult {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteSpace = async () => {
    // Guard: już w trakcie usuwania
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: "DELETE",
      });

      // Sukces (204 No Content)
      if (response.status === 204) {
        toast.success("Przestrzeń została usunięta");
        
        // Wywołaj callback sukcesu (jeśli przekazany)
        if (onSuccess) {
          onSuccess();
        }
        
        // Przekieruj do listy przestrzeni
        window.location.href = "/spaces";
        return;
      }

      // Błąd 404 - traktuj jako sukces (zasób i tak nie istnieje)
      if (response.status === 404) {
        toast.success("Przestrzeń została usunięta");
        window.location.href = "/spaces";
        return;
      }

      // Inne błędy
      throw new Error("Nie udało się usunąć przestrzeni");
    } catch (error) {
      console.error("Error deleting space:", error);
      toast.error("Wystąpił błąd podczas usuwania przestrzeni. Spróbuj ponownie.");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteSpace,
    isDeleting,
  };
}

