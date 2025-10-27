import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper do sprawdzenia Supabase client
 * @returns Response z błędem 500 jeśli client nie istnieje, lub null jeśli istnieje
 */
export const validateSupabaseClient = (supabase: any): Response | null => {
  if (!supabase) {
    console.error('Supabase client not found in context.locals');
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
};

/**
 * Helper do zwracania success response 200 OK
 */
export const successResponse = (data: any, status: number = 200) => {
  return new Response(
    JSON.stringify(data),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
};

/**
 * Helper do zwracania error response
 */
export const errorResponse = (error: string, message?: string, status: number = 400) => {
  const body = message ? { error, message } : { error };
  return new Response(
    JSON.stringify(body),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
};

/**
 * Helper do zwracania validation error response
 */
export const validationErrorResponse = (details: any) => {
  return new Response(
    JSON.stringify({
      error: 'Invalid request',
      details
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
};