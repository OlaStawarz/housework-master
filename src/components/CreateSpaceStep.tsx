import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmojiGrid } from "./EmojiGrid";
import { useSpaceTypes } from "./hooks/useSpaceTypes";
import { postSpaceBodySchema } from "@/pages/api/spaces";
import type { SpaceDto } from "@/types";

type CreateSpaceFormData = z.infer<typeof postSpaceBodySchema>;
type FormErrors = Record<keyof CreateSpaceFormData, string | null>;

interface CreateSpaceStepProps {
  onSuccess: (space: SpaceDto) => void;
  onCancel: () => void;
}

export function CreateSpaceStep({ onSuccess, onCancel }: CreateSpaceStepProps) {
  const { spaceTypes, isLoading: isLoadingTypes } = useSpaceTypes();
  const [formData, setFormData] = useState<CreateSpaceFormData>({
    name: "",
    space_type: undefined,
    icon: undefined,
  });
  const [errors, setErrors] = useState<FormErrors>({ name: null, space_type: null, icon: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSpaceTypeChange = (value: string) => {
    const selectedType = spaceTypes.find((t) => t.code === value);
    setFormData({
      ...formData,
      space_type: value || undefined,
      icon: selectedType?.icon || undefined,
    });
  };

  const validateForm = (): boolean => {
    try {
      postSpaceBodySchema.parse(formData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: FormErrors = { name: null, space_type: null, icon: null };
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof CreateSpaceFormData;
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
      const response = await fetch("/api/spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error data:", errorData);

        // Obsługa błędu 409 - duplikat nazwy
        if (response.status === 409) {
          setErrors({ name: "Przestrzeń o tej nazwie już istnieje", space_type: null, icon: null });
          return;
        }

        // Inne błędy API
        throw new Error(errorData.error || "Nie udało się utworzyć przestrzeni");
      }

      const newSpace: SpaceDto = await response.json();
      console.log("New space:", JSON.stringify(newSpace, null, 2));
      onSuccess(newSpace);
    } catch (err) {
      console.error("Error creating space:", err);
      setApiError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Nazwa przestrzeni */}
        <div className="space-y-2">
          <Label htmlFor="space-name">Nazwa przestrzeni *</Label>
          <Input
            id="space-name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              // Czyść błąd podczas wpisywania
              if (errors.name) {
                setErrors({ ...errors, name: null });
              }
            }}
            placeholder="np. Kuchnia, Łazienka, Salon"
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            data-testid="space-name-input"
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-destructive">
              {errors.name}
            </p>
          )}
        </div>

        {/* Typ przestrzeni */}
        <div className="space-y-2">
          <Label htmlFor="space-type">Typ przestrzeni</Label>
          <Select
            value={formData.space_type || ""}
            onValueChange={handleSpaceTypeChange}
            disabled={isSubmitting || isLoadingTypes}
          >
            <SelectTrigger id="space-type" data-testid="space-type-select-trigger">
              <SelectValue placeholder="Wybierz typ (opcjonalnie)" />
            </SelectTrigger>
            <SelectContent>
              {spaceTypes.map((type) => (
                <SelectItem key={type.id} value={type.code} data-testid={`space-type-item-${type.code}`}>
                  {type.icon} {type.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.space_type && <p className="text-sm text-destructive">{errors.space_type}</p>}
        </div>
      </div>

      {/* Ikona */}
      <div className="space-y-2">
        <Label>Ikona</Label>
        <EmojiGrid selectedEmoji={formData.icon} onSelect={(emoji) => setFormData({ ...formData, icon: emoji })} />
        {errors.icon && <p className="text-sm text-destructive">{errors.icon}</p>}
      </div>

      {/* Błąd API */}
      {apiError && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md" role="alert">
          {apiError}
        </div>
      )}

      {/* Przyciski akcji */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="create-space-submit-button">
          {isSubmitting ? "Tworzenie..." : "Utwórz"}
        </Button>
      </div>
    </form>
  );
}
