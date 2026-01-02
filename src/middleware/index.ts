import { createSupabaseServerInstance } from '../db/supabase.client.ts';
import { defineMiddleware } from 'astro:middleware';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/auth/callback'];
const PUBLIC_API_PREFIX = '/api/auth';

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });
    
    // Make supabase available in locals
    locals.supabase = supabase;

    // IMPORTANT: Always get user session first before any other operations
    // This ensures auth cookies are refreshed if needed
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      locals.user = {
        email: user.email,
        id: user.id,
        user_metadata: user.user_metadata,
      };
    } else {
      locals.user = null;
    }

    const path = url.pathname;

    // Skip auth check for public paths and auth API
    if (PUBLIC_ROUTES.includes(path) || path.startsWith(PUBLIC_API_PREFIX)) {
      return next();
    }

    // Define protected routes explicitly based on spec
    const isProtected = 
      path.startsWith('/dashboard') ||
      path.startsWith('/spaces') ||
      (path.startsWith('/api/') && !path.startsWith(PUBLIC_API_PREFIX));

    if (isProtected && !user) {
      // Return 401 for API calls
      if (path.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      // Redirect to login for pages
      return redirect('/login');
    }

    return next();
  },
);
