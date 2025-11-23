import { useState, useEffect } from "react";
import type { SpaceTypeDto } from "@/types";

interface UseSpaceTypesResult {
  spaceTypes: SpaceTypeDto[];
  isLoading: boolean;
  error: string | null;
}

export function useSpaceTypes(): UseSpaceTypesResult {
  const [spaceTypes, setSpaceTypes] = useState<SpaceTypeDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpaceTypes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/space-types");

        if (!response.ok) {
          throw new Error("Nie udało się pobrać typów przestrzeni");
        }

        const data = await response.json();
        setSpaceTypes(data.data || []);
      } catch (err) {
        console.error("Error fetching space types:", err);
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpaceTypes();
  }, []);

  return { spaceTypes, isLoading, error };
}
