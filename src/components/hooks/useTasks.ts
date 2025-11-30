import { useState, useEffect } from "react";
import type { TaskDto, GetTasksQuery } from "@/types";

interface UseTasksOptions {
  spaceId: string;
  sort?: GetTasksQuery["sort"];
  limit?: number;
}

interface UseTasksResult {
  tasks: TaskDto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTasks(options: UseTasksOptions): UseTasksResult {
  const { spaceId, sort = "recurrence.asc", limit = 100 } = options;
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          space_id: spaceId,
          sort,
          limit: limit.toString(),
        });

        const response = await fetch(`/api/tasks?${params}`);

        if (!response.ok) {
          throw new Error("Nie udało się pobrać zadań");
        }

        const data = await response.json();
        setTasks(data.data || []);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [spaceId, sort, limit, refreshKey]);

  const refetch = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return { tasks, isLoading, error, refetch };
}
