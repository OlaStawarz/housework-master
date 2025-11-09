import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getTaskById } from '../../../lib/services/tasksService';
import { validateSupabaseClient, successResponse, errorResponse, validationErrorResponse } from '../../../lib/utils';

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return errorResponse('Unauthorized', 'User not authenticated', 401);
    }

    const userId = session.user.id;

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

