export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-6" role="img" aria-label="Brak przestrzeni">
        🏠
      </div>
      <h2 className="text-2xl font-semibold mb-2">Nie masz jeszcze żadnych przestrzeni</h2>
      <p className="text-muted-foreground max-w-md">
        Utwórz swoją pierwszą przestrzeń, aby rozpocząć organizowanie zadań domowych.
      </p>
    </div>
  );
}
