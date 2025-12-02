import type { SupabaseClient } from '../../db/supabase.client';
import type { 
  TaskDto, 
  BulkCreateTasksParams, 
  BulkCreateTaskResultDto,
  BulkCreateTasksResponseDto,
  GetTasksParams,
  TaskListDto,
  PaginationDto,
  SpaceMinDto,
  CreateTaskParams,
  CompleteTaskCommand,
  PostponeTaskCommand
} from '../../types';

/**
 * Custom error class dla duplikatów zadań
 */
export class DuplicateTaskError extends Error {
  constructor(taskName: string) {
    super(`Zadanie z nazwą '${taskName}' już istnieje w tej przestrzeni`);
    this.name = 'DuplicateTaskError';
  }
}

/**
 * Custom error class dla nieznalezionej przestrzeni (bulk operations)
 */
export class SpaceNotFoundForBulkError extends Error {
  constructor() {
    super('Przestrzeń nie znaleziona');
    this.name = 'SpaceNotFoundForBulkError';
  }
}

/**
 * Custom error class dla nieznalezionej przestrzeni
 */
export class SpaceNotFoundError extends Error {
  constructor(spaceId: string) {
    super(`Przestrzeń z ID '${spaceId}' nie istnieje lub nie należy do użytkownika`);
    this.name = 'SpaceNotFoundError';
  }
}

/**
 * Custom error class dla nieznalezionego szablonu
 */
