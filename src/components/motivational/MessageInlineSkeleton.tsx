export function MessageInlineSkeleton() {
  return (
    <div className="flex flex-col gap-2" role="status" aria-live="polite">
      <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
      <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
    </div>
  );
}

