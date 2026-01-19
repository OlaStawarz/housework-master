import { useState } from "react";
import { toast } from "sonner";
import type { UpdateTaskRecurrenceCommand } from "@/types";

interface UseTaskMutationsOptions {
  onCompleteSuccess?: () => void;
  onPostponeSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

interface UseTaskMutationsResult {
  completeTask: (taskId: string) => Promise<void>;
  postponeTask: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, command: UpdateTaskRecurrenceCommand) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  isCompletingTask: boolean;
  isPostponingTask: boolean;
  isUpdatingTask: boolean;
  isDeletingTask: boolean;
}

export function useTaskMutations({
  onCompleteSuccess,
  onPostponeSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
}: UseTaskMutationsOptions = {}): UseTaskMutationsResult {
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [isPostponingTask, setIsPostponingTask] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

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

      // Błąd 422 - osiągnięto limit przełożeń
      if (response.status === 422) {
        toast.error("To zadanie zostało już 3 razy przełożone");
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

  const updateTask = async (taskId: string, command: UpdateTaskRecurrenceCommand) => {
    // Guard: już w trakcie aktualizacji
    if (isUpdatingTask) {
      return;
    }

    setIsUpdatingTask(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      // Sukces (200 OK)
      if (response.ok) {
        toast.success("Zadanie zostało zaktualizowane");

        // Wywołaj callback sukcesu (jeśli przekazany)
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
        return;
      }

      // Błąd 404 - zadanie nie istnieje
      if (response.status === 404) {
        toast.error("Zadanie nie zostało znalezione");
        
        // Odśwież listę, aby usunąć nieistniejące zadanie
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
        return;
      }

      // Błąd 422 - walidacja
      if (response.status === 422) {
        const errorData = await response.json();
        toast.error(errorData.error || "Nieprawidłowe dane");
        return;
      }

      // Inne błędy
      throw new Error("Nie udało się zaktualizować zadania");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Wystąpił błąd podczas aktualizacji zadania. Spróbuj ponownie.");
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    // Guard: już w trakcie usuwania
    if (isDeletingTask) {
      return;
    }

    setIsDeletingTask(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      // Sukces (204 No Content)
      if (response.status === 204) {
        toast.success("Zadanie zostało usunięte");

        // Wywołaj callback sukcesu (jeśli przekazany)
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
        return;
      }

      // Błąd 404 - zadanie nie istnieje
      if (response.status === 404) {
        toast.error("Zadanie nie zostało znalezione");
        
        // Odśwież listę, aby usunąć nieistniejące zadanie
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
        return;
      }

      // Inne błędy
      throw new Error("Nie udało się usunąć zadania");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Wystąpił błąd podczas usuwania zadania. Spróbuj ponownie.");
    } finally {
      setIsDeletingTask(false);
    }
  };

  return {
    completeTask,
    postponeTask,
    updateTask,
    deleteTask,
    isCompletingTask,
    isPostponingTask,
    isUpdatingTask,
    isDeletingTask,
  };
}

