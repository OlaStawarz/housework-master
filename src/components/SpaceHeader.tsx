import { Button } from "@/components/ui/button";
import type { SpaceDto } from "@/types";
import { Trash2, Plus, ArrowLeft } from "lucide-react";

interface SpaceHeaderProps {
  space: SpaceDto;
  onDeleteSpace: () => void;
  onAddTask: () => void;
}

export function SpaceHeader({ space, onDeleteSpace, onAddTask }: SpaceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-start justify-between w-full sm:w-auto sm:justify-start gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full -ml-3"
            onClick={() => (window.location.href = "/spaces")}
            title="Wróć do listy przestrzeni"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Wróć</span>
          </Button>

          {space.icon && (
            <div
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-2xl shrink-0"
              role="img"
              aria-label={`Ikona przestrzeni: ${space.icon}`}
            >
              {space.icon}
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight break-all">{space.name}</h1>
        </div>

        {/* Mobile delete button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDeleteSpace}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors sm:hidden -mr-2"
          title="Usuń przestrzeń"
        >
          <Trash2 className="h-5 w-5" />
          <span className="sr-only">Usuń przestrzeń</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 hidden sm:flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDeleteSpace}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Usuń przestrzeń"
        >
          <Trash2 className="h-5 w-5" />
          <span className="sr-only">Usuń przestrzeń</span>
        </Button>

        <Button onClick={onAddTask} className="gap-2 shadow-lg shadow-primary/20 hidden md:flex">
          <Plus className="h-4 w-4" />
          Dodaj zadanie
        </Button>
      </div>
    </div>
  );
}
