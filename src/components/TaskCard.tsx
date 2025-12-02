import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { TaskDto } from "@/types";

interface TaskCardProps {
  task: TaskDto;
  onComplete: (taskId: string) => void;
  onPostpone: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onComplete, onPostpone, onEdit, onDelete }: TaskCardProps) {
  // Stan lokalny do obsługi animacji ukończenia
  const [isCompleting, setIsCompleting] = useState(false);

  // Resetujemy stan ukończenia, gdy zadanie zostanie zaktualizowane z serwera
  useEffect(() => {
    setIsCompleting(false);
  }, [task.last_completed_at, task.due_date]);

  const handleCheckChange = (checked: boolean) => {
    if (checked) {
      setIsCompleting(true);
      onComplete(task.id);
    }
  };

  // Formatowanie daty
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} dni temu`, variant: "destructive" as const };
    }
    if (diffDays === 0) {
      return { text: "Dzisiaj", variant: "default" as const };
    }
    if (diffDays === 1) {
      return { text: "Jutro", variant: "secondary" as const };
    }
    return { text: `Za ${diffDays} dni`, variant: "outline" as const };
  };

  const dueDateInfo = formatDate(task.due_date);
  const isOverdue = dueDateInfo.variant === "destructive";
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
    <div className={`p-4 border rounded-lg transition-all duration-300 ${isOverdue ? "border-destructive bg-destructive/5" : ""} ${isCompleting ? "opacity-50 scale-[0.98] bg-muted" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Checkbox
            id={`task-${task.id}`}
            checked={isCompleting}
            onCheckedChange={handleCheckChange}
            disabled={isCompleting}
            className="mt-1 transition-all duration-300"
          />
          <div className={`flex-1 transition-all duration-300 ${isCompleting ? "line-through text-muted-foreground" : ""}`}>
            <label htmlFor={`task-${task.id}`} className="font-medium cursor-pointer">
              {task.name}
            </label>
            <div className="mt-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  dueDateInfo.variant === "destructive"
                    ? "bg-destructive/10 text-destructive"
                    : dueDateInfo.variant === "default"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {dueDateInfo.text}
              </span>
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
              >
                Zrobię to jutro
              </Button>
              {isPostponeLimitReached && (
                <span className="text-xs text-destructive px-2">
                  Zadanie przełożone 3 razy!
                </span>
              )}
            </div>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="ghost" size="sm" onClick={() => onEdit(task.id)} disabled={true} className="flex-1 sm:flex-none">
              Edytuj
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)} disabled={true} className="flex-1 sm:flex-none">
              Usuń
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
