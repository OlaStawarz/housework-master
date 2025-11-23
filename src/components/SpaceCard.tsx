import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { SpaceDto } from "@/types";

interface SpaceCardProps {
  space: SpaceDto;
}

export function SpaceCard({ space }: SpaceCardProps) {
  return (
    <a
      href={`/spaces/${space.id}`}
      className="block transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      aria-label={`Przejdź do przestrzeni ${space.name}`}
    >
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-col items-center gap-2 p-4">
          <div className="text-3xl" role="img" aria-label={`Ikona przestrzeni: ${space.icon}`}>
            {space.icon}
          </div>
          <CardTitle className="text-sm font-medium text-center">{space.name}</CardTitle>
        </CardHeader>
      </Card>
    </a>
  );
}
