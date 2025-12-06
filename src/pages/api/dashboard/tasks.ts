import type { APIRoute } from 'astro';
import { z } from 'zod';
import * as tasksService from '../../../lib/services/tasksService';
import type { GetDashboardTasksParams } from '../../../types';
import { DEFAULT_USER_ID } from '@/db/supabase.client';

/**
 * Wyłączenie prerenderingu dla endpointu API
 */
export const prerender = false;

/**
 * Schema walidacji parametrów query dla GET /api/dashboard/tasks
 */
const getDashboardTasksQuerySchema = z.object({
  section: z.enum(['overdue', 'upcoming', 'all']).default('all'),
  days_ahead: z.coerce.number().int().min(1).default(7),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().regex(/^(due_date|name|created_at|updated_at)\.(asc|desc)$/).default('due_date.asc'),
});

/**
 * GET /api/dashboard/tasks
 * Pobiera zagregowane zadania ze wszystkich przestrzeni użytkownika z możliwością segmentacji
 * 
 * Query params:
 * - section (opcjonalny): 'overdue' | 'upcoming' | 'all' - typ segmentacji, domyślnie 'all'
 * - days_ahead (opcjonalny): integer - liczba dni dla sekcji upcoming, domyślnie 7, min 1
 * - page (opcjonalny): integer - numer strony, domyślnie 1
 * - limit (opcjonalny): integer - liczba rekordów na stronę, domyślnie 20, max 100
 * - sort (opcjonalny): string - format: "field.direction" (np. "due_date.asc"), domyślnie "due_date.asc"
 * 
 * Responses:
 * - 200: lista zadań z informacjami o paginacji (TaskListDto)
 * - 400: błędne parametry query
 * - 401: brak autoryzacji (obsługa przez middleware)
 * - 500: błąd serwera
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const userId = DEFAULT_USER_ID;
  const supabase = locals.supabase;

  try {
    // Parsowanie query params z URL
    const url = new URL(request.url);
    const queryParams = {
      section: url.searchParams.get('section') || undefined,
      days_ahead: url.searchParams.get('days_ahead') || undefined,
      page: url.searchParams.get('page') || undefined,
      limit: url.searchParams.get('limit') || undefined,
      sort: url.searchParams.get('sort') || undefined,
    };

    // Walidacja przy użyciu Zod
    const validatedQuery = getDashboardTasksQuerySchema.safeParse(queryParams);

    if (!validatedQuery.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'validation_error',
            message: 'Nieprawidłowe parametry zapytania',
            details: validatedQuery.error.errors,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Przygotowanie parametrów dla serwisu
    const params: GetDashboardTasksParams = {
      userId,
      filters: validatedQuery.data,
    };

    // Wywołanie serwisu
    const result = await tasksService.getDashboardTasks(supabase, params);

    // Zwrócenie wyniku
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in GET /api/dashboard/tasks:', error);

    // Obsługa błędu PageOutOfRangeError
    if (error instanceof tasksService.PageOutOfRangeError) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'page_out_of_range',
            message: error.message,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ogólny błąd serwera
    return new Response(
      JSON.stringify({
        error: {
          code: 'internal_error',
          message: 'Wystąpił nieoczekiwany błąd serwera',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

