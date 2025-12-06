import { useState, useEffect } from "react";
import { useDashboardTasks } from "./hooks/useDashboardTasks";
import { useTaskMutations } from "./hooks/useTaskMutations";
import { OnboardingState } from "./OnboardingState";
import { EmptyTasksState } from "./EmptyTasksState";
import { TaskCard } from "./TaskCard";
import { TasksLoadingSkeleton } from "./TasksLoadingSkeleton";
import { Button } from "@/components/ui/button";

export function DashboardContainer() {
  const [hasSpaces, setHasSpaces] = useState<boolean | null>(null);
  const [isCheckingSpaces, setIsCheckingSpaces] = useState(true);

  // Pobieranie zadań dla obu sekcji
  const {
    tasks: overdueTasks,
    isLoading: isLoadingOverdue,
    error: overdueError,
    refetch: refetchOverdue,
    loadMore: loadMoreOverdue,
    hasMore: hasMoreOverdue,
    isLoadingMore: isLoadingMoreOverdue,
  } = useDashboardTasks({
    section: "overdue",
    enabled: hasSpaces === true,
  });

  const {
    tasks: upcomingTasks,
    isLoading: isLoadingUpcoming,
    error: upcomingError,
    refetch: refetchUpcoming,
    loadMore: loadMoreUpcoming,
    hasMore: hasMoreUpcoming,
    isLoadingMore: isLoadingMoreUpcoming,
  } = useDashboardTasks({
    section: "upcoming",
    daysAhead: 7,
    enabled: hasSpaces === true,
  });

  // Hook do mutacji zadań
  const { completeTask, postponeTask } = useTaskMutations({
    onCompleteSuccess: () => {
      // Odświeżenie po 3 sekundach
      setTimeout(() => {
        refetchOverdue();
        refetchUpcoming();
      }, 3000);
    },
    onPostponeSuccess: () => {
      // Odświeżenie po 3 sekundach
      setTimeout(() => {
        refetchOverdue();
        refetchUpcoming();
      }, 3000);
    },
  });

  // Sprawdzenie czy użytkownik ma przestrzenie
  useEffect(() => {
    const checkSpaces = async () => {
      try {
        const response = await fetch("/api/spaces?limit=1");
        if (!response.ok) {
          throw new Error("Nie udało się pobrać przestrzeni");
        }
        const data = await response.json();
        setHasSpaces(data.data && data.data.length > 0);
      } catch (error) {
        console.error("Error checking spaces:", error);
        setHasSpaces(false);
      } finally {
        setIsCheckingSpaces(false);
      }
    };

    checkSpaces();
  }, []);

  // Handlery
  const handleComplete = async (taskId: string) => {
    await completeTask(taskId);
  };

  const handlePostpone = async (taskId: string) => {
    await postponeTask(taskId);
  };

  const handleCreateSpace = () => {
    window.location.href = "/spaces";
  };

  // Stan ładowania sprawdzania przestrzeni
  if (isCheckingSpaces) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <TasksLoadingSkeleton />
      </div>
    );
  }

  // Onboarding - brak przestrzeni
  if (!hasSpaces) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <OnboardingState onCreateSpace={handleCreateSpace} />
      </div>
    );
  }

  // Są przestrzenie, ale brak zadań
  const hasNoTasks = !isLoadingOverdue && !isLoadingUpcoming && 
                     overdueTasks.length === 0 && upcomingTasks.length === 0;

  if (hasNoTasks) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <EmptyTasksState />
      </div>
    );
  }

  // Formatowanie aktualnej daty
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header Dashboard */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              {formattedDate}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Sekcja Zaległe */}
        {(isLoadingOverdue || overdueTasks.length > 0 || overdueError) && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-destructive">
                Zaległe {overdueTasks.length > 0 && `(${overdueTasks.length})`}
              </h2>
            </div>

            {isLoadingOverdue && <TasksLoadingSkeleton />}

            {overdueError && (
              <div className="p-4 border border-destructive rounded-lg bg-destructive/5">
                <p className="text-destructive">{overdueError}</p>
              </div>
            )}

            {!isLoadingOverdue && !overdueError && overdueTasks.length > 0 && (
              <>
                <div className="space-y-3">
                  {overdueTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleComplete}
                      onPostpone={handlePostpone}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      hideActions
                      showSpaceName
                    />
                  ))}
                </div>
                {hasMoreOverdue && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={loadMoreOverdue}
                      disabled={isLoadingMoreOverdue}
                    >
                      {isLoadingMoreOverdue ? "Ładowanie..." : "Pokaż więcej"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Sekcja Nadchodzące */}
        {(isLoadingUpcoming || upcomingTasks.length > 0 || upcomingError) && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                Nadchodzące {upcomingTasks.length > 0 && `(${upcomingTasks.length})`}
              </h2>
            </div>

            {isLoadingUpcoming && <TasksLoadingSkeleton />}

            {upcomingError && (
              <div className="p-4 border rounded-lg bg-muted">
                <p className="text-muted-foreground">{upcomingError}</p>
              </div>
            )}

            {!isLoadingUpcoming && !upcomingError && upcomingTasks.length > 0 && (
              <>
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleComplete}
                      onPostpone={handlePostpone}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      hideActions
                      showSpaceName
                    />
                  ))}
                </div>
                {hasMoreUpcoming && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={loadMoreUpcoming}
                      disabled={isLoadingMoreUpcoming}
                    >
                      {isLoadingMoreUpcoming ? "Ładowanie..." : "Pokaż więcej"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

