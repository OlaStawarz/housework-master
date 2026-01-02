import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ message: "Email i hasło są wymagane" }), { status: 400 });
    }

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let message = error.message;
      // Handle specific Supabase errors translation
      if (message.includes("Email not confirmed")) {
          message = "Adres email nie został potwierdzony. Sprawdź swoją skrzynkę.";
      } else if (message.includes("Invalid login credentials")) {
          message = "Nieprawidłowy email lub hasło.";
      }
      
      return new Response(JSON.stringify({ message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ message: "Wystąpił nieoczekiwany błąd serwera" }), { status: 500 });
  }
};

