import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ message: "Email i hasło są wymagane" }), { status: 400 });
    }

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 400,
      });
    }

    // Jeśli rejestracja automatycznie zalogowała (np. brak wymogu potwierdzenia email),
    // wyloguj użytkownika natychmiast, aby wymusić ręczne logowanie.
    if (data.session) {
      await supabase.auth.signOut();
    }

    // Sukces - użytkownik utworzony
    return new Response(JSON.stringify({ user: data.user }), {
      status: 201,
    });
  } catch (e) {
    console.error("Registration error:", e);
    return new Response(JSON.stringify({ message: "Wystąpił nieoczekiwany błąd serwera" }), { status: 500 });
  }
};

