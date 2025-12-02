import { useState } from "react";
import { toast } from "sonner";

interface UseTaskMutationsOptions {
  onCompleteSuccess?: () => void;
  onPostponeSuccess?: () => void;
}

interface UseTaskMutationsResult {
  completeTask: (taskId: string) => Promise<void>;
  postponeTask: (taskId: string) => Promise<void>;
  isCompletingTask: boolean;
  isPostponingTask: boolean;
}

export function useTaskMutations({
  onCompleteSuccess,
  onPostponeSuccess,
}: UseTaskMutationsOptions = {}): UseTaskMutationsResult {
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [isPostponingTask, setIsPostponingTask] = useState(false);

  const completeTask = async (taskId: string) => {
    // Guard: już w trakcie oznaczania
    if (isCompletingTask) {
      return;
    }

    setIsCompletingTask(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      // Sukces (204 No Content)
      if (response.status === 204) {
        toast.success("Zadanie zostało ukończone");

        // Wywołaj callback sukcesu (jeśli przekazany)
        if (onCompleteSuccess) {
          onCompleteSuccess();
        }
        return;
      }

      // Błąd 404 - zadanie nie istnieje
      if (response.status === 404) {
        toast.error("Zadanie nie zostało znalezione");
        return;
      }

      // Inne błędy
      throw new Error("Nie udało się ukończyć zadania");
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Wystąpił błąd podczas oznaczania zadania jako ukończone. Spróbuj ponownie.");
    } finally {
      setIsCompletingTask(false);
    }
  };

  const postponeTask = async (taskId: string) => {
    // Guard: już w trakcie odkładania
    if (isPostponingTask) {
      return;
    }

    setIsPostponingTask(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}/postpone`, {
        method: "POST",
      });

      // Sukces (204 No Content)
      if (response.status === 204) {
        toast.success("Zadanie zostało odłożone na jutro");

        // Wywołaj callback sukcesu (jeśli przekazany)
        if (onPostponeSuccess) {
          onPostponeSuccess();
        }
        return;
      }

      // Błąd 404 - zadanie nie istnieje
      if (response.status === 404) {
        toast.error("Zadanie nie zostało znalezione");
        return;
      }

      // Błąd 422 - osiągnięto limit odroczeń
      if (response.status === 422) {
        toast.error("Osiągnięto limit odroczeń dla tego zadania");
        return;
      }

      // Błąd 409 - zadanie nie kwalifikuje się do odroczenia
      if (response.status === 409) {
        toast.error("To zadanie nie może być odroczone");
        return;
      }

      // Inne błędy
      throw new Error("Nie udało się odłożyć zadania");
    } catch (error) {
      console.error("Error postponing task:", error);
      toast.error("Wystąpił błąd podczas odkładania zadania. Spróbuj ponownie.");
    } finally {
      setIsPostponingTask(false);
    }
  };

  return {
    completeTask,
    postponeTask,
    isCompletingTask,
    isPostponingTask,
  };
}

