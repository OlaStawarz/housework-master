import type { APIRoute } from 'astro';
import { z } from 'zod';
import { bulkCreateFromTemplates, SpaceNotFoundForBulkError } from '../../../../../lib/services/tasksService';
import { DEFAULT_USER_ID } from '../../../../../db/supabase.client';
import type { BulkCreateTasksCommand } from '../../../../../types';
import { validateSupabaseClient, successResponse, errorResponse, validationErrorResponse } from '../../../../../lib/utils';

export const prerender = false;

/**
 * Schema walidacji parametrów URL dla POST /api/spaces/{spaceId}/tasks/bulk-from-templates
 */
const bulkCreateSpaceIdSchema = z.object({
  spaceId: z.string().uuid('Nieprawidłowy format ID przestrzeni'),
});

/**
 * Schema walidacji body dla POST /api/spaces/{spaceId}/tasks/bulk-from-templates
 */
const bulkCreateTasksBodySchema = z.object({
  items: z.array(
    z.object({
      template_id: z.string().uuid('Nieprawidłowy format ID szablonu'),
      override_recurrence_value: z.number().int().positive().nullable().optional(),
      override_recurrence_unit: z.enum(['days', 'months']).nullable().optional(),
    })
  )
    .min(1, 'Wymagany jest co najmniej jeden element')
    .max(50, 'Maksymalnie 50 elementów na jedno żądanie'),
});

/**
 * POST /api/spaces/{spaceId}/tasks/bulk-from-templates
 * Masowo tworzy zadania na podstawie szablonów dla wskazanej przestrzeni
 * Zwraca 207 Multi-Status z per-item wynikami (201 dla sukcesu, 404/409/500 dla błędów)
 * 
 * Path parameters:
 * - spaceId (required): UUID - identyfikator przestrzeni
 * 
 * Body JSON:
 * - items (required): array - tablica elementów do tworzenia (1-50 elementów)
 *   - template_id (required): UUID - ID szablonu dla tego zadania
 *   - override_recurrence_value (optional): number - nadpisanie wartości cykliczności
 *   - override_recurrence_unit (optional): 'days' | 'months' - nadpisanie jednostki cykliczności
 * 
 * Responses:
 * - 207: Multi-Status z tablicą wyników (BulkCreateTasksResponseDto)
 * - 400: nieprawidłowy format UUID lub błędne dane body
 * - 401: brak autoryzacji
 * - 404: przestrzeń lub szablon nie znaleziony
 * - 500: błąd serwera
 */
export const POST: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    const userId = DEFAULT_USER_ID;
    const { spaceId } = context.params;

    // Walidacja parametru URL
    const paramsValidationResult = bulkCreateSpaceIdSchema.safeParse({ spaceId });
    if (!paramsValidationResult.success) {
      return validationErrorResponse(paramsValidationResult.error.errors);
    }

    // Walidacja body request
    const body = await context.request.json();
    const bodyValidationResult = bulkCreateTasksBodySchema.safeParse(body);

    if (!bodyValidationResult.success) {
      return validationErrorResponse(bodyValidationResult.error.errors);
    }

    const { spaceId: validatedSpaceId } = paramsValidationResult.data;
    const command: BulkCreateTasksCommand = bodyValidationResult.data;

    // Masowe tworzenie zadań z service layer
    const response = await bulkCreateFromTemplates(supabase, {
      userId,
      spaceId: validatedSpaceId,
      command,
    });

    // Zwrócenie 207 Multi-Status
    return successResponse(response, 207);

  } catch (error) {
    // Obsługa błędów z service layer
    if (error instanceof SpaceNotFoundForBulkError) {
      return errorResponse('Przestrzeń nie znaleziona', undefined, 404);
    }

    console.error('Error in POST /api/spaces/[spaceId]/tasks/bulk-from-templates:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};
