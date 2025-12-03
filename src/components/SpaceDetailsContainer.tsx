import { useMemo, useState } from "react";
import { useSpace } from "./hooks/useSpace";
import { useTasks } from "./hooks/useTasks";
import { useDeleteSpace } from "./hooks/useDeleteSpace";
import { useTaskMutations } from "./hooks/useTaskMutations";
import { groupTasksByRecurrence } from "@/lib/utils/groupTasksByRecurrence";
import { SpaceHeader } from "./SpaceHeader";
import { RecurrenceGroup } from "./RecurrenceGroup";
import { EmptySpaceState } from "./EmptySpaceState";
import { TasksLoadingSkeleton } from "./TasksLoadingSkeleton";
import { CreateTaskModal } from "./CreateTaskModal";
import { EditTaskRecurrenceModal } from "./EditTaskRecurrenceModal";
import { ConfirmDeleteSpaceDialog } from "./ConfirmDeleteSpaceDialog";
import { ConfirmDeleteTaskDialog } from "./ConfirmDeleteTaskDialog";
import { Button } from "@/components/ui/button";
import type { TaskDto } from "@/types";

interface SpaceDetailsContainerProps {
  spaceId: string;
}

export function SpaceDetailsContainer({ spaceId }: SpaceDetailsContainerProps) {
  const { space, isLoading: isLoadingSpace, error: spaceError } = useSpace(spaceId);
  const {
    tasks,
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch,
  } = useTasks({
    spaceId,
    sort: "recurrence.asc",
  });

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskDto | null>(null);

  // Hook do usuwania przestrzeni
  const { deleteSpace, isDeleting } = useDeleteSpace({
    spaceId,
  });

  // Hook do mutacji zadań (complete, postpone, update, delete)
  const { completeTask, postponeTask, updateTask, deleteTask, isDeletingTask } = useTaskMutations({
    onPostponeSuccess: refetch, // Po sukcesie postpone odśwież listę zadań
    onUpdateSuccess: refetch, // Po sukcesie update odśwież listę zadań
    onDeleteSuccess: refetch, // Po sukcesie delete odśwież listę zadań
  });

  // Grupowanie zadań (memoizowane)
  const groupedTasks = useMemo(() => {
    if (tasks.length === 0) return [];
    return groupTasksByRecurrence(tasks);
  }, [tasks]);

  // Handlery zadań
  const handleComplete = async (taskId: string) => {
    await completeTask(taskId);
  };

  const handlePostpone = async (taskId: string) => {
    await postponeTask(taskId);
  };

  const handleEdit = (taskId: string) => {
    const taskToEdit = tasks.find((t) => t.id === taskId);
    if (taskToEdit) {
      setEditingTask(taskToEdit);
    }
  };

  const handleDelete = (taskId: string) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    if (taskToDelete) {
      setDeletingTask(taskToDelete);
    }
  };

  const handleCloseEditModal = () => {
    setEditingTask(null);
  };

  const handleCloseDeleteTaskDialog = () => {
    setDeletingTask(null);
  };

  const handleConfirmDeleteTask = async () => {
    if (deletingTask) {
      await deleteTask(deletingTask.id);
      setDeletingTask(null);
    }
  };

  const handleTaskUpdated = () => {
    refetch();
  };

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    await deleteSpace();
    // Modal zamknie się automatycznie po przekierowaniu
  };

  const handleCreateTask = () => {
    setIsCreateTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsCreateTaskModalOpen(false);
  };

  const handleTaskCreated = () => {
    refetch();
  };

  // Stan ładowania przestrzeni
  if (isLoadingSpace) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full animate-pulse" />
            <div className="h-9 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Błąd przestrzeni (404)
  if (spaceError || !space) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="text-6xl mb-6" role="img" aria-label="Błąd">
            ⚠️
          </div>
          <h2 className="text-2xl font-semibold mb-2">{spaceError || "Przestrzeń nie znaleziona"}</h2>
          <p className="text-muted-foreground mb-6">Przestrzeń mogła zostać usunięta lub nie masz do niej dostępu.</p>
          <Button onClick={() => (window.location.href = "/spaces")}>Wróć do listy przestrzeni</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <SpaceHeader space={space} onDeleteSpace={handleOpenDeleteModal} />

      {/* Przycisk dodawania zadania */}
      <div className="mb-6">
        <Button onClick={handleCreateTask}>Dodaj zadanie</Button>
      </div>

      {/* Lista zadań */}
      {isLoadingTasks && <TasksLoadingSkeleton />}

      {tasksError && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="text-6xl mb-6" role="img" aria-label="Błąd">
            ⚠️
          </div>
          <h2 className="text-2xl font-semibold mb-2">Nie udało się załadować zadań</h2>
          <p className="text-muted-foreground mb-6">{tasksError}</p>
          <Button onClick={refetch}>Spróbuj ponownie</Button>
        </div>
      )}

      {!isLoadingTasks && !tasksError && groupedTasks.length === 0 && <EmptySpaceState />}

      {!isLoadingTasks && !tasksError && groupedTasks.length > 0 && (
        <div className="space-y-8">
          {groupedTasks.map((group) => (
            <RecurrenceGroup
              key={group.recurrenceKey}
              title={group.title}
              tasks={group.tasks}
              onComplete={handleComplete}
              onPostpone={handlePostpone}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal tworzenia zadania */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={handleCloseTaskModal}
        spaceId={spaceId}
        onTaskCreated={handleTaskCreated}
      />

      {/* Modal potwierdzenia usunięcia przestrzeni */}
      <ConfirmDeleteSpaceDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        spaceName={space.name}
        isDeleting={isDeleting}
      />

      {/* Modal edycji zadania */}
      <EditTaskRecurrenceModal
        isOpen={editingTask !== null}
        onClose={handleCloseEditModal}
        task={editingTask}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Dialog potwierdzenia usunięcia zadania */}
      <ConfirmDeleteTaskDialog
        isOpen={deletingTask !== null}
        onClose={handleCloseDeleteTaskDialog}
        onConfirm={handleConfirmDeleteTask}
        taskName={deletingTask?.name || ""}
        isDeleting={isDeletingTask}
      />
    </div>
  );
}
