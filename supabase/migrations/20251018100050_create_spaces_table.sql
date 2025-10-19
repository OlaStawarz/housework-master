-- ============================================================================
-- migration: create spaces table
-- description: creates spaces table for organizing household tasks by rooms
--              with rls policies, indexes, and updated_at trigger
-- author: housework master team
-- date: 2025-10-18
-- ============================================================================
-- affected tables: spaces
-- dependencies: auth.users (managed by supabase auth), space_types (logical)
-- notes: 
--   - uses uuid primary keys for better supabase integration
--   - cascade delete ensures data consistency
--   - rls policies restrict access to user's own spaces
--   - updated_at trigger automatically tracks modifications
--   - space_type is optional and logically references space_types.code (no FK)
-- ============================================================================

-- ============================================================================
-- table: spaces
-- description: stores user-created spaces (rooms) for grouping tasks
-- ============================================================================

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(100) not null,
  space_type varchar(50) null,
  icon varchar(50) null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  -- ensure user cannot create duplicate space names
  constraint unique_user_space_name unique(user_id, name)
);

-- add comment explaining table purpose
comment on table public.spaces is 'stores spaces (rooms) created by users to organize household tasks';
comment on column public.spaces.id is 'unique identifier for the space';
comment on column public.spaces.user_id is 'foreign key to the space owner in auth.users';
comment on column public.spaces.name is 'display name of the space (e.g., "Kuchnia na dole", "Łazienka główna")';
comment on column public.spaces.space_type is 'optional type code matching space_types.code for template suggestions';
comment on column public.spaces.icon is 'custom icon for the space (emoji or icon library name), overrides space_type default';
comment on column public.spaces.created_at is 'timestamp when space was created';
comment on column public.spaces.updated_at is 'timestamp of last modification, auto-updated by trigger';

-- create index for efficient user-based filtering
create index idx_spaces_user_id on public.spaces(user_id);

-- ============================================================================
-- trigger function: auto-update updated_at timestamps
-- description: reusable function for automatically updating updated_at column
-- ============================================================================

-- create reusable function for updating updated_at column
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  -- set updated_at to current timestamp whenever row is modified
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.update_updated_at_column() is 'trigger function to automatically update updated_at timestamp on row modification';

-- attach trigger to spaces table
create trigger update_spaces_updated_at
  before update on public.spaces
  for each row
  execute function public.update_updated_at_column();

-- ============================================================================
-- row level security: enable rls on spaces table
-- description: ensures users can only access their own spaces
-- ============================================================================

-- enable rls on spaces table
-- warning: enabling rls will block all access until policies are created
alter table public.spaces enable row level security;

-- ============================================================================
-- rls policies: spaces table
-- description: granular policies for crud operations on user's own spaces
-- ============================================================================

-- policy: authenticated users can view their own spaces
create policy "authenticated users can select their own spaces"
  on public.spaces
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy: authenticated users can create their own spaces
create policy "authenticated users can insert their own spaces"
  on public.spaces
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- policy: authenticated users can update their own spaces
create policy "authenticated users can update their own spaces"
  on public.spaces
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own spaces
-- note: will cascade delete all tasks and motivational messages in the space
create policy "authenticated users can delete their own spaces"
  on public.spaces
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- migration complete: spaces table
-- ============================================================================

