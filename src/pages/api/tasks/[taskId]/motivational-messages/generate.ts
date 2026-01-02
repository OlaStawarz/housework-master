import type { APIRoute } from 'astro';
import { z } from 'zod';
import { generateMessage, AIAPIError, AIRateLimitError } from '../../../../../lib/services/motivationalMessageService';
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
 * Schema walidacji body request dla generowania wiadomości motywacyjnej
 */
const generateMessageBodySchema = z.object({
  task_name: z.string().min(1, { message: 'Task name is required' }),
  tone: z.enum(['encouraging', 'playful', 'neutral'], {
    errorMap: () => ({ message: 'Tone must be one of: encouraging, playful, neutral' }),
  }),
  max_length: z.number().int().min(10).max(150).default(150),
});

/**
 * POST /api/tasks/{taskId}/motivational-messages/generate
 * Generuje nową wiadomość motywacyjną dla zadania przy użyciu AI
 *
 * Path parameters:
 * - taskId (string, UUID): identyfikator zadania
 *
 * Body (JSON):
 * - task_name (string): nazwa zadania
 * - tone (string): ton wiadomości ('encouraging' | 'playful' | 'neutral')
 * - max_length (number, opcjonalne): maksymalna długość wiadomości (domyślnie 150)
 *
 * Responses:
 * - 201: wiadomość wygenerowana i zapisana pomyślnie
 * - 400: nieprawidłowe dane wejściowe
 * - 401: brak autoryzacji
 * - 404: zadanie nie istnieje lub nie należy do użytkownika
 * - 429: przekroczono limit zapytań do AI
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

    // Walidacja body request
    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return errorResponse('Invalid request', 'Request body must be valid JSON', 400);
    }

    const bodyValidationResult = generateMessageBodySchema.safeParse(body);

    if (!bodyValidationResult.success) {
      return validationErrorResponse(bodyValidationResult.error.errors);
    }

    const command = bodyValidationResult.data;

    // Generowanie wiadomości przez service layer
    const motivationalMessage = await generateMessage(supabase, {
      userId,
      taskId: validatedTaskId,
      command,
    });

    // Zwrócenie utworzonej wiadomości z kodem 201
    return successResponse(motivationalMessage, 201);

  } catch (error) {
    // Obsługa błędu nieznalezionego zadania
    if (error instanceof TaskNotFoundError) {
      return errorResponse('Not found', 'Task not found or does not belong to the user', 404);
    }

    console.error('Error in POST /api/tasks/{taskId}/motivational-messages/generate:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};
