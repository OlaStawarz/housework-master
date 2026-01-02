import type { APIRoute } from 'astro';
import { z } from 'zod';
import { completeTask, TaskNotFoundError } from '../../../../lib/services/tasksService';
import { validateSupabaseClient, errorResponse, validationErrorResponse } from '../../../../lib/utils';

export const prerender = false;

/**
 * Schema walidacji parametru ścieżki taskId
 */
const taskIdParamSchema = z.object({
  taskId: z.string().uuid({ message: 'Invalid task ID format' }),
});

/**
 * Schema walidacji body request dla completed_at
 */
const completeTaskBodySchema = z.object({
  completed_at: z.string().datetime().optional().nullable(),
});

/**
 * POST /api/tasks/{taskId}/complete
 * Oznacza zadanie jako ukończone w bieżącym cyklu
 * 
 * Path parameters:
 * - taskId (string, UUID): identyfikator zadania
 * 
 * Body (optional JSON):
 * - completed_at (string, ISO datetime | null): moment ukończenia (domyślnie: teraz)
 * 
 * Responses:
 * - 204: zadanie ukończone pomyślnie (brak treści odpowiedzi)
 * - 400: nieprawidłowy format taskId lub completed_at
 * - 401: brak autoryzacji
 * - 404: zadanie nie istnieje lub nie należy do użytkownika
 * - 500: błąd serwera
 */
export const POST: APIRoute = async (context) => {
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
    const paramsValidationResult = taskIdParamSchema.safeParse({ taskId });
    
    if (!paramsValidationResult.success) {
      return validationErrorResponse(paramsValidationResult.error.errors);
    }

    const validatedTaskId = paramsValidationResult.data.taskId;

    // Walidacja body request (opcjonalne)
    let command = {};
    try {
      const body = await context.request.json();
      const bodyValidationResult = completeTaskBodySchema.safeParse(body);

      if (!bodyValidationResult.success) {
        return validationErrorResponse(bodyValidationResult.error.errors);
      }

      command = bodyValidationResult.data;
    } catch (e) {
      // Body nie jest wymagane, więc jeśli nie ma lub jest puste, używamy domyślnych wartości
      command = {};
    }

    // Ukończenie zadania przez service layer
    await completeTask(supabase, {
      userId,
      taskId: validatedTaskId,
      command,
    });

    // Zwrócenie 204 No Content
    return new Response(null, { status: 204 });

  } catch (error) {
    // Obsługa błędu nieznalezionego zadania
    if (error instanceof TaskNotFoundError) {
      return errorResponse('Not found', 'Task not found or does not belong to the user', 404);
    }

    console.error('Error in POST /api/tasks/{taskId}/complete:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};

