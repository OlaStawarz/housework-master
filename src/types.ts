// src/types.ts
import type { Tables, TablesInsert, TablesUpdate } from './db/database.types';

// ---------------------------------------------------------
// ENUMS
// ---------------------------------------------------------
/** Jednostka powtarzalności zadania */
export type RecurrenceUnit = 'days' | 'months';
/** Fizyczny status zadania */
export type TaskStatus = 'pending' | 'postponed';
/** Styl tonu dla wiadomości motywacyjnej */
export type MotivationalTone = 'encouraging' | 'playful' | 'neutral';
/** Sekcja dashboardu */
export type DashboardSection = 'overdue' | 'upcoming' | 'all';

// ---------------------------------------------------------
// DTO (Data Transfer Objects) - odpowiedzi API
// ---------------------------------------------------------
/** Typ przestrzeni (systemowy, tylko do odczytu) */
export interface SpaceTypeDto extends Pick<Tables<'space_types'>, 'id' | 'code' | 'display_name' | 'icon' | 'display_order'> {}

/** Szablon zadania (systemowy, tylko do odczytu) */
export interface TaskTemplateDto extends Pick<Tables<'task_templates'>, 'id' | 'space_type' | 'task_name' | 'default_recurrence_value' | 'default_recurrence_unit' | 'display_order'> {}

/** Pełne dane przestrzeni użytkownika */
export interface SpaceDto extends Pick<Tables<'spaces'>, 'id' | 'user_id' | 'name' | 'space_type' | 'icon' | 'created_at' | 'updated_at'> {}

/** Zredukowane dane przestrzeni, używane w TaskDto.space */
export interface SpaceMinDto extends Pick<SpaceDto, 'id' | 'name' | 'space_type' | 'icon'> {}

/** Typ zadania zagnieżdżający minimalną przestrzeń */
export interface TaskDto extends Pick<Tables<'tasks'>, 'id' | 'space_id' | 'user_id' | 'name' | 'recurrence_value' | 'recurrence_unit' | 'due_date' | 'status' | 'postponement_count' | 'last_completed_at' | 'created_at' | 'updated_at'> {
  space: SpaceMinDto;
}

/** Wiadomość motywacyjna */
export interface MotivationalMessageDto extends Pick<Tables<'motivational_messages'>, 'id' | 'task_id' | 'message_text' | 'generated_at'> {}

/** Błąd przy masowym tworzeniu zadania */
export interface BulkCreateTaskErrorDto {
  code: string;
  message: string;
  template_id: string;
}

/** Wynik pojedynczego elementu masowego tworzenia zadania */
export type BulkCreateTaskResultDto =
  | { status: 201; task: TaskDto }
  | { status: 404; error: BulkCreateTaskErrorDto }
  | { status: 409; error: BulkCreateTaskErrorDto }
  | { status: 500; error: BulkCreateTaskErrorDto };

/** Odpowiedź 207 Multi-Status dla bulk-from-templates */
export interface BulkCreateTasksResponseDto {
  results: BulkCreateTaskResultDto[];
}

// ---------------------------------------------------------
// PAGINATION DTO
// ---------------------------------------------------------
/** Informacje o paginacji */
export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/** Lista przestrzeni użytkownika */
export interface SpaceListDto {
  data: SpaceDto[];
  pagination: PaginationDto;
}

/** Lista zadań */
export interface TaskListDto {
  data: TaskDto[];
  pagination: PaginationDto;
}

// ---------------------------------------------------------
// COMMAND MODELS - request payloady API
// ---------------------------------------------------------

/** Payload do utworzenia przestrzeni */
export type CreateSpaceCommand = Pick<
  TablesInsert<'spaces'>,
  'name' | 'space_type' | 'icon'
>;

/** Parametry dla utworzenia przestrzeni w serwisie */
export interface CreateSpaceParams {
  userId: string;
  command: CreateSpaceCommand;
}

/** Parametry dla aktualizacji przestrzeni w serwisie */
export interface UpdateSpaceParams {
  userId: string;
  spaceId: string;
  command: UpdateSpaceCommand;
}

/** Payload do aktualizacji przestrzeni */
export type UpdateSpaceCommand = Partial<Pick<
  TablesUpdate<'spaces'>,
  'name' | 'icon'
>>;

/** Parametry dla listowania szablonów zadań w serwisie */
export interface ListTaskTemplatesParams {
  spaceType?: string;
  sort?: string;
}

/** Parametry query dla GET /api/tasks */
export interface GetTasksQuery {
  space_id?: string;
  status?: TaskStatus;
  due_before?: string;
  due_after?: string;
  page?: number;
  limit?: number;
  sort?: 'due_date.asc' | 'due_date.desc' | 'recurrence.asc' | 'recurrence.desc';
}

/** Parametry dla funkcji getTasks w serwisie */
export interface GetTasksParams {
  userId: string;
  filters: GetTasksQuery;
}

/** Parametry dla masowego tworzenia zadań z szablonów */
export interface BulkCreateTasksParams {
  userId: string;
  spaceId: string;
  command: BulkCreateTasksCommand;
}

/** Payload do utworzenia pojedynczego zadania */
export type CreateTaskCommand = Pick<
  TablesInsert<'tasks'>,
  'space_id' | 'name' | 'recurrence_value' | 'recurrence_unit'
>;

/** Parametry dla utworzenia zadania w serwisie */
export interface CreateTaskParams {
  userId: string;
  command: CreateTaskCommand;
}

/** Pojedynczy element w bulk-from-templates */
export type BulkCreateTaskItemCommand = {
  override_recurrence_value?: number | null;
  override_recurrence_unit?: RecurrenceUnit | null;
};

/** Payload do masowego tworzenia z szablonów */
export type BulkCreateTasksCommand = {
  template_id: TaskTemplateDto['id'];
  items: BulkCreateTaskItemCommand[];
};

/** Payload do zmiany okresu powtarzalności zadania */
export type UpdateTaskRecurrenceCommand = Pick<
  TablesUpdate<'tasks'>,
  'recurrence_value' | 'recurrence_unit'
>;

/** Payload do ukończenia zadania (complete) */
export type CompleteTaskCommand = {
  completed_at?: string | null;
};

/** Payload do odroczenia zadania (postpone) - brak body */
export type PostponeTaskCommand = {};

/** Payload do wygenerowania wiadomości motywacyjnej */
export type GenerateMotivationalMessageCommand = {
  task_name: string;
  tone: MotivationalTone;
  max_length: number;
};
