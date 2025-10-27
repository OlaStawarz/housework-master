import type { APIRoute } from 'astro';
import { listSpaceTypes } from '../../lib/services/spaceTypesService';
import { validateSupabaseClient, successResponse, errorResponse } from '../../lib/utils';

export const prerender = false;

/**
 * GET /api/space-types
 * Pobiera listę wszystkich dostępnych typów przestrzeni z tabeli systemowej
 * 
 * Responses:
 * - 200: lista typów przestrzeni (SpaceTypeDto[])
 * - 500: błąd serwera
 */
export const GET: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    // Pobranie listy typów przestrzeni z service layer
    const spaceTypes = await listSpaceTypes(supabase);

    // Zwrócenie odpowiedzi w formacie { data: SpaceTypeDto[] }
    return successResponse({ data: spaceTypes }, 200);

  } catch (error) {
    console.error('Error in GET /api/space-types:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};
