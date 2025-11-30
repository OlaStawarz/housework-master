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

  return (
    <div className={`p-4 border rounded-lg ${isOverdue ? "border-destructive bg-destructive/5" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Checkbox
            id={`task-${task.id}`}
            checked={false}
            onCheckedChange={() => onComplete(task.id)}
            disabled
            className="mt-1"
          />
          <div className="flex-1">
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

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onPostpone(task.id)} disabled>
            Zrobię to jutro
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(task.id)} disabled>
            Edytuj
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)} disabled>
            Usuń
          </Button>
        </div>
      </div>
    </div>
  );
}
