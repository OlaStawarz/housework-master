import { useCallback, useEffect, useMemo, useState } from "react";
import type { MotivationalMessageDto, MotivationalTone } from "@/types";
import type { LatestMessageStatus } from "./useLatestMotivationalMessage";

interface UseAutoGenerateParams {
  taskId: string;
  taskName?: string;
  taskDueDate?: string;
  latestMessage: MotivationalMessageDto | null;
  latestStatus: LatestMessageStatus;
  onGenerated?: () => void;
  enabled?: boolean;
}

export interface AutoGenerateState {
  isGenerating: boolean;
  canGenerate: boolean;
  lastTriedAt: string | null;
  error: string | null;
  triggerGenerate: (force?: boolean) => Promise<void>;
}

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h
const MS_IN_DAY = 1000 * 60 * 60 * 24;

const getDiffDaysFromToday = (dateString?: string): number | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.floor((target.getTime() - today.getTime()) / MS_IN_DAY);
};

// Dozwolone okno auto-generacji: w dzień (0) oraz po terminie (<0)
export const isAutoGenerateWindowOpen = (taskDueDate?: string) => {
  const diffDays = getDiffDaysFromToday(taskDueDate);
  if (diffDays === null) {
    return false;
  }
  return diffDays <= 0;
};

const deriveToneByDueDate = (taskDueDate?: string): MotivationalTone => {
  if (!taskDueDate) {
    return "encouraging";
  }

  const due = new Date(taskDueDate);
  if (Number.isNaN(due.getTime())) {
    return "encouraging";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueAtMidnight = new Date(due);
  dueAtMidnight.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((dueAtMidnight.getTime() - today.getTime()) / MS_IN_DAY);

  if (diffDays < 0) {
    return "encouraging"; // po terminie
  }

  if (diffDays === 0) {
    return "playful"; // w dzień terminu
  }

  return "encouraging";
};

const isMessageStale = (message: MotivationalMessageDto | null): boolean => {
  if (!message?.generated_at) {
    return true;
  }

  const generatedAt = new Date(message.generated_at);
  if (Number.isNaN(generatedAt.getTime())) {
    return true;
  }

  return Date.now() - generatedAt.getTime() >= STALE_THRESHOLD_MS;
};

export function useAutoGenerateMotivationalMessage({
  taskId,
  taskName,
  taskDueDate,
  latestMessage,
  latestStatus,
  onGenerated,
  enabled = true,
}: UseAutoGenerateParams): AutoGenerateState {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTriedAt, setLastTriedAt] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setLastTriedAt(null);
  }, [taskId]);

  useEffect(() => {
    // Reset licznika prób, gdy pojawiła się nowsza wiadomość
    setLastTriedAt(null);
  }, [latestMessage?.generated_at]);

  const canGenerate = useMemo(() => {
    if (!enabled) {
      return false;
    }

    if (!taskId) {
      return false;
    }

    // Generujemy tylko w oknie (w terminie / po terminie)
    if (!isAutoGenerateWindowOpen(taskDueDate)) {
      return false;
    }

    if (latestStatus !== "empty" && latestStatus !== "success") {
      return false;
    }

    if (!latestMessage) {
      return true;
    }

    return isMessageStale(latestMessage);
  }, [taskId, taskDueDate, latestStatus, latestMessage]);

  const triggerGenerate = useCallback(
    async (force = false) => {
      if (isGenerating) {
        return;
      }

      if (!enabled) {
        return;
      }

      if (!force && !canGenerate) {
        return;
      }

      if (!taskName) {
        setError("Brak nazwy zadania do wygenerowania wiadomości");
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const response = await fetch(`/api/tasks/${taskId}/motivational-messages/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            task_name: taskName,
            tone: deriveToneByDueDate(taskDueDate),
            max_length: 150,
          }),
        });

        setLastTriedAt(new Date().toISOString());

        if (response.status === 201) {
          onGenerated?.();
          return;
        }

        if (response.status === 404) {
          setError("Zadanie nie zostało znalezione");
          return;
        }

        if (response.status === 429) {
          setError("Przekroczono limit generowania. Spróbuj ponownie później.");
          return;
        }

        const body = await response.json().catch(() => null);
        const message = body?.error || body?.message || "Nie udało się wygenerować wiadomości motywacyjnej";
        throw new Error(message);
      } catch (err) {
        console.error("Error generating motivational message:", err);
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      } finally {
        setIsGenerating(false);
      }
    },
    [taskId, taskName, taskDueDate, canGenerate, onGenerated, isGenerating, enabled]
  );

  useEffect(() => {
    if (!canGenerate) {
      return;
    }

    if (latestStatus === "loading" || latestStatus === "idle") {
      return;
    }

    if (lastTriedAt) {
      return;
    }

    triggerGenerate();
  }, [canGenerate, lastTriedAt, latestStatus, triggerGenerate]);

  return {
    isGenerating,
    canGenerate,
    lastTriedAt,
    error,
    triggerGenerate,
  };
}

