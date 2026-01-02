import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getLatestMessage, MotivationalMessageNotFoundError } from '../../../../../lib/services/motivationalMessageService';
import { validateSupabaseClient, errorResponse, validationErrorResponse, successResponse } from '../../../../../lib/utils';
import { TaskNotFoundError } from '@/lib/services/tasksService';

export const prerender = false;

/**
 * Schema walidacji parametru ścieżki taskId
 */
const taskIdParamSchema = z.object({
  taskId: z.string().uuid({ message: 'Invalid task ID format' }),
});

/**
 * GET /api/tasks/{taskId}/motivational-messages/latest
 * Pobiera najnowszą wiadomość motywacyjną dla zadania
 *
 * Path parameters:
 * - taskId (string, UUID): identyfikator zadania
 *
 * Responses:
 * - 200: MotivationalMessageDto najnowszej wiadomości
 * - 400: nieprawidłowy format taskId
 * - 401: brak autoryzacji
 * - 404: zadanie nie istnieje lub brak wiadomości dla zadania
 * - 500: błąd serwera
 */
export const GET: APIRoute = async (context) => {
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

    // Pobranie najnowszej wiadomości przez service layer
    const motivationalMessage = await getLatestMessage(supabase, {
      userId,
      taskId: validatedTaskId,
    });

    // Zwrócenie wiadomości z kodem 200
    return successResponse(motivationalMessage, 200);

  } catch (error) {
    // Obsługa błędów związanych z brakiem zadania lub wiadomości
    if (error instanceof TaskNotFoundError) {
      return errorResponse('Not found', 'Task not found or does not belong to the user', 404);
    }
    if (error instanceof MotivationalMessageNotFoundError) {
      return errorResponse('Not found', 'No motivational messages found for this task', 404);
    }

    console.error('Error in GET /api/tasks/{taskId}/motivational-messages/latest:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};
