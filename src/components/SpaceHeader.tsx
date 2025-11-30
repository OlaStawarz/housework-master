import { Button } from "@/components/ui/button";
import type { SpaceDto } from "@/types";

interface SpaceHeaderProps {
  space: SpaceDto;
  onDeleteSpace: () => void;
}

export function SpaceHeader({ space, onDeleteSpace }: SpaceHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {space.icon && (
          <div className="text-5xl" role="img" aria-label={`Ikona przestrzeni: ${space.icon}`}>
            {space.icon}
          </div>
        )}
        <h1 className="text-3xl font-bold">{space.name}</h1>
      </div>

      <Button variant="destructive" onClick={onDeleteSpace}>
        Usuń przestrzeń
      </Button>
    </div>
  );
}
