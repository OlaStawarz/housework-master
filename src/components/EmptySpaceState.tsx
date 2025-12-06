import { EmptyState } from "./EmptyState";

export function EmptySpaceState() {
  return (
    <EmptyState
      icon="📋"
      iconLabel="Brak zadań"
      title="Brak zadań w tej przestrzeni"
      description="Dodaj pierwsze zadanie, aby rozpocząć organizowanie prac."
      iconSize="sm"
    />
  );
}
