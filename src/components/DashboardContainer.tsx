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

  // Pobieranie zadań dla trzech sekcji
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
    tasks: todayTasks,
    isLoading: isLoadingToday,
    error: todayError,
    refetch: refetchToday,
    loadMore: loadMoreToday,
    hasMore: hasMoreToday,
    isLoadingMore: isLoadingMoreToday,
  } = useDashboardTasks({
    section: "today",
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
        refetchToday();
        refetchUpcoming();
      }, 3000);
    },
    onPostponeSuccess: () => {
      // Odświeżenie po 3 sekundach
      setTimeout(() => {
        refetchOverdue();
        refetchToday();
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

  // Stan ładowania zadań
  const isLoadingTasks = isLoadingOverdue || isLoadingToday || isLoadingUpcoming;

  // Są przestrzenie, ale brak zadań (po załadowaniu)
  const hasNoTasks = !isLoadingTasks && overdueTasks.length === 0 && todayTasks.length === 0 && upcomingTasks.length === 0;

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
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
              <span className="text-primary">Sprawdź swoje zadania!</span>
            </h1>
            <p className="text-lg text-muted-foreground font-medium">{formattedDate}</p>
          </div>
        </div>
      </div>

      {/* Skeleton podczas ładowania */}
      {isLoadingTasks && <TasksLoadingSkeleton />}

      {/* Sekcje po załadowaniu */}
      {!isLoadingTasks && (
        <div className="space-y-8">
          {/* Sekcja Zaległe */}
          {(overdueTasks.length > 0 || overdueError) && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-destructive">
                  Zaległe {overdueTasks.length > 0 && `(${overdueTasks.length})`}
                </h2>
              </div>

              {overdueError && (
                <div className="p-4 border border-destructive rounded-lg bg-destructive/5">
                  <p className="text-destructive">{overdueError}</p>
                </div>
              )}

              {!overdueError && overdueTasks.length > 0 && (
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
                      <Button variant="outline" onClick={loadMoreOverdue} disabled={isLoadingMoreOverdue}>
                        {isLoadingMoreOverdue ? "Ładowanie..." : "Pokaż więcej"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* Sekcja Dzisiaj */}
          {(todayTasks.length > 0 || todayError) && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                  Dzisiaj {todayTasks.length > 0 && `(${todayTasks.length})`}
                </h2>
              </div>

              {todayError && (
                <div className="p-4 border border-sky-200 rounded-lg bg-sky-50 dark:bg-sky-950/20 dark:border-sky-800">
                  <p className="text-sky-700 dark:text-sky-300">{todayError}</p>
                </div>
              )}

              {!todayError && todayTasks.length > 0 && (
                <>
                  <div className="space-y-3">
                    {todayTasks.map((task) => (
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
                  {hasMoreToday && (
                    <div className="mt-4 text-center">
                      <Button variant="outline" onClick={loadMoreToday} disabled={isLoadingMoreToday}>
                        {isLoadingMoreToday ? "Ładowanie..." : "Pokaż więcej"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* Sekcja Nadchodzące */}
          {(upcomingTasks.length > 0 || upcomingError) && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                  Nadchodzące {upcomingTasks.length > 0 && `(${upcomingTasks.length})`}
                </h2>
              </div>

              {upcomingError && (
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-muted-foreground">{upcomingError}</p>
                </div>
              )}

              {!upcomingError && upcomingTasks.length > 0 && (
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
                      <Button variant="outline" onClick={loadMoreUpcoming} disabled={isLoadingMoreUpcoming}>
                        {isLoadingMoreUpcoming ? "Ładowanie..." : "Pokaż więcej"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
