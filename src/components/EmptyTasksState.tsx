import { EmptyState } from "./EmptyState";

export function EmptyTasksState() {
  return (
    <EmptyState
      icon="🎉"
      iconLabel="Gratulacje"
      title="Wszystko zrobione!"
      description="Nie masz żadnych zaległych ani nadchodzących zadań."
      iconSize="lg"
    />
  );
}
