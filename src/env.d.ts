/// <reference types="astro/client" />

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db/database.types.ts';

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare global {
  namespace App {
    interface Locals extends Runtime {
      supabase: SupabaseClient<Database, 'public'>;
      user: {
        id: string;
        email?: string;
        user_metadata?: {
          avatar_url?: string;
          full_name?: string;
          [key: string]: any;
        };
      } | null;
    }
  }
}

interface Env {
  OPENROUTER_API_KEY: string;
  PUBLIC_SITE_URL: string;
  PUBLIC_SUPABASE_URL: string;
  PUBLIC_SUPABASE_KEY: string;
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_KEY: string; // Anon key
  readonly OPENROUTER_API_KEY: string;
  readonly PUBLIC_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
