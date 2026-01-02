import { type APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const GET: APIRoute = async ({ url, cookies, redirect, request }) => {
  const authCode = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";

  if (authCode) {
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
    const { error } = await supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
      console.error("Auth callback error:", error);
      return redirect("/login?error=auth_callback_error");
    }
    
    return redirect(next);
  }

  return redirect("/login?error=no_code");
};

