import type { TaskDto, RecurrenceUnit } from "@/types";

export interface TaskGroup {
  title: string;
  recurrenceKey: string;
  tasks: TaskDto[];
}

export type GroupedTasksList = TaskGroup[];

/**
 * Formatuje tekst cykliczności do czytelnej formy z poprawną odmianą
 */
function formatRecurrenceTitle(value: number, unit: RecurrenceUnit): string {
  if (unit === "days") {
    if (value === 1) return "Codziennie";
    if (value === 7) return "Co tydzień";
    if (value === 14) return "Co 2 tygodnie";
    return `Co ${value} dni`;
  }

  // unit === "months"
  if (value === 1) return "Co miesiąc";
  return `Co ${value} miesiąc`;
}

/**
 * Grupuje zadania według ich cykliczności
 * Zakłada, że zadania są już posortowane przez API (recurrence.asc)
 */
export function groupTasksByRecurrence(tasks: TaskDto[]): GroupedTasksList {
  const groups = new Map<string, TaskDto[]>();

  tasks.forEach((task) => {
    const key = `${task.recurrence_unit}-${task.recurrence_value}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)!.push(task);
  });

  // Konwersja Map na tablicę z tytułami
  const result: GroupedTasksList = [];

  groups.forEach((tasks, key) => {
    const firstTask = tasks[0];
    const title = formatRecurrenceTitle(firstTask.recurrence_value, firstTask.recurrence_unit as RecurrenceUnit);

    result.push({
      title,
      recurrenceKey: key,
      tasks,
    });
  });

  // Sortowanie grup: najpierw dni, potem miesiące, każda rosnąco po wartości
  result.sort((a, b) => {
    const [unitA, valueA] = a.recurrenceKey.split("-") as [RecurrenceUnit, string];
    const [unitB, valueB] = b.recurrenceKey.split("-") as [RecurrenceUnit, string];

    // Najpierw sortuj po jednostce (days przed months)
    if (unitA !== unitB) {
      return unitA === "days" ? -1 : 1;
    }

    // Potem po wartości
    return parseInt(valueA) - parseInt(valueB);
  });

  return result;
}
