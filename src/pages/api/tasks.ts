import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getTasks, PageOutOfRangeError, createTask, SpaceNotFoundError, DuplicateTaskError } from '../../lib/services/tasksService';
import { validateSupabaseClient, successResponse, errorResponse, validationErrorResponse } from '../../lib/utils';
import { DEFAULT_USER_ID } from '@/db/supabase.client';

export const prerender = false;

/**
 * Schema walidacji query parameters dla GET /api/tasks
 */
const getTasksQuerySchema = z.object({
  space_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'postponed']).optional(),
  due_before: z.string().datetime().optional(),
  due_after: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['due_date.asc', 'due_date.desc', 'recurrence.asc', 'recurrence.desc']).default('recurrence.asc'),
});

/**
 * Schema walidacji body dla POST /api/tasks
 */
const createTaskSchema = z.object({
  space_id: z.string().uuid({ message: 'Invalid space ID format' }),
  name: z.string().min(1, { message: 'Task name is required' }).max(200, { message: 'Task name is too long (max 200 characters)' }),
  recurrence_value: z.number().int().positive({ message: 'Recurrence value must be a positive integer' }),
  recurrence_unit: z.enum(['days', 'months'], { message: 'Recurrence unit must be either "days" or "months"' }),
});

/**
 * GET /api/tasks
 * Pobiera listę zadań użytkownika z opcjonalnym filtrowaniem, sortowaniem i paginacją
 * 
 * Query parameters:
 * - space_id (optional): string - UUID przestrzeni do filtrowania
 * - status (optional): "pending" | "postponed" - status zadania do filtrowania
 * - due_before (optional): ISO datetime - zwraca zadania z terminem przed wskazanym
 * - due_after (optional): ISO datetime - zwraca zadania z terminem po wskazanym
 * - page (optional): integer - numer strony (domyślnie 1)
 * - limit (optional): integer - liczba wyników na stronę (domyślnie 20, max 100)
 * - sort (optional): string - sortowanie (domyślnie "recurrence.asc")
 *   Dostępne wartości: due_date.asc, due_date.desc, recurrence.asc, recurrence.desc
 * 
 * Responses:
 * - 200: lista zadań (TaskListDto)
 * - 400: nieprawidłowe parametry query
 * - 401: brak autoryzacji
 * - 404: strona poza zakresem
 * - 500: błąd serwera
 */
export const GET: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    const userId = DEFAULT_USER_ID;

    // Walidacja parametrów query
    const url = new URL(context.request.url);
    const queryParams = {
      space_id: url.searchParams.get('space_id') || undefined,
      status: url.searchParams.get('status') || undefined,
      due_before: url.searchParams.get('due_before') || undefined,
      due_after: url.searchParams.get('due_after') || undefined,
      page: url.searchParams.get('page') || undefined,
      limit: url.searchParams.get('limit') || undefined,
      sort: url.searchParams.get('sort') || undefined,
    };

    const validationResult = getTasksQuerySchema.safeParse(queryParams);
    
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.errors);
    }

    const filters = validationResult.data;

    // Pobranie zadań z service layer
    const result = await getTasks(supabase, {
      userId,
      filters,
    });

    // Zwrócenie odpowiedzi w formacie { data: TaskDto[], pagination: PaginationDto }
    return successResponse(result, 200);

  } catch (error) {
    // Obsługa błędu strony poza zakresem
    if (error instanceof PageOutOfRangeError) {
      return errorResponse('Not found', error.message, 404);
    }

    console.error('Error in GET /api/tasks:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};

/**
 * POST /api/tasks
 * Tworzy nowe niestandardowe zadanie w wybranej przestrzeni użytkownika
 * 
 * Body (JSON):
 * - space_id (string, UUID): ID przestrzeni
 * - name (string, 1-200 znaków): nazwa zadania
 * - recurrence_value (integer, positive): wartość cykliczności
 * - recurrence_unit ("days" | "months"): jednostka cykliczności
 * 
 * Responses:
 * - 201: zadanie utworzone pomyślnie (TaskDto)
 * - 400: błąd walidacji payloadu
 * - 401: brak autoryzacji
 * - 404: przestrzeń nie istnieje lub nie należy do użytkownika
 * - 409: zadanie o tej nazwie już istnieje w przestrzeni
 * - 500: błąd serwera
 */
export const POST: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    const userId = DEFAULT_USER_ID;

    // Parsowanie i walidacja body
    let body;
    try {
      body = await context.request.json();
    } catch {
      return errorResponse('Invalid request', 'Request body must be valid JSON', 400);
    }

    const validationResult = createTaskSchema.safeParse(body);
    
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.errors);
    }

    const command = validationResult.data;

    // Utworzenie zadania przez service layer
    const task = await createTask(supabase, {
      userId,
      command,
    });

    // Zwrócenie zadania z kodem 201 Created
    return successResponse(task, 201);

  } catch (error) {
    // Obsługa błędu nieznalezionej przestrzeni
    if (error instanceof SpaceNotFoundError) {
      return errorResponse('Not found', error.message, 404);
    }

    // Obsługa błędu duplikatu nazwy zadania
    if (error instanceof DuplicateTaskError) {
      return errorResponse('Conflict', error.message, 409);
    }

    console.error('Error in POST /api/tasks:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};

