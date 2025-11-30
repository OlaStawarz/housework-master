import { TaskCard } from "./TaskCard";
import type { TaskDto } from "@/types";

interface RecurrenceGroupProps {
  title: string;
  tasks: TaskDto[];
  onComplete: (taskId: string) => void;
  onPostpone: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function RecurrenceGroup({ title, tasks, onComplete, onPostpone, onEdit, onDelete }: RecurrenceGroupProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-muted-foreground">{title}</h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={onComplete}
            onPostpone={onPostpone}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
