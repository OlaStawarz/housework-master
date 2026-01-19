import { useState, useEffect } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { TaskDto } from "@/types";
import { pluralizeDays, pluralizeMonths } from "@/lib/utils/pluralize";
import { MotivationalMessageText } from "@/components/motivational/MotivationalMessageText";

interface TaskCardProps {
  task: TaskDto;
  onComplete: (taskId: string) => void;
  onPostpone: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  hideActions?: boolean;
  showSpaceName?: boolean;
}

export function TaskCard({
  task,
  onComplete,
  onPostpone,
  onEdit,
  onDelete,
  hideActions = false,
  showSpaceName = false,
}: TaskCardProps) {
  // Stan lokalny do obsługi animacji ukończenia
  const [isCompleting, setIsCompleting] = useState(false);

  // Resetujemy stan ukończenia, gdy zadanie zostanie zaktualizowane z serwera
  useEffect(() => {
    setIsCompleting(false);
  }, [task.last_completed_at, task.due_date]);

  const handleCheckChange = (checked: boolean) => {
    if (checked) {    
      const rect = document.getElementById(`task-${task.id}`)?.getBoundingClientRect();
      
      const defaults = {
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FD9A9C', '#FF6077', '#FF36FF', '#7B41C7'],
        zIndex: 10000,
        disableForReducedMotion: false,
      };

      if (rect) {
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        
        confetti({
          ...defaults,
          particleCount: 40,
          scalar: 1.2,
          shapes: ['star'],
          origin: { x, y },
          gravity: 1, // Reset grawitacji dla strzału
          spread: 70, // Reset spread
          startVelocity: 45, // Reset velocity
          ticks: 200, // Reset ticks
        });
        
        // Dodatkowy efekt - małe kółka
        confetti({
          ...defaults,
          particleCount: 10,
          scalar: 0.75,
          shapes: ['circle'],
          origin: { x, y },
          gravity: 1,
          spread: 70,
          startVelocity: 45,
          ticks: 200,
        });
      } else {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 10000,
          disableForReducedMotion: false,
        });
      }

      setIsCompleting(true);
      
      // Opóźnienie wywołania onComplete, aby użytkownik zdążył zobaczyć konfetti i zaznaczenie
      setTimeout(() => {
        onComplete(task.id);
      }, 800);
    }
  };

  // Formatowanie daty z uwzględnieniem jednostki cykliczności
  const formatDate = (dateString: string, recurrenceUnit: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Dla dat przeszłych
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);

      // Dla zadań miesięcznych, oblicz różnicę w miesiącach
      if (recurrenceUnit === 'months' && absDays >= 28) {
        const diffMonths = Math.round(absDays / 30);
        if (diffMonths === 1) {
          return { text: "Miesiąc temu", variant: "destructive" as const };
        }
        return { text: `${diffMonths} ${pluralizeMonths(diffMonths)} temu`, variant: "destructive" as const };
      }

      return { text: `${absDays} ${pluralizeDays(absDays)} temu`, variant: "destructive" as const };
    }

    // Dla daty dzisiejszej
    if (diffDays === 0) {
      return { text: "Dzisiaj", variant: "default" as const };
    }

    // Dla jutra
    if (diffDays === 1) {
      return { text: "Jutro", variant: "secondary" as const };
    }

    // Dla przyszłych dat
    // Dla zadań miesięcznych, oblicz różnicę w miesiącach
    if (recurrenceUnit === 'months' && diffDays >= 28) {
      const diffMonths = Math.round(diffDays / 30);
      if (diffMonths === 1) {
        return { text: "Za miesiąc", variant: "outline" as const };
      }
      return { text: `Za ${diffMonths} ${pluralizeMonths(diffMonths)}`, variant: "outline" as const };
    }

    return { text: `Za ${diffDays} ${pluralizeDays(diffDays)}`, variant: "outline" as const };
  };

  const dueDateInfo = formatDate(task.due_date, task.recurrence_unit);
  const isOverdue = dueDateInfo.variant === "destructive";
  const isToday = dueDateInfo.text === "Dzisiaj";
  const isPostponeLimitReached = task.postponement_count >= 3;

  // Handler dla przycisku postpone - obsługuje zarówno desktop jak i mobile
  const handlePostponeClick = () => {
    // Jeśli limit przełożeń został osiągnięty, pokaż toast i zablokuj akcję
    if (isPostponeLimitReached) {
      toast.error("To zadanie zostało już 3 razy przełożone. Czas je zrobić!");
      return; // Nie wykonuj akcji
    }

    // Jeśli jest w trakcie ukończenia, zablokuj akcję
    if (isCompleting) {
      return;
    }

    // W przeciwnym razie wykonaj normalną akcję postpone
    onPostpone(task.id);
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isOverdue ? "bg-destructive/5" : isToday ? "bg-sky-50 dark:bg-sky-950/20" : ""} ${isCompleting ? "opacity-50 scale-[0.98] bg-muted" : ""}`}
      data-testid={`task-card-${task.name}`}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${isOverdue ? "bg-destructive/40 group-hover:bg-destructive" : isToday ? "bg-sky-300/40 group-hover:bg-sky-400/60" : "bg-primary/20 group-hover:bg-primary"}`}
      />

      <div className="pl-3 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Checkbox
            id={`task-${task.id}`}
            checked={isCompleting}
            onCheckedChange={handleCheckChange}
            disabled={isCompleting}
            className="mt-1 transition-all duration-300"
            data-testid="complete-task-checkbox"
          />
          <div
            className={`flex-1 transition-all duration-300 ${isCompleting ? "line-through text-muted-foreground" : ""}`}
          >
            <label htmlFor={`task-${task.id}`} className="font-medium cursor-pointer">
              {task.name}
              {showSpaceName && task.space && (
                <span className="text-sm text-muted-foreground font-normal ml-2">({task.space.name})</span>
              )}
            </label>
            <div className="mt-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  dueDateInfo.variant === "destructive"
                    ? "bg-destructive/10 text-destructive"
                    : isToday
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {dueDateInfo.text}
              </span>
            </div>
            <div className="mt-2">
              <MotivationalMessageText taskId={task.id} taskName={task.name} taskDueDate={task.due_date} />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {isOverdue && (
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePostponeClick}
                disabled={isCompleting}
                className={`w-full ${isPostponeLimitReached ? "opacity-50 cursor-not-allowed" : ""}`}
                data-testid="postpone-task-button"
              >
                Zrobię to jutro
              </Button>
              {isPostponeLimitReached && (
                <span className="text-xs text-destructive px-2">Zadanie przełożone 3 razy!</span>
              )}
            </div>
          )}
          {!hideActions && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(task.id)}
                disabled={isCompleting}
                className="flex-1 sm:flex-none"
                data-testid="edit-task-button"
              >
                Edytuj
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                disabled={isCompleting}
                className="flex-1 sm:flex-none"
                data-testid="delete-task-button"
              >
                Usuń
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
