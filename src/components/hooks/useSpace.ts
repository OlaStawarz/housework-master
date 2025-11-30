import { useState, useEffect } from "react";
import type { SpaceDto } from "@/types";

interface UseSpaceResult {
  space: SpaceDto | null;
  isLoading: boolean;
  error: string | null;
}

export function useSpace(spaceId: string): UseSpaceResult {
  const [space, setSpace] = useState<SpaceDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpace = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/spaces/${spaceId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Przestrzeń nie została znaleziona");
          }
          throw new Error("Nie udało się pobrać przestrzeni");
        }

        const data: SpaceDto = await response.json();
        setSpace(data);
      } catch (err) {
        console.error("Error fetching space:", err);
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpace();
  }, [spaceId]);

  return { space, isLoading, error };
}
