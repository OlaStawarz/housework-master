export function TasksLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2].map((groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          <div className="h-7 w-32 bg-muted rounded animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map((taskIndex) => (
              <div key={taskIndex} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-muted rounded animate-pulse mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
