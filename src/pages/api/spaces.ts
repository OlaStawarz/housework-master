// src/pages/api/spaces.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { listSpaces, createSpace, SpaceTypeNotFoundError, DuplicateSpaceNameError, PageOutOfRangeError } from '../../lib/services/spacesService';
import { validateSupabaseClient, successResponse, errorResponse, validationErrorResponse } from '../../lib/utils';

export const prerender = false;

/**
 * Schema walidacji parametrów query dla GET /api/spaces
 */
const getSpacesQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['created_at.asc', 'created_at.desc', 'name.asc', 'name.desc']).default('created_at.desc'),
});

/**
 * Schema walidacji body dla POST /api/spaces
 */
export const postSpaceBodySchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa jest wymagana")
    .max(100, "Nazwa może mieć maksymalnie 100 znaków")
    .trim(),
  space_type: z.string().max(50, "Kod typu przestrzeni może mieć maksymalnie 50 znaków").optional().nullable(),
  icon: z.string().max(50, "Ikona może mieć maksymalnie 50 znaków").optional().nullable(),
});

/**
 * GET /api/spaces
 * Pobiera listę przestrzeni użytkownika z paginacją, filtrowaniem i sortowaniem
 *
 * Query params:
 * - search (opcjonalny): string - filtrowanie po fragmencie nazwy
 * - page (opcjonalny): integer - numer strony, domyślnie 1
 * - limit (opcjonalny): integer - liczba rekordów na stronę, domyślnie 20, max 100
 * - sort (opcjonalny): string - kierunek i pole sortowania, domyślnie "created_at.desc"
 *
 * Responses:
 * - 200: lista przestrzeni z informacjami o paginacji
 * - 400: błędne parametry query
 * - 401: brak autoryzacji (obsługa przez middleware)
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
      return errorResponse('unauthorized', 'User not logged in', 401);
    }
    const userId = user.id;

    // Walidacja parametrów query
    const url = new URL(context.request.url);
    const queryParams = {
      search: url.searchParams.get('search') || undefined,
      page: url.searchParams.get('page') || undefined,
      limit: url.searchParams.get('limit') || undefined,
      sort: url.searchParams.get('sort') || undefined,
    };

    const validationResult = getSpacesQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.errors);
    }

    const { search, page, limit, sort } = validationResult.data;

    // Pobranie listy przestrzeni z service layer
    const result = await listSpaces(supabase, {
      userId,
      search,
      page,
      limit,
      sort,
    });

    return successResponse(result, 200);

  } catch (error) {
    // Obsługa błędu strony poza zakresem
    if (error instanceof PageOutOfRangeError) {
      return errorResponse('page_out_of_range', error.message, 400);
    }
    
    console.error('Error in GET /api/spaces:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};

/**
 * POST /api/spaces
 * Tworzy nową przestrzeń przypisaną do zalogowanego użytkownika.
 *
 * @param context - Kontekst żądania Astro, zawiera supabase client oraz ciało zapytania JSON.
 * @returns Response:
 *   - 201: Zwraca obiekt SpaceDto z danymi nowo utworzonej przestrzeni.
 *   - 400: Błędy walidacji (validation_error) lub niepoprawny space_type (invalid_space_type).
 *   - 401: Brak autoryzacji (unauthorized).
 *   - 409: Duplikat nazwy przestrzeni (duplicate_name).
 *   - 500: Błąd wewnętrzny serwera (internal_error).
 */
export const POST: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    const user = context.locals.user;
    if (!user) {
      return errorResponse('unauthorized', 'User not logged in', 401);
    }
    const userId = user.id;

    // Walidacja body request
    const body = await context.request.json();
    const parseResult = postSpaceBodySchema.safeParse(body);
    if (!parseResult.success) {
      return validationErrorResponse(parseResult.error.errors);
    }

    const command: CreateSpaceCommand = parseResult.data;

    // Tworzenie nowej przestrzeni z service layer
    const newSpace: SpaceDto = await createSpace(supabase, { userId, command });
    return successResponse(newSpace, 201);

  } catch (error) {
    // Obsługa błędów z service layer
    if (error instanceof SpaceTypeNotFoundError) {
      return errorResponse('invalid_space_type', error.message, 400);
    }
    if (error instanceof DuplicateSpaceNameError) {
      return errorResponse('duplicate_name', error.message, 409);
    }
    
    console.error('Error in POST /api/spaces:', error);
    return errorResponse('internal_error', 'Internal server error', 500);
  }
};

