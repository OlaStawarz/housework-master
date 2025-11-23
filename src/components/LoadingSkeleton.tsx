import { Card, CardHeader } from "@/components/ui/card";

export function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-col items-center gap-2 p-4">
        <div className="w-12 h-12 bg-muted rounded animate-pulse" />
        <div className="w-24 h-3.5 bg-muted rounded animate-pulse" />
      </CardHeader>
    </Card>
  );
}