export class TemplateNotFoundError extends Error {
  constructor(templateId: string) {
    super(`Szablon z ID '${templateId}' nie istnieje`);
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Custom error class dla strony poza zakresem
 */
export class PageOutOfRangeError extends Error {
  constructor(requestedPage: number, maxPage: number) {
    super(`Strona ${requestedPage} jest poza zakresem. Maksymalna strona to ${maxPage}`);
    this.name = 'PageOutOfRangeError';
  }
}

/**
 * Custom error class dla nieznalezionego zadania
 */
export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Zadanie z ID '${taskId}' nie istnieje lub nie należy do użytkownika`);
    this.name = 'TaskNotFoundError';
  }
}

/**
 * Custom error class dla osiągnięcia limitu odroczeń
 */
export class PostponementLimitError extends Error {
  constructor() {
    super('Osiągnięto maksymalny limit odroczeń (3) dla tego zadania w bieżącym cyklu');
    this.name = 'PostponementLimitError';
  }
}

/**
 * Parametry dla funkcji completeTask
 */
export interface CompleteTaskParams {
  userId: string;
  taskId: string;
  command: CompleteTaskCommand;
}

/**
 * Parametry dla funkcji postponeTask
 */
export interface PostponeTaskParams {
  userId: string;
  taskId: string;
  command: PostponeTaskCommand;
}

/**
 * Oblicza due_date jako bieżący czas + okres cykliczności
 */
function calculateDueDate(recurrenceValue: number, recurrenceUnit: 'days' | 'months'): Date {
  const now = new Date();
  
  if (recurrenceUnit === 'days') {
    now.setDate(now.getDate() + recurrenceValue);
  } else if (recurrenceUnit === 'months') {
    now.setMonth(now.getMonth() + recurrenceValue);
  }
  
  return now;
}

/**
 * Masowo tworzy zadania na podstawie szablonów dla wskazanej przestrzeni
 * Zwraca 207 Multi-Status z per-item wynikami
 * 
 * @param supabase - Klient Supabase
 * @param params - Parametry BulkCreateTasksParams
 * @returns Promise z BulkCreateTasksResponseDto zawierającym wyniki dla każdej pozycji
 */
export async function bulkCreateFromTemplates(
  supabase: SupabaseClient,
  params: BulkCreateTasksParams
): Promise<BulkCreateTasksResponseDto> {
  const { userId, spaceId, command } = params;
  const results: BulkCreateTaskResultDto[] = [];

  // Weryfikacja czy przestrzeń należy do użytkownika + pobranie danych dla TaskDto
  const { data: space, error: spaceError } = await supabase
    .from('spaces')
    .select('id, name, space_type, icon')
    .eq('id', spaceId)
    .eq('user_id', userId)
    .single();

  if (spaceError || !space) {
    throw new SpaceNotFoundForBulkError();
  }

  // Przetwarzanie każdej pozycji - każda ma własny template_id
  for (const item of command.items) {
    try {
      // Pobranie szablonu dla tego konkretnego item
      const { data: template, error: templateError } = await supabase
        .from('task_templates')
        .select('id, task_name, default_recurrence_value, default_recurrence_unit')
        .eq('id', item.template_id)
        .single();

      if (templateError || !template) {
        results.push({
          status: 404,
          error: {
            code: 'template_not_found',
            message: `Szablon z ID '${item.template_id}' nie istnieje`,
            template_id: item.template_id,
          },
        });
        continue;
      }

      // Ustalenie wartości cykliczności (override lub default)
      const recurrenceValue = item.override_recurrence_value ?? template.default_recurrence_value;
      const recurrenceUnit = item.override_recurrence_unit ?? template.default_recurrence_unit;

      // Obliczenie due_date
      const dueDate = calculateDueDate(recurrenceValue, recurrenceUnit as 'days' | 'months');

      // Próba INSERT zadania
      const { data: newTask, error: insertError } = await supabase
        .from('tasks')
        .insert({
          space_id: spaceId,
          user_id: userId,
          name: template.task_name,
          recurrence_value: recurrenceValue,
          recurrence_unit: recurrenceUnit,
          due_date: dueDate.toISOString(),
          status: 'pending',
          postponement_count: 0,
        })
        .select()
        .single();

      if (insertError) {
        // UNIQUE constraint violation (space_id, name)
        if ((insertError as any).code === '23505') {
          results.push({
            status: 409,
            error: {
              code: 'duplicate_task',
              message: `Zadanie z nazwą '${template.task_name}' już istnieje w tej przestrzeni`,
              template_id: item.template_id,
            },
          });
        } else {
          results.push({
            status: 500,
            error: {
              code: 'internal_error',
              message: 'Błąd przy tworzeniu zadania',
              template_id: item.template_id,
            },
          });
        }
        continue;
      }

      // Sukces - zwrócenie stworzonego zadania z zagnieżdżoną przestrzenią
      results.push({
        status: 201,
        task: {
          id: newTask.id,
          space_id: newTask.space_id,
          user_id: newTask.user_id,
          name: newTask.name,
          recurrence_value: newTask.recurrence_value,
          recurrence_unit: newTask.recurrence_unit,
          due_date: newTask.due_date,
          status: newTask.status,
          postponement_count: newTask.postponement_count,
          last_completed_at: newTask.last_completed_at,
          created_at: newTask.created_at,
          updated_at: newTask.updated_at,
          space: {
            id: space.id,
            name: space.name,
            space_type: space.space_type,
            icon: space.icon,
          },
        } as TaskDto,
      });

    } catch (error) {
      console.error(`Error processing template ${item.template_id}:`, error);
      results.push({
        status: 500,
        error: {
          code: 'internal_error',
          message: 'Nieoczekiwany błąd przy przetwarzaniu szablonu',
          template_id: item.template_id,
        },
      });
    }
  }

  return { results };
}

/**
 * Pobiera listę zadań użytkownika z opcjonalnym filtrowaniem, sortowaniem i paginacją
 * 
 * @param supabase - Klient Supabase
 * @param params - Parametry zapytania (userId, filters)
 * @returns Promise z danymi zadań i informacjami o paginacji
 * @throws PageOutOfRangeError jeśli numer strony przekracza liczbę dostępnych stron
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 */
export async function getTasks(
  supabase: SupabaseClient,
  params: GetTasksParams
): Promise<TaskListDto> {
  const { userId, filters } = params;
  const {
    space_id,
    status,
    due_before,
    due_after,
    page = 1,
    limit = 20,
    sort = 'recurrence.asc'
  } = filters;

  // Ograniczenie maksymalnego limitu
  const effectiveLimit = Math.min(limit, 100);

  // Przygotowanie zapytania bazowego z join do spaces
  let query = supabase
    .from('tasks')
    .select(`
      *,
      space:spaces!inner(
        id,
        name,
        space_type,
        icon
      )
    `, { count: 'exact' })
    .eq('user_id', userId);

  // Filtrowanie po space_id
  if (space_id) {
    query = query.eq('space_id', space_id);
  }

  // Filtrowanie po status
  if (status) {
    query = query.eq('status', status);
  }

  // Filtrowanie po due_before
  if (due_before) {
    query = query.lt('due_date', due_before);
  }

  // Filtrowanie po due_after
  if (due_after) {
    query = query.gt('due_date', due_after);
  }

  // Sortowanie
  if (sort === 'recurrence.asc') {
    // Sortowanie po cykliczności rosnąco: najpierw days, potem months, potem po wartości rosnąco
    query = query.order('recurrence_unit', { ascending: true });
    query = query.order('recurrence_value', { ascending: true });
  } else if (sort === 'recurrence.desc') {
    // Sortowanie po cykliczności malejąco: najpierw months, potem days, potem po wartości malejąco
    query = query.order('recurrence_unit', { ascending: false });
    query = query.order('recurrence_value', { ascending: false });
  } else {
    // Standardowe sortowanie
    const [sortField, sortDirection] = sort.split('.') as [string, 'asc' | 'desc'];
    query = query.order(sortField, { ascending: sortDirection === 'asc' });
  }

  // Paginacja - obliczanie zakresu
  const from = (page - 1) * effectiveLimit;
  const to = from + effectiveLimit - 1;
  query = query.range(from, to);

  // Wykonanie zapytania
  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks from database');
  }

  // Obliczenie całkowitej liczby stron
  const total = count || 0;
  const totalPages = Math.ceil(total / effectiveLimit) || 1;

  // Walidacja: sprawdzenie czy żądana strona istnieje
  if (total > 0 && page > totalPages) {
    throw new PageOutOfRangeError(page, totalPages);
  }

  // Mapowanie danych na TaskDto
  const tasks: TaskDto[] = (data || []).map((task) => {
    // Wyciągnięcie danych przestrzeni z relacji
    const spaceData = Array.isArray(task.space) ? task.space[0] : task.space;
    
    return {
      id: task.id,
      space_id: task.space_id,
      user_id: task.user_id,
      name: task.name,
      recurrence_value: task.recurrence_value,
      recurrence_unit: task.recurrence_unit,
      due_date: task.due_date,
      status: task.status,
      postponement_count: task.postponement_count,
      last_completed_at: task.last_completed_at,
      created_at: task.created_at,
      updated_at: task.updated_at,
      space: {
        id: spaceData.id,
        name: spaceData.name,
        space_type: spaceData.space_type,
        icon: spaceData.icon,
      } as SpaceMinDto,
    };
  });

  // Przygotowanie informacji o paginacji
  const pagination: PaginationDto = {
    page,
    limit: effectiveLimit,
    total,
    total_pages: totalPages,
  };

  return {
    data: tasks,
    pagination,
  };
}

/**
 * Pobiera pojedyncze zadanie po ID dla danego użytkownika
 * 
 * @param supabase - Klient Supabase
 * @param userId - ID użytkownika
 * @param taskId - ID zadania
 * @returns Promise z TaskDto lub null jeśli nie znaleziono
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 */
export async function getTaskById(
  supabase: SupabaseClient,
  userId: string,
  taskId: string
): Promise<TaskDto | null> {
  // Zapytanie z join do spaces
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      space:spaces!inner(
        id,
        name,
        space_type,
        icon
      )
    `)
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();

