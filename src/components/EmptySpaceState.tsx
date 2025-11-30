export function EmptySpaceState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-6" role="img" aria-label="Brak zadań">
        📋
      </div>
      <h2 className="text-2xl font-semibold mb-2">Brak zadań w tej przestrzeni</h2>
      <p className="text-muted-foreground max-w-md">
        Dodaj pierwszezadanie, aby rozpocząć organizowanie prac.
      </p>
    </div>
  );
}
