-- ============================================================================
-- migration: disable rls for local development
-- description: disables row level security on all tables for easier local testing
-- author: housework master team
-- date: 2025-10-18
-- ============================================================================
-- ⚠️ WARNING: THIS MIGRATION IS FOR LOCAL DEVELOPMENT ONLY ⚠️
-- 
-- NEVER run this migration in production or staging environments!
-- 
-- this migration disables row level security to simplify local development
-- and testing without requiring authentication for every database operation.
-- 
-- for production deployments:
--   1. do not include this file in production migrations
--   2. use git to exclude this file from production branches
--   3. consider using supabase branching for local dev instead
-- 
-- to re-enable rls (reverse this migration):
--   see migration: 20251018100400_enable_rls_for_production.sql
-- ============================================================================

-- ============================================================================
-- disable rls on all tables
-- description: allows unrestricted access to all tables during local dev
-- ============================================================================

-- disable rls on system tables
-- warning: allows unrestricted write access to system data
alter table public.space_types disable row level security;
alter table public.task_templates disable row level security;

-- disable rls on user tables
-- warning: this removes all access restrictions - anyone can read/write all data

-- disable rls on spaces table
alter table public.spaces disable row level security;

-- disable rls on tasks table
alter table public.tasks disable row level security;

-- disable rls on motivational_messages table
alter table public.motivational_messages disable row level security;

-- ============================================================================
-- migration complete: rls disabled for local development
-- ============================================================================
-- ⚠️ REMINDER: DO NOT USE THIS IN PRODUCTION ⚠️
-- 
-- all tables are now accessible without authentication checks.
-- this is convenient for local testing but extremely insecure for production.
-- 
-- to re-enable rls:
--   run: supabase migration new enable_rls_for_production
--   or use the prepared migration: 20251018100400_enable_rls_for_production.sql
-- ============================================================================

