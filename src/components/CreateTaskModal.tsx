import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecurrenceInputs } from "./RecurrenceInputs";
import { createTaskSchema } from "@/pages/api/tasks";

// Schema dla formularza (bez space_id, bo jest dodawane przy submit)
const createTaskFormSchema = createTaskSchema.omit({ space_id: true });
type CreateTaskFormData = z.infer<typeof createTaskFormSchema>;
type FormErrors = Record<keyof CreateTaskFormData, string | null>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  onTaskCreated: () => void;
}

export function CreateTaskModal({ isOpen, onClose, spaceId, onTaskCreated }: CreateTaskModalProps) {
  const [formData, setFormData] = useState<CreateTaskFormData>({
    name: "",
    recurrence_value: 1,
    recurrence_unit: "days",
  });
  const [errors, setErrors] = useState<FormErrors>({ name: null, recurrence_value: null, recurrence_unit: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleClose = () => {
    setFormData({ name: "", recurrence_value: 1, recurrence_unit: "days" });
    setErrors({ name: null, recurrence_value: null, recurrence_unit: null });
    setApiError(null);
    onClose();
  };

  const validateForm = (): boolean => {
    try {
      // Walidacja z pełnymi danymi (z space_id)
      createTaskSchema.parse({
        space_id: spaceId,
        ...formData,
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: FormErrors = { name: null, recurrence_value: null, recurrence_unit: null };
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof CreateTaskFormData;
          if (field in fieldErrors) {
            fieldErrors[field] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          space_id: spaceId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Obsługa błędu 409 - duplikat nazwy
        if (response.status === 409) {
          setErrors({
            name: "Zadanie o tej nazwie już istnieje w tej przestrzeni",
            recurrence_value: null,
            recurrence_unit: null,
          });
          return;
        }

        // Inne błędy
        throw new Error(errorData.error || "Nie udało się utworzyć zadania");
      }

      // Sukces
      handleClose();
      onTaskCreated();
    } catch (err) {
      console.error("Error creating task:", err);
      setApiError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj nowe zadanie</DialogTitle>
          <DialogDescription>Utwórz nowe zadanie dla tej przestrzeni.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nazwa zadania */}
          <div className="space-y-2">
            <Label htmlFor="task-name">Nazwa zadania *</Label>
            <Input
              id="task-name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                // Czyść błąd podczas wpisywania
                if (errors.name) {
                  setErrors({ ...errors, name: null });
                }
              }}
              placeholder="np. Mycie okien"
              disabled={isSubmitting}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          {/* Cykliczność */}
          <RecurrenceInputs
            value={formData.recurrence_value}
            unit={formData.recurrence_unit}
            onValueChange={(value) => setFormData({ ...formData, recurrence_value: value })}
            onUnitChange={(unit) => setFormData({ ...formData, recurrence_unit: unit })}
            valueError={errors.recurrence_value || undefined}
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
              {isSubmitting ? "Tworzenie..." : "Utwórz"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