  if (error) {
    // Jeśli rekord nie istnieje (PGRST116) lub nie należy do użytkownika
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching task by ID:', error);
    throw new Error('Failed to fetch task from database');
  }

  if (!data) {
    return null;
  }

  // Wyciągnięcie danych przestrzeni z relacji
  const spaceData = Array.isArray(data.space) ? data.space[0] : data.space;

  // Mapowanie na TaskDto
  const task: TaskDto = {
    id: data.id,
    space_id: data.space_id,
    user_id: data.user_id,
    name: data.name,
    recurrence_value: data.recurrence_value,
    recurrence_unit: data.recurrence_unit,
    due_date: data.due_date,
    status: data.status,
    postponement_count: data.postponement_count,
    last_completed_at: data.last_completed_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
    space: {
      id: spaceData.id,
      name: spaceData.name,
      space_type: spaceData.space_type,
      icon: spaceData.icon,
    } as SpaceMinDto,
  };

  return task;
}

/**
 * Tworzy nowe niestandardowe zadanie w wybranej przestrzeni użytkownika
 * 
 * @param supabase - Klient Supabase
 * @param params - Parametry CreateTaskParams (userId, command)
 * @returns Promise z TaskDto
 * @throws SpaceNotFoundError jeśli przestrzeń nie istnieje lub nie należy do użytkownika
 * @throws DuplicateTaskError jeśli zadanie o tej nazwie już istnieje w przestrzeni
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 */
export async function createTask(
  supabase: SupabaseClient,
  params: CreateTaskParams
): Promise<TaskDto> {
  const { userId, command } = params;
  const { space_id, name, recurrence_value, recurrence_unit } = command;

  // Sprawdzenie istnienia i własności przestrzeni
  const { data: space, error: spaceError } = await supabase
    .from('spaces')
    .select('id, name, space_type, icon')
    .eq('id', space_id)
    .eq('user_id', userId)
    .single();

  if (spaceError || !space) {
    throw new SpaceNotFoundError(space_id);
  }

  // Obliczenie due_date na podstawie cykliczności
  const dueDate = calculateDueDate(recurrence_value, recurrence_unit as 'days' | 'months');

  // Wstawienie nowego zadania
  const { data: newTask, error: insertError } = await supabase
    .from('tasks')
    .insert({
      space_id,
      user_id: userId,
      name,
      recurrence_value,
      recurrence_unit,
      due_date: dueDate.toISOString(),
      status: 'pending',
      postponement_count: 0,
    })
    .select()
    .single();

  if (insertError) {
    // Obsługa błędu unikalności UNIQUE(space_id, name)
    if ((insertError as any).code === '23505') {
      throw new DuplicateTaskError(name);
    }
    
    console.error('Error creating task:', insertError);
    throw new Error('Failed to create task in database');
  }

  // Mapowanie na TaskDto z zagnieżdżonym SpaceMinDto
  const task: TaskDto = {
    id: newTask.id,
    space_id: newTask.space_id,
    user_id: newTask.user_id,
    name: newTask.name,
    recurrence_value: newTask.recurrence_value,
    recurrence_unit: newTask.recurrence_unit,
    due_date: newTask.due_date,
    status: newTask.status,
    postponement_count: newTask.postponement_count,
    last_completed_at: newTask.last_completed_at,
    created_at: newTask.created_at,
    updated_at: newTask.updated_at,
    space: {
      id: space.id,
      name: space.name,
      space_type: space.space_type,
      icon: space.icon,
    } as SpaceMinDto,
  };

  return task;
}

