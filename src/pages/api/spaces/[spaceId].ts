import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSpaceById, updateSpace, deleteSpace, SpaceNotFoundError, DuplicateSpaceNameError } from '../../../lib/services/spacesService';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import { validateSupabaseClient, successResponse, errorResponse, validationErrorResponse } from '../../../lib/utils';

export const prerender = false;

/**
 * Wspólny schema walidacji parametru spaceId
 */
const spaceIdParamSchema = z.object({
  spaceId: z.string()
    .uuid("Invalid space ID format")
});

/**
 * Schema walidacji body dla PATCH /api/spaces/{spaceId}
 */
const patchSpaceBodySchema = z.object({
  name: z.string()
    .min(1, "Name cannot be empty")
    .max(100, "Name must be at most 100 characters")
    .trim()
    .optional(),
  icon: z.string()
    .max(50, "Icon must be at most 50 characters")
    .optional()
    .nullable()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

/**
 * Helper do walidacji parametru spaceId
 */
const validateSpaceIdParam = (spaceId: string | undefined) => {
  return spaceIdParamSchema.safeParse({ spaceId });
};

/**
 * GET /api/spaces/{spaceId}
 * Pobiera szczegółowe informacje o pojedynczej przestrzeni należącej do zalogowanego użytkownika
 * 
 * Path params:
 * - spaceId (required): UUID - identyfikator przestrzeni
 * 
 * Responses:
 * - 200: szczegóły przestrzeni (SpaceDto)
 * - 400: nieprawidłowy format UUID
 * - 401: brak autoryzacji (obsługa przez middleware)
 * - 404: przestrzeń nie istnieje lub nie należy do użytkownika
 * - 500: błąd serwera
 */
export const GET: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    const userId = DEFAULT_USER_ID;
    const { spaceId } = context.params;

    // Walidacja parametru URL
    const validationResult = validateSpaceIdParam(spaceId);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.errors);
    }

    const { spaceId: validatedSpaceId } = validationResult.data;
    
    // Pobranie szczegółów przestrzeni z service layer
    const space = await getSpaceById(supabase, validatedSpaceId, userId);

    return successResponse(space, 200);

  } catch (error) {
    // Obsługa błędów z service layer
    if (error instanceof SpaceNotFoundError) {
      return errorResponse('Space not found', undefined, 404);
    }

    console.error('Error in GET /api/spaces/[spaceId]:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};

/**
 * PATCH /api/spaces/{spaceId}
 * Aktualizuje istniejącą przestrzeń (name, icon)
 * 
 * Path params:
 * - spaceId (required): UUID - identyfikator przestrzeni
 * 
 * Body JSON:
 * - name (optional): string - nowa nazwa (1-100 znaków)
 * - icon (optional): string|null - nowa ikona (max 50 znaków)
 * 
 * Responses:
 * - 200: zaktualizowana przestrzeń (SpaceDto)
 * - 400: nieprawidłowy format UUID lub błędne dane body
 * - 401: brak autoryzacji
 * - 404: przestrzeń nie istnieje lub nie należy do użytkownika
 * - 409: duplikat nazwy
 * - 500: błąd serwera
 */
export const PATCH: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    const userId = DEFAULT_USER_ID;
    const { spaceId } = context.params;

    // Walidacja parametru URL
    const paramsValidationResult = validateSpaceIdParam(spaceId);
    if (!paramsValidationResult.success) {
      return validationErrorResponse(paramsValidationResult.error.errors);
    }

    // Walidacja body request
    const body = await context.request.json();
    const bodyValidationResult = patchSpaceBodySchema.safeParse(body);

    if (!bodyValidationResult.success) {
      return validationErrorResponse(bodyValidationResult.error.errors);
    }

    const { spaceId: validatedSpaceId } = paramsValidationResult.data;
    const command = bodyValidationResult.data;

    // Aktualizacja przestrzeni z service layer
    const updatedSpace = await updateSpace(supabase, {
      userId,
      spaceId: validatedSpaceId,
      command
    });

    return successResponse(updatedSpace, 200);

  } catch (error) {
    // Obsługa błędów z service layer
    if (error instanceof SpaceNotFoundError) {
      return errorResponse('Space not found', undefined, 404);
    }

    if (error instanceof DuplicateSpaceNameError) {
      return errorResponse('duplicate_name', error.message, 409);
    }

    console.error('Error in PATCH /api/spaces/[spaceId]:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};

/**
 * DELETE /api/spaces/{spaceId}
 * Usuwa przestrzeń wraz z jej zadaniami (CASCADE DELETE)
 * 
 * Path params:
 * - spaceId (required): UUID - identyfikator przestrzeni
 * 
 * Responses:
 * - 204: przestrzeń została pomyślnie usunięta (brak zawartości)
 * - 400: nieprawidłowy format UUID
 * - 401: brak autoryzacji
 * - 404: przestrzeń nie istnieje lub nie należy do użytkownika
 * - 500: błąd serwera
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // Guard clause - sprawdzenie supabase client
    const supabase = context.locals.supabase;
    const clientError = validateSupabaseClient(supabase);
    if (clientError) return clientError;

    const userId = DEFAULT_USER_ID;
    const { spaceId } = context.params;

    // Walidacja parametru URL
    const validationResult = validateSpaceIdParam(spaceId);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.errors);
    }

    const { spaceId: validatedSpaceId } = validationResult.data;
    
    // Usunięcie przestrzeni z service layer (CASCADE DELETE w bazie)
    await deleteSpace(supabase, validatedSpaceId, userId);

    // 204 No Content - brak treści odpowiedzi
    return new Response(null, { status: 204 });

  } catch (error) {
    // Obsługa błędów z service layer
    if (error instanceof SpaceNotFoundError) {
      return errorResponse('Space not found', undefined, 404);
    }

    console.error('Error in DELETE /api/spaces/[spaceId]:', error);
    return errorResponse('Internal server error', undefined, 500);
  }
};
