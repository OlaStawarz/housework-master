-- ============================================================================
-- migration: create task_templates table
-- description: creates system table with predefined task templates for
--              different space types to help users quickly set up tasks
-- author: housework master team
-- date: 2025-10-18
-- ============================================================================
-- affected tables: task_templates
-- dependencies: space_types (logical reference)
-- notes: 
--   - uses uuid primary keys for better supabase integration
--   - read-only table for users, only admins can modify
--   - logically references space_types.code without formal FK
--   - provides suggested tasks when user creates a new space
-- ============================================================================

-- ============================================================================
-- table: task_templates
-- description: stores predefined task templates for different space types
-- ============================================================================

create table public.task_templates (
  id uuid primary key default gen_random_uuid(),
  space_type varchar(50) not null,
  task_name varchar(200) not null,
  default_recurrence_value integer not null check(default_recurrence_value > 0),
  default_recurrence_unit varchar(10) not null check(default_recurrence_unit in ('days', 'months')),
  display_order integer not null default 0,
  
  -- ensure no duplicate task names within same space type
  constraint unique_space_type_task_name unique(space_type, task_name)
);

-- add comments explaining table and columns
comment on table public.task_templates is 'system table storing predefined task templates for different space types';
comment on column public.task_templates.id is 'unique identifier for the template';
comment on column public.task_templates.space_type is 'space type code (logically references space_types.code)';
comment on column public.task_templates.task_name is 'suggested task name for this space type';
comment on column public.task_templates.default_recurrence_value is 'suggested numeric value for task recurrence';
comment on column public.task_templates.default_recurrence_unit is 'suggested time unit for recurrence: "days" or "months"';
comment on column public.task_templates.display_order is 'order for displaying templates in user interface';

-- create indexes for efficient querying
create index idx_task_templates_space_type on public.task_templates(space_type);
create index idx_task_templates_space_type_display_order on public.task_templates(space_type, display_order);

-- ============================================================================
-- seed data: predefined task templates
-- description: initial set of common household task templates
-- ============================================================================

-- kitchen templates
insert into public.task_templates (space_type, task_name, default_recurrence_value, default_recurrence_unit, display_order) values
  ('kitchen', 'Wyrzucenie śmieci', 3, 'days', 1),
  ('kitchen', 'Umycie podłogi', 7, 'days', 2),
  ('kitchen', 'Wytarcie blatów', 1, 'days', 3),
  ('kitchen', 'Czyszczenie lodówki', 1, 'months', 4),
  ('kitchen', 'Czyszczenie piekarnika', 2, 'months', 5),
  ('kitchen', 'Zmywanie naczyń', 1, 'days', 6);

-- bathroom templates
insert into public.task_templates (space_type, task_name, default_recurrence_value, default_recurrence_unit, display_order) values
  ('bathroom', 'Czyszczenie toalety', 3, 'days', 1),
  ('bathroom', 'Pranie ręczników', 7, 'days', 2),
  ('bathroom', 'Czyszczenie prysznica', 7, 'days', 3),
  ('bathroom', 'Mycie lustra', 7, 'days', 4),
  ('bathroom', 'Umycie podłogi', 7, 'days', 5),
  ('bathroom', 'Czyszczenie umywalki', 3, 'days', 6);

-- bedroom templates
insert into public.task_templates (space_type, task_name, default_recurrence_value, default_recurrence_unit, display_order) values
  ('bedroom', 'Zmiana pościeli', 14, 'days', 1),
  ('bedroom', 'Odkurzanie', 7, 'days', 2),
  ('bedroom', 'Wytarcie kurzu', 7, 'days', 4),
  ('bedroom', 'Uporządkowanie szafy', 1, 'months', 5);

-- living_room templates
insert into public.task_templates (space_type, task_name, default_recurrence_value, default_recurrence_unit, display_order) values
  ('living_room', 'Odkurzanie', 7, 'days', 1),
  ('living_room', 'Wytarcie kurzu', 7, 'days', 2),
  ('living_room', 'Mycie okien', 2, 'months', 3),
  ('living_room', 'Czyszczenie kanap', 1, 'months', 4),
  ('living_room', 'Uporządkowanie', 3, 'days', 5);

-- garage templates
insert into public.task_templates (space_type, task_name, default_recurrence_value, default_recurrence_unit, display_order) values
  ('garage', 'Zamiatanie podłogi', 14, 'days', 1),
  ('garage', 'Uporządkowanie narzędzi', 1, 'months', 2),
  ('garage', 'Wyrzucenie śmieci', 7, 'days', 3);

-- office templates
insert into public.task_templates (space_type, task_name, default_recurrence_value, default_recurrence_unit, display_order) values
  ('office', 'Wytarcie biurka', 3, 'days', 1),
  ('office', 'Odkurzanie', 7, 'days', 2),
  ('office', 'Uporządkowanie dokumentów', 14, 'days', 3),
  ('office', 'Czyszczenie monitora', 14, 'days', 4);

-- laundry templates
insert into public.task_templates (space_type, task_name, default_recurrence_value, default_recurrence_unit, display_order) values
  ('laundry', 'Czyszczenie pralki', 1, 'months', 1),
  ('laundry', 'Umycie podłogi', 7, 'days', 2),
  ('laundry', 'Pranie', 3, 'days', 3),
  ('laundry', 'Prasowanie', 7, 'days', 4);

-- garden templates
insert into public.task_templates (space_type, task_name, default_recurrence_value, default_recurrence_unit, display_order) values
  ('garden', 'Podlewanie roślin', 2, 'days', 1),
  ('garden', 'Koszenie trawy', 7, 'days', 2),
  ('garden', 'Pielęgnacja kwiatów', 14, 'days', 3),
  ('garden', 'Grabienie liści', 7, 'days', 4);

-- hallway templates
insert into public.task_templates (space_type, task_name, default_recurrence_value, default_recurrence_unit, display_order) values
  ('hallway', 'Umycie podłogi', 7, 'days', 1),
  ('hallway', 'Wytarcie kurzu', 7, 'days', 2),
  ('hallway', 'Czyszczenie lustra', 7, 'days', 3),
  ('hallway', 'Uporządkowanie butów', 3, 'days', 4);

-- ============================================================================
-- row level security: enable rls on task_templates table
-- description: read-only access for authenticated users
-- ============================================================================

-- enable rls on task_templates table
alter table public.task_templates enable row level security;

-- ============================================================================
-- rls policies: task_templates table
-- description: public read access for authenticated users, no write access
-- ============================================================================

-- policy: authenticated users can view all task templates
-- note: this is a system table, all users need to see all templates
create policy "authenticated users can select all task templates"
  on public.task_templates
  for select
  to authenticated
  using (true);

-- note: no insert/update/delete policies - only database admins can modify system data

-- ============================================================================
-- migration complete: task_templates table
-- ============================================================================

