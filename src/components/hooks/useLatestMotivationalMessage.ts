import { useCallback, useEffect, useMemo, useState } from "react";
import type { MotivationalMessageDto } from "@/types";

export type LatestMessageStatus = "idle" | "loading" | "success" | "empty" | "error";

export interface LatestMessageVM {
  text: string | null;
  message: MotivationalMessageDto | null;
  isStale: boolean;
}

export interface UseLatestMotivationalMessageResult {
  latestMessage: LatestMessageVM;
  status: LatestMessageStatus;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h

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

export function useLatestMotivationalMessage(
  taskId: string,
  options?: { enabled?: boolean }
): UseLatestMotivationalMessageResult {
  const enabled = options?.enabled ?? true;
  const [message, setMessage] = useState<MotivationalMessageDto | null>(null);
  const [status, setStatus] = useState<LatestMessageStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setError(null);
      setMessage(null);
      return;
    }

    if (!taskId) {
      setStatus("error");
      setError("Brak identyfikatora zadania");
      setMessage(null);
      return;
    }

    let isCancelled = false;

    const fetchLatestMessage = async () => {
      setStatus("loading");
      setError(null);

      try {
        const response = await fetch(`/api/tasks/${taskId}/motivational-messages/latest`);

        if (response.status === 404) {
          if (!isCancelled) {
            setMessage(null);
            setStatus("empty");
          }
          return;
        }

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const messageText = body?.error || "Nie udało się pobrać wiadomości motywacyjnej";
          throw new Error(messageText);
        }

        const data = (await response.json()) as MotivationalMessageDto;

        if (isCancelled) return;

        if (!data?.message_text) {
          setMessage(null);
          setStatus("empty");
          return;
        }

        setMessage(data);
        setStatus("success");
      } catch (err) {
        if (isCancelled) return;

        console.error("Error fetching latest motivational message:", err);
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
        setStatus("error");
        setMessage(null);
      }
    };

    fetchLatestMessage();

    return () => {
      isCancelled = true;
    };
  }, [taskId, refreshKey, enabled]);

  const latestMessage = useMemo<LatestMessageVM>(() => {
    const text = message?.message_text ?? null;
    return {
      text,
      message,
      isStale: isMessageStale(message),
    };
  }, [message]);

  return {
    latestMessage,
    status,
    isLoading: status === "loading" || status === "idle",
    error,
    refetch,
  };
}

