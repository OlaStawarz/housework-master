import { useState, useEffect } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RecurrenceInputs } from "./RecurrenceInputs";
import { editTaskSchema } from "@/pages/api/tasks";
import type { RecurrenceUnit, TaskDto } from "@/types";

type EditTaskFormData = z.infer<typeof editTaskSchema>;
type FormErrors = Partial<Record<keyof EditTaskFormData, string>>;

interface EditTaskRecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskDto | null;
  onTaskUpdated: () => void;
}

export function EditTaskRecurrenceModal({
  isOpen,
  onClose,
  task,
  onTaskUpdated,
}: EditTaskRecurrenceModalProps) {
  const [formData, setFormData] = useState<EditTaskFormData>({ recurrence_value: 1, recurrence_unit: "days" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Wypełnij formularz danymi zadania przy otwarciu
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        recurrence_value: task.recurrence_value,
        recurrence_unit: task.recurrence_unit as RecurrenceUnit,
      });
      setErrors({});
      setApiError(null);
    }
  }, [task, isOpen]);

  const handleClose = () => {
    setErrors({});
    setApiError(null);
    onClose();
  };

  const validateForm = (): boolean => {
    try {
      editTaskSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof EditTaskFormData;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm() || !task) {
      return;
    }

    setIsSubmitting(true);

    try {
        console.log(task.id);
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        // Obsługa błędu 404 - zadanie nie istnieje
        if (response.status === 404) {
          setApiError("Zadanie nie istnieje");
          return;
        }

        // Obsługa błędu 422 - walidacja
        if (response.status === 422) {
          const errorData = await response.json();
          setApiError(errorData.error || "Nieprawidłowe dane");
          return;
        }

        // Inne błędy
        throw new Error("Nie udało się zaktualizować zadania");
      }

      // Sukces
      handleClose();
      onTaskUpdated();
    } catch (err) {
      console.error("Error updating task:", err);
      setApiError(err instanceof Error ? err.message : "Wystąpił błąd, spróbuj ponownie");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edytuj cykliczność zadania: {task.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cykliczność */}
          <RecurrenceInputs
            value={formData.recurrence_value}
            unit={formData.recurrence_unit}
            onValueChange={(value) => {
              setFormData({ ...formData, recurrence_value: value });
              // Czyść błąd podczas wpisywania
              if (errors.recurrence_value) {
                setErrors({ ...errors, recurrence_value: undefined });
              }
            }}
            onUnitChange={(unit) => {
              setFormData({ ...formData, recurrence_unit: unit });
              // Czyść błąd podczas zmiany
              if (errors.recurrence_unit) {
                setErrors({ ...errors, recurrence_unit: undefined });
              }
            }}
            valueError={errors.recurrence_value}
            disabled={isSubmitting}
          />

          {/* Błąd API */}
          {apiError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md" role="alert">
              {apiError}
            </div>
          )}

          {/* Przyciski */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

