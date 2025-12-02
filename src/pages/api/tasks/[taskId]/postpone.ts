import type { APIRoute } from 'astro';
import { z } from 'zod';
import { postponeTask, TaskNotFoundError, PostponementLimitError } from '../../../../lib/services/tasksService';
import { validateSupabaseClient, errorResponse, validationErrorResponse } from '../../../../lib/utils';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';

export const prerender = false;

/**
 * Schema walidacji parametru ścieżki taskId
 */
const taskIdParamSchema = z.object({
  taskId: z.string().uuid({ message: 'Invalid task ID format' }),
});

/**
 * POST /api/tasks/{taskId}/postpone
 * Odkłada zadanie o 1 dzień (maksymalnie 3 razy w bieżącym cyklu)
 * 
 * Path parameters:
 * - taskId (string, UUID): identyfikator zadania
 * 
 * Body: brak
 * 
 * Responses:
 * - 204: zadanie odłożone pomyślnie (brak treści odpowiedzi)
 * - 400: nieprawidłowy format taskId
 * - 401: brak autoryzacji
 * - 404: zadanie nie istnieje lub nie należy do użytkownika
 * - 422: limit odroczeń osiągnięty (>=3)
 * - 500: błąd serwera
 */
export const POST: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    const userId = DEFAULT_USER_ID;

    // Walidacja parametru ścieżki taskId
    const { taskId } = context.params;
    const paramsValidationResult = taskIdParamSchema.safeParse({ taskId });
    
    if (!paramsValidationResult.success) {
      return validationErrorResponse(paramsValidationResult.error.errors);
    }

    const validatedTaskId = paramsValidationResult.data.taskId;

    // Odroczenie zadania przez service layer
    await postponeTask(supabase, {
      userId,
      taskId: validatedTaskId,
      command: {},
    });

    // Zwrócenie 204 No Content
    return new Response(null, { status: 204 });

  } catch (error) {
    // Obsługa błędu nieznalezionego zadania
    if (error instanceof TaskNotFoundError) {
      return errorResponse('Not found', 'Task not found or does not belong to the user', 404);
    }

    // Obsługa błędu limitu odroczeń
    if (error instanceof PostponementLimitError) {
      return errorResponse('Unprocessable Entity', 'Postponement limit reached', 422);
    }

    console.error('Error in POST /api/tasks/{taskId}/postpone:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};

