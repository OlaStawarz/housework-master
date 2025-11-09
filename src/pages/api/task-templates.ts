import type { APIRoute } from 'astro';
import { z } from 'zod';
import { listTaskTemplates } from '../../lib/services/taskTemplatesService';
import { validateSupabaseClient, successResponse, errorResponse, validationErrorResponse } from '../../lib/utils';

export const prerender = false;

/**
 * Schema walidacji query parameters dla GET /api/task-templates
 */
const getTaskTemplatesQuerySchema = z.object({
  space_type: z.string().optional(),
  sort: z.string().default('space_type.asc,display_order.asc'),
});

/**
 * GET /api/task-templates
 * Pobiera listę szablonów zadań systemowych z opcjonalnym filtrowaniem i sortowaniem
 * 
 * Query parameters:
 * - space_type (optional): string - filtrowanie po kodzie typu przestrzeni (np. "kitchen")
 * - sort (optional): string - sortowanie w formacie "field.asc,field2.desc" (domyślnie "space_type.asc,display_order.asc")
 * 
 * Responses:
 * - 200: lista szablonów zadań (TaskTemplateDto[])
 * - 400: nieprawidłowe parametry query
 * - 500: błąd serwera
 */
export const GET: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    // Walidacja parametrów query
    const url = new URL(context.request.url);
    const queryParams = {
      space_type: url.searchParams.get('space_type') || undefined,
      sort: url.searchParams.get('sort') || undefined,
    };

    const validationResult = getTaskTemplatesQuerySchema.safeParse(queryParams);
    
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.errors);
    }

    const { space_type, sort } = validationResult.data;

    // Pobranie szablonów zadań z service layer
    const templates = await listTaskTemplates(supabase, {
      spaceType: space_type,
      sort,
    });

    // Zwrócenie odpowiedzi w formacie { data: TaskTemplateDto[] }
    return successResponse({ data: templates }, 200);

  } catch (error) {
    console.error('Error in GET /api/task-templates:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};
