import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ message: "Email jest wymagany" }), { status: 400 });
    }

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
    
    // Ustalenie URL bazowego
    const siteUrl = import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/api/auth/callback?next=/update-password`,
    });

    if (error) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 400,
      });
    }

    return new Response(null, { status: 200 });
  } catch (e) {
    console.error("Reset password error:", e);
    return new Response(JSON.stringify({ message: "Wystąpił nieoczekiwany błąd serwera" }), { status: 500 });
  }
};

