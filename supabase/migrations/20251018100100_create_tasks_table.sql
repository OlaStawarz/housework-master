-- ============================================================================
-- migration: create tasks table
-- description: creates tasks table for recurring household chores
--              with rls policies, indexes, and updated_at trigger
-- author: housework master team
-- date: 2025-10-18
-- ============================================================================
-- affected tables: tasks
-- dependencies: spaces, auth.users
-- notes: 
--   - uses uuid primary keys for better supabase integration
--   - cascade delete ensures data consistency
--   - rls policies restrict access to user's own tasks
--   - updated_at trigger automatically tracks modifications
--   - supports recurrence with value + unit model (e.g., 7 days, 2 months)
--   - enforces max 3 postponements per cycle
-- ============================================================================

-- ============================================================================
-- table: tasks
-- description: stores recurring household tasks assigned to spaces
-- ============================================================================

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(200) not null,
  recurrence_value integer not null check(recurrence_value > 0),
  recurrence_unit varchar(10) not null check(recurrence_unit in ('days', 'months')),
  due_date timestamp with time zone not null,
  status varchar(20) not null default 'pending' check(status in ('pending', 'completed', 'postponed', 'overdue')),
  postponement_count integer not null default 0 check(postponement_count between 0 and 3),
  last_completed_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  -- ensure no duplicate task names within same space
  constraint unique_space_task_name unique(space_id, name)
);

-- add comments explaining table and columns
comment on table public.tasks is 'stores recurring household tasks with scheduling and status tracking';
comment on column public.tasks.id is 'unique identifier for the task';
comment on column public.tasks.space_id is 'foreign key to the space this task belongs to';
comment on column public.tasks.user_id is 'foreign key to the task owner in auth.users';
comment on column public.tasks.name is 'immutable task name set at creation';
comment on column public.tasks.recurrence_value is 'numeric value for recurrence (e.g., 7 for weekly, 2 for bimonthly)';
comment on column public.tasks.recurrence_unit is 'time unit for recurrence: "days" or "months"';
comment on column public.tasks.due_date is 'deadline for task completion';
comment on column public.tasks.status is 'current task status: pending, completed, postponed, or overdue';
comment on column public.tasks.postponement_count is 'number of times task has been postponed in current cycle (max 3)';
comment on column public.tasks.last_completed_at is 'timestamp of most recent completion, null if never completed';
comment on column public.tasks.created_at is 'timestamp when task was created';
comment on column public.tasks.updated_at is 'timestamp of last modification, auto-updated by trigger';

-- create indexes for efficient querying
create index idx_tasks_space_id on public.tasks(space_id);
create index idx_tasks_user_status_due on public.tasks(user_id, status, due_date);

-- ============================================================================
-- trigger: auto-update updated_at timestamp
-- description: uses shared update_updated_at_column() function
-- ============================================================================

-- attach trigger to tasks table
create trigger update_tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.update_updated_at_column();

-- ============================================================================
-- row level security: enable rls on tasks table
-- description: ensures users can only access tasks in their own spaces
-- ============================================================================

-- enable rls on tasks table
-- warning: enabling rls will block all access until policies are created
alter table public.tasks enable row level security;

-- ============================================================================
-- rls policies: tasks table
-- description: granular policies for crud operations on user's own tasks
-- ============================================================================

-- policy: authenticated users can view their own tasks
create policy "authenticated users can select their own tasks"
  on public.tasks
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy: authenticated users can create tasks in their own spaces
-- note: validates user owns the space via subquery
create policy "authenticated users can insert their own tasks"
  on public.tasks
  for insert
  to authenticated
  with check (
    auth.uid() = user_id 
    and exists (
      select 1 from public.spaces 
      where spaces.id = space_id 
      and spaces.user_id = auth.uid()
    )
  );

-- policy: authenticated users can update their own tasks
create policy "authenticated users can update their own tasks"
  on public.tasks
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own tasks
-- note: will cascade delete all motivational messages for the task
create policy "authenticated users can delete their own tasks"
  on public.tasks
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- migration complete: tasks table
-- ============================================================================

