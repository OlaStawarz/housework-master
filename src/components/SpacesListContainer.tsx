import { useState, useEffect } from "react";
import type { SpaceDto } from "@/types";
import { SpaceCard } from "./SpaceCard";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/ui/button";
import { CreateSpaceModal } from "./CreateSpaceModal";

export function SpacesListContainer() {
  const [spaces, setSpaces] = useState<SpaceDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSpaces = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/spaces?sort=created_at.desc");

      if (!response.ok) {
        throw new Error("Nie udało się załadować przestrzeni");
      }

      const data = await response.json();
      setSpaces(data.data || []);
    } catch (err) {
      console.error("Error fetching spaces:", err);
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  console.log(spaces);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSpaceCreated = () => {
    fetchSpaces();
  };

  // Stan ładowania
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Moje przestrzenie</h1>
          <Button disabled onClick={handleOpenModal}>
            Dodaj nową przestrzeń
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Stan błędu
  if (error) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Moje przestrzenie</h1>
          <Button onClick={handleOpenModal}>Dodaj nową przestrzeń</Button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="text-6xl mb-6" role="img" aria-label="Błąd">
            ⚠️
          </div>
          <h2 className="text-2xl font-semibold mb-2">{error}</h2>
          <p className="text-muted-foreground mb-6">Spróbuj odświeżyć stronę lub skontaktuj się z pomocą techniczną.</p>
          <Button onClick={fetchSpaces}>Spróbuj ponownie</Button>
        </div>
        <CreateSpaceModal isOpen={isModalOpen} onClose={handleCloseModal} onSpaceCreated={handleSpaceCreated} />
      </div>
    );
  }

  // Stan pustej listy
  if (spaces.length === 0) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Moje przestrzenie</h1>
          <Button onClick={handleOpenModal}>Dodaj nową przestrzeń</Button>
        </div>
        <EmptyState />
        <CreateSpaceModal isOpen={isModalOpen} onClose={handleCloseModal} onSpaceCreated={handleSpaceCreated} />
      </div>
    );
  }

  // Stan z danymi
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Moje przestrzenie</h1>
        <Button onClick={handleOpenModal}>Dodaj nową przestrzeń</Button>
      </div>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        role="list"
        aria-label="Lista przestrzeni"
      >
        {spaces.map((space) => (
          <div key={space.id} role="listitem">
            <SpaceCard space={space} />
          </div>
        ))}
      </div>

      <CreateSpaceModal isOpen={isModalOpen} onClose={handleCloseModal} onSpaceCreated={handleSpaceCreated} />
    </div>
  );
}
