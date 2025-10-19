-- ============================================================================
-- migration: create space_types table
-- description: creates system table with predefined space types for organizing
--              household areas with default icons and templates
-- author: housework master team
-- date: 2025-10-18
-- ============================================================================
-- affected tables: space_types
-- dependencies: none (system table)
-- notes: 
--   - uses uuid primary keys for better supabase integration
--   - read-only table for users, only admins can modify
--   - provides logical reference for spaces.space_type and task_templates.space_type
--   - no formal foreign keys for flexibility
-- ============================================================================

-- ============================================================================
-- table: space_types
-- description: stores predefined types of spaces (kitchen, bathroom, etc.)
-- ============================================================================

create table public.space_types (
  id uuid primary key default gen_random_uuid(),
  code varchar(50) not null unique,
  display_name varchar(100) not null,
  icon varchar(50) null,
  display_order integer not null default 0
);

-- add comments explaining table and columns
comment on table public.space_types is 'system table storing predefined space types for organizing household areas';
comment on column public.space_types.id is 'unique identifier for the space type';
comment on column public.space_types.code is 'technical code for the space type (e.g., "kitchen", "bathroom")';
comment on column public.space_types.display_name is 'user-friendly display name (e.g., "Kuchnia", "Łazienka")';
comment on column public.space_types.icon is 'default icon for this space type (emoji or icon library name)';
comment on column public.space_types.display_order is 'order for displaying space types in user interface';

-- create indexes for efficient querying
create unique index idx_space_types_code on public.space_types(code);
create index idx_space_types_display_order on public.space_types(display_order);

-- ============================================================================
-- seed data: predefined space types
-- description: initial set of common household space types
-- ============================================================================

insert into public.space_types (code, display_name, icon, display_order) values
  ('kitchen', 'Kuchnia', '🍳', 1),
  ('bathroom', 'Łazienka', '🚿', 2),
  ('bedroom', 'Sypialnia', '🛏️', 3),
  ('living_room', 'Salon', '🛋️', 4),
  ('garage', 'Garaż', '🚗', 5),
  ('office', 'Biuro', '💼', 6),
  ('laundry', 'Pralnia', '🧺', 7),
  ('garden', 'Ogród', '🌿', 8),
  ('hallway', 'Korytarz', '🚪', 9);

-- ============================================================================
-- row level security: enable rls on space_types table
-- description: read-only access for authenticated users
-- ============================================================================

-- enable rls on space_types table
alter table public.space_types enable row level security;

-- ============================================================================
-- rls policies: space_types table
-- description: public read access for authenticated users, no write access
-- ============================================================================

-- policy: authenticated users can view all space types
-- note: this is a system table, all users need to see all space types
create policy "authenticated users can select all space types"
  on public.space_types
  for select
  to authenticated
  using (true);

-- note: no insert/update/delete policies - only database admins can modify system data

-- ============================================================================
-- migration complete: space_types table
-- ============================================================================

