import { useState, useEffect } from "react";
import type { TaskDto, DashboardSection } from "@/types";

interface UseDashboardTasksOptions {
  section: DashboardSection;
  daysAhead?: number;
  limit?: number;
  enabled?: boolean;
}

interface UseDashboardTasksResult {
  tasks: TaskDto[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export function useDashboardTasks({
  section,
  daysAhead = 7,
  limit = 20,
  enabled = true,
}: UseDashboardTasksOptions): UseDashboardTasksResult {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [page, setPage] = useState(1);

  const refetch = () => {
    setPage(1);
    setRefetchTrigger((prev) => prev + 1);
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  const hasMore = tasks.length < total;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const fetchTasks = async () => {
      const isFirstPage = page === 1;
      
      if (isFirstPage) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      setError(null);

      try {
        const params = new URLSearchParams({
          section,
          days_ahead: daysAhead.toString(),
          limit: limit.toString(),
          page: page.toString(),
          sort: "due_date.asc",
        });

        const response = await fetch(`/api/dashboard/tasks?${params}`);

        if (!response.ok) {
          throw new Error("Nie udało się pobrać zadań");
        }

        const data = await response.json();
        
        if (isFirstPage) {
          setTasks(data.data || []);
        } else {
          setTasks((prev) => [...prev, ...(data.data || [])]);
        }
        
        setTotal(data.pagination?.total || 0);
      } catch (err) {
        console.error("Error fetching dashboard tasks:", err);
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };

    fetchTasks();
  }, [section, daysAhead, limit, enabled, refetchTrigger, page]);

  return {
    tasks,
    total,
    isLoading,
    error,
    refetch,
    loadMore,
    hasMore,
    isLoadingMore,
  };
}