/**
 * Oznacza zadanie jako ukończone w bieżącym cyklu
 * Po wykonaniu:
 * - last_completed_at zostaje ustawione na completed_at (lub now)
 * - postponement_count zostaje zresetowany do 0
 * - obliczany jest nowy due_date = last_completed_at + recurrence_value * unit
 * - status pozostaje pending
 * 
 * @param supabase - Klient Supabase
 * @param params - Parametry CompleteTaskParams (userId, taskId, command)
 * @returns Promise<void>
 * @throws TaskNotFoundError jeśli zadanie nie istnieje lub nie należy do użytkownika
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 */
export async function completeTask(
  supabase: SupabaseClient,
  params: CompleteTaskParams
): Promise<void> {
  const { userId, taskId, command } = params;
  const { completed_at } = command;

  // Pobranie zadania (weryfikacja istnienia i własności)
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('id, recurrence_value, recurrence_unit')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !task) {
    throw new TaskNotFoundError(taskId);
  }

  // Określenie completed_at (przekazana wartość lub teraz)
  const completedDate = completed_at ? new Date(completed_at) : new Date();

  // Obliczenie nowego due_date na podstawie completed_at + recurrence
  const newDueDate = new Date(completedDate);
  if (task.recurrence_unit === 'days') {
    newDueDate.setDate(newDueDate.getDate() + task.recurrence_value);
  } else if (task.recurrence_unit === 'months') {
    newDueDate.setMonth(newDueDate.getMonth() + task.recurrence_value);
  }

  // Aktualizacja zadania
  const { error: updateError } = await supabase
    .from('tasks')
    .update({
      last_completed_at: completedDate.toISOString(),
      postponement_count: 0,
      due_date: newDueDate.toISOString(),
      status: 'pending'
    })
    .eq('id', taskId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error completing task:', updateError);
    throw new Error('Failed to complete task in database');
  }
}

/**
 * Odkłada zadanie o 1 dzień (maksymalnie 3 razy w bieżącym cyklu)
 * Po odroczeniu:
 * - postponement_count jest inkrementowany o 1
 * - due_date jest przesuwany o 1 dzień
 * - status zmieniany na postponed
 * 
 * @param supabase - Klient Supabase
 * @param params - Parametry PostponeTaskParams (userId, taskId, command)
 * @returns Promise<void>
 * @throws TaskNotFoundError jeśli zadanie nie istnieje lub nie należy do użytkownika
 * @throws PostponementLimitError jeśli osiągnięto limit 3 odroczeń
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 */
export async function postponeTask(
  supabase: SupabaseClient,
  params: PostponeTaskParams
): Promise<void> {
  const { userId, taskId } = params;

  // Pobranie zadania (weryfikacja istnienia, własności i postponement_count)
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('id, postponement_count')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !task) {
    throw new TaskNotFoundError(taskId);
  }

  // Sprawdzenie limitu odroczeń
  if (task.postponement_count >= 3) {
    throw new PostponementLimitError();
  }

  // Obliczenie nowego due_date (dzisiaj + 1 dzień)
  // Zawsze liczone od obecnego dnia, nie od starego due_date
  const today = new Date();
  const newDueDate = new Date(today);
  newDueDate.setDate(newDueDate.getDate() + 1);

  // Aktualizacja zadania
  const { error: updateError } = await supabase
    .from('tasks')
    .update({
      postponement_count: task.postponement_count + 1,
      due_date: newDueDate.toISOString(),
      status: 'postponed'
    })
    .eq('id', taskId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error postponing task:', updateError);
    throw new Error('Failed to postpone task in database');
  }
}