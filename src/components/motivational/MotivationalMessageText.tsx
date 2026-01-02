import { useMemo } from "react";
import { isAutoGenerateWindowOpen, useAutoGenerateMotivationalMessage } from "@/components/hooks/useAutoGenerateMotivationalMessage";
import { useLatestMotivationalMessage } from "@/components/hooks/useLatestMotivationalMessage";
import { MessageInlineSkeleton } from "@/components/motivational/MessageInlineSkeleton";
import { MessageInlineFallback } from "@/components/motivational/MessageInlineFallback";

interface MotivationalMessageTextProps {
  taskId: string;
  taskName?: string;
  taskDueDate?: string;
}

const FALLBACK_TEXT = "Spróbuj podejść do zadania energicznie!";

export function MotivationalMessageText({ taskId, taskName, taskDueDate }: MotivationalMessageTextProps) {
  const windowOpen = isAutoGenerateWindowOpen(taskDueDate);

  const {
    latestMessage,
    status,
    isLoading,
    error: latestError,
    refetch,
  } = useLatestMotivationalMessage(taskId, { enabled: windowOpen });

  const {
    isGenerating,
    canGenerate,
    error: generateError,
  } = useAutoGenerateMotivationalMessage({
    taskId,
    taskName,
    taskDueDate,
    latestMessage: latestMessage.message,
    latestStatus: status,
    onGenerated: refetch,
    enabled: windowOpen,
  });

  const messageText = useMemo(() => {
    if (status === "success" && latestMessage.text) {
      return latestMessage.text;
    }

    // Jeżeli okno auto-generacji zamknięte i brak danych, nie pokazujemy fallbacku
    if (status === "empty" && !isGenerating && !canGenerate) {
      return null;
    }

    if (status === "error") {
      return FALLBACK_TEXT;
    }

    return latestMessage.text ?? null;
  }, [status, latestMessage.text, isGenerating, canGenerate]);

  const showSkeleton = windowOpen && (isLoading || (status === "empty" && isGenerating) || status === "idle");
  const hasError = latestError || generateError;

  if (showSkeleton) {
    return (
      <MessageInlineSkeleton />
    );
  }

  // Brak treści i brak błędów -> nie renderujemy nic (np. >1 dzień przed terminem)
  if (!windowOpen || (!messageText && !hasError)) {
    return null;
  }

  return (
    <div className="text-sm text-muted-foreground" aria-live="polite">
      {messageText ? (
        <>
          {messageText}
          {hasError && <span className="ml-2 text-xs text-destructive">{FALLBACK_TEXT}</span>}
        </>
      ) : (
        <MessageInlineFallback text={FALLBACK_TEXT} />
      )}
    </div>
  );
}

