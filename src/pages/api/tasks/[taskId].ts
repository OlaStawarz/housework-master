import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getTaskById, updateTaskRecurrence, deleteTask, TaskNotFoundError } from '../../../lib/services/tasksService';
import { validateSupabaseClient, successResponse, errorResponse, validationErrorResponse } from '../../../lib/utils';
import { editTaskSchema } from '../tasks';

export const prerender = false;

/**
 * Schema walidacji parametru ścieżki taskId
 */
const getTaskParamsSchema = z.object({
  taskId: z.string().uuid({ message: 'Invalid task ID format' }),
});

/**
 * GET /api/tasks/{taskId}
 * Pobiera pojedyncze zadanie użytkownika po ID
 * 
 * Path parameters:
 * - taskId (string, UUID): identyfikator zadania
 * 
 * Responses:
 * - 200: zadanie znalezione (TaskDto)
 * - 400: nieprawidłowy format taskId (nie-UUID)
 * - 401: brak autoryzacji
 * - 404: zadanie nie istnieje lub nie należy do użytkownika
 * - 500: błąd serwera
 */
export const GET: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    // Guard clause - sprawdzenie autoryzacji
    const user = context.locals.user;
    if (!user) {
      return errorResponse('Unauthorized', 'User not authenticated', 401);
    }

    const userId = user.id;

    // Walidacja parametru ścieżki taskId
    const { taskId } = context.params;
    const validationResult = getTaskParamsSchema.safeParse({ taskId });
    
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.errors);
    }

    const validatedTaskId = validationResult.data.taskId;

    // Pobranie zadania z service layer
    const task = await getTaskById(supabase, userId, validatedTaskId);

    // Guard clause - sprawdzenie czy zadanie istnieje
    if (!task) {
      return errorResponse('Not found', 'Task not found or does not belong to the user', 404);
    }

    // Zwrócenie zadania
    return successResponse(task, 200);

  } catch (error) {
    console.error('Error in GET /api/tasks/{taskId}:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};

/**
 * PATCH /api/tasks/{taskId}
 * Aktualizuje cykliczność zadania (recurrence_value, recurrence_unit)
 * Przelicza nowy due_date bazując na last_completed_at lub now
 * 
 * Path parameters:
 * - taskId (string, UUID): identyfikator zadania
 * 
 * Body:
 * - recurrence_value (number): nowa wartość cykliczności (dodatnia liczba całkowita)
 * - recurrence_unit ("days" | "months"): nowa jednostka cykliczności
 * 
 * Responses:
 * - 200: zadanie zaktualizowane (TaskDto)
 * - 400: nieprawidłowy format taskId (nie-UUID)
 * - 401: brak autoryzacji
 * - 404: zadanie nie istnieje lub nie należy do użytkownika
 * - 422: nieprawidłowe wartości cykliczności
 * - 500: błąd serwera
 */
export const PATCH: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    const user = context.locals.user;
    if (!user) {
      return errorResponse('Unauthorized', 'User not logged in', 401);
    }
    const userId = user.id;

    // Walidacja parametru ścieżki taskId
    const { taskId } = context.params;
    const paramsValidation = getTaskParamsSchema.safeParse({ taskId });
    
    if (!paramsValidation.success) {
      return validationErrorResponse(paramsValidation.error.errors);
    }

    const validatedTaskId = paramsValidation.data.taskId;

    // Parsowanie i walidacja body
    let body;
    try {
      body = await context.request.json();
    } catch (err) {
      return errorResponse('Invalid JSON', 'Request body must be valid JSON', 400);
    }

    // Walidacja body używając istniejącego editTaskSchema
    const bodyValidation = editTaskSchema.safeParse(body);
    
    if (!bodyValidation.success) {
      return validationErrorResponse(bodyValidation.error.errors);
    }

    const command = bodyValidation.data;

    // Aktualizacja zadania poprzez service layer
    try {
      const updatedTask = await updateTaskRecurrence(supabase, {
        userId,
        taskId: validatedTaskId,
        command,
      });

      return successResponse(updatedTask, 200);
    } catch (error) {
      if (error instanceof TaskNotFoundError) {
        return errorResponse('Not found', 'Task not found or does not belong to the user', 404);
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in PATCH /api/tasks/{taskId}:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};

/**
 * DELETE /api/tasks/{taskId}
 * Usuwa zadanie użytkownika
 * 
 * Path parameters:
 * - taskId (string, UUID): identyfikator zadania
 * 
 * Responses:
 * - 204: zadanie usunięte pomyślnie (No Content)
 * - 400: nieprawidłowy format taskId (nie-UUID)
 * - 401: brak autoryzacji
 * - 404: zadanie nie istnieje lub nie należy do użytkownika
 * - 500: błąd serwera
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    const userId =DEFAULT_USER_ID;

    // Walidacja parametru ścieżki taskId
    const { taskId } = context.params;
    const paramsValidation = getTaskParamsSchema.safeParse({ taskId });
    
    if (!paramsValidation.success) {
      return validationErrorResponse(paramsValidation.error.errors);
    }

    const validatedTaskId = paramsValidation.data.taskId;

    // Usunięcie zadania poprzez service layer
    try {
      await deleteTask(supabase, {
        userId,
        taskId: validatedTaskId,
      });

      // 204 No Content - brak body w odpowiedzi
      return new Response(null, { status: 204 });
    } catch (error) {
      if (error instanceof TaskNotFoundError) {
        return errorResponse('Not found', 'Task not found or does not belong to the user', 404);
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in DELETE /api/tasks/{taskId}:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};

