import { useState, useEffect } from "react";
import type { TaskTemplateDto } from "@/types";

interface UseTaskTemplatesOptions {
  spaceType?: string;
  enabled?: boolean;
}

interface UseTaskTemplatesResult {
  templates: TaskTemplateDto[];
  isLoading: boolean;
  error: string | null;
}

export function useTaskTemplates(options: UseTaskTemplatesOptions = {}): UseTaskTemplatesResult {
  const { spaceType, enabled = true } = options;
  const [templates, setTemplates] = useState<TaskTemplateDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !spaceType) {
      setTemplates([]);
      setIsLoading(false);
      return;
    }

    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ space_type: spaceType });
        const response = await fetch(`/api/task-templates?${params}`);

        if (!response.ok) {
          throw new Error("Nie udało się pobrać szablonów zadań");
        }

        const data = await response.json();
        setTemplates(data.data || []);
      } catch (err) {
        console.error("Error fetching task templates:", err);
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [spaceType, enabled]);

  return { templates, isLoading, error };
}
