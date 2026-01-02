import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { password } = await request.json();

    if (!password) {
      return new Response(JSON.stringify({ message: "Hasło jest wymagane" }), { status: 400 });
    }

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    // Aktualizacja hasła dla aktualnie zalogowanego użytkownika
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 400,
      });
    }

    return new Response(null, { status: 200 });
  } catch (e) {
    console.error("Update password error:", e);
    return new Response(JSON.stringify({ message: "Wystąpił nieoczekiwany błąd serwera" }), { status: 500 });
  }
};

