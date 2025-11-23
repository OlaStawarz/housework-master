import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTaskTemplates } from "./hooks/useTaskTemplates";
import type { RecurrenceUnit } from "@/types";

interface AddTasksFromTemplatesStepProps {
  spaceId: string;
  spaceType: string;
  onFinish: () => void;
  onSkip: () => void;
}

interface TemplateFormItem {
  template_id: string;
  isSelected: boolean;
  task_name: string;
  recurrence_value: number;
  recurrence_unit: RecurrenceUnit;
}

export function AddTasksFromTemplatesStep({ spaceId, spaceType, onFinish, onSkip }: AddTasksFromTemplatesStepProps) {
  const { templates, isLoading } = useTaskTemplates({ spaceType, enabled: true });
  const [formItems, setFormItems] = useState<TemplateFormItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mapowanie szablonów na elementy formularza (domyślnie wszystkie zaznaczone)
  useEffect(() => {
    if (templates.length > 0) {
      const items: TemplateFormItem[] = templates.map((template) => ({
        template_id: template.id,
        isSelected: true,
        task_name: template.task_name,
        recurrence_value: template.default_recurrence_value,
        recurrence_unit: template.default_recurrence_unit as RecurrenceUnit,
      }));
      setFormItems(items);
    }
  }, [templates]);

  const handleToggle = (index: number) => {
    setFormItems((prev) => {
      const newItems = [...prev];
      newItems[index].isSelected = !newItems[index].isSelected;
      return newItems;
    });
  };

  const handleRecurrenceValueChange = (index: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setFormItems((prev) => {
        const newItems = [...prev];
        newItems[index].recurrence_value = numValue;
        return newItems;
      });
    }
  };

  const handleRecurrenceUnitChange = (index: number, unit: RecurrenceUnit) => {
    setFormItems((prev) => {
      const newItems = [...prev];
      newItems[index].recurrence_unit = unit;
      return newItems;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const selectedItems = formItems.filter((item) => item.isSelected);

    if (selectedItems.length === 0) {
      setError("Wybierz przynajmniej jedno zadanie");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        items: selectedItems.map((item) => ({
          template_id: item.template_id,
          override_recurrence_value: item.recurrence_value,
          override_recurrence_unit: item.recurrence_unit,
        })),
      };

      console.log("Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/spaces/${spaceId}/tasks/bulk-from-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Nie udało się dodać zadań");
      }

      const result = await response.json();

      // Sprawdzenie czy wszystkie się udały (207 Multi-Status)
      if (result.results) {
        const successCount = result.results.filter((r: any) => r.status === 201).length;
        const totalCount = result.results.length;

        if (successCount < totalCount) {
          console.warn(`Dodano ${successCount} z ${totalCount} zadań`);
        }
      }

      onFinish();
    } catch (err) {
      console.error("Error creating tasks:", err);
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Ładowanie szablonów zadań...</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="py-8 text-center space-y-4">
        <p className="text-muted-foreground">Brak szablonów dla tego typu przestrzeni.</p>
        <Button onClick={onFinish}>Zakończ</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Wybierz zadania, które chcesz dodać do przestrzeni. Możesz dostosować częstotliwość dla każdego zadania.
        </p>

        {formItems.map((item, index) => (
          <div key={item.template_id} className="flex items-start gap-4 p-4 border rounded-lg">
            <Checkbox
              id={`task-${item.template_id}`}
              checked={item.isSelected}
              onCheckedChange={() => handleToggle(index)}
              disabled={isSubmitting}
            />

            <div className="flex-1 space-y-3">
              <Label htmlFor={`task-${item.template_id}`} className="font-medium">
                {item.task_name}
              </Label>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Co</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.recurrence_value}
                  onChange={(e) => handleRecurrenceValueChange(index, e.target.value)}
                  disabled={!item.isSelected || isSubmitting}
                  className="w-20"
                />
                <Select
                  value={item.recurrence_unit}
                  onValueChange={(value: RecurrenceUnit) => handleRecurrenceUnitChange(index, value)}
                  disabled={!item.isSelected || isSubmitting}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">dni</SelectItem>
                    <SelectItem value="months">miesięcy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md" role="alert">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSkip} disabled={isSubmitting}>
          Pomiń
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Dodawanie..." : "Dodaj wybrane zadania"}
        </Button>
      </div>
    </form>
  );
}
