# REST API Plan

## 1. Resources

- Auth/Account → Supabase `auth.users` (managed by Supabase Auth)
- Spaces → `spaces`
- Space Types (system, read-only) → `space_types`
- Task Templates (system, read-only) → `task_templates`
- Tasks → `tasks`
- Motivational Messages → `motivational_messages`
- Dashboard (aggregated view) → derived from `tasks` + `spaces`

Notes:
- All primary keys are UUIDs.
- RLS enforces `auth.uid() = user_id` for user-owned tables.
- Unique constraints relevant to API design:
  - `spaces`: `UNIQUE(user_id, name)`
  - `tasks`: `UNIQUE(space_id, name)`
  - `space_types`: `UNIQUE(code)`
  - `task_templates`: `UNIQUE(space_type, task_name)`
- Validation constraints to enforce:
  - `tasks.recurrence_value > 0`
  - `tasks.recurrence_unit ∈ {days, months}`
  - `tasks.postponement_count ∈ [0, 3]`
  - `tasks.status ∈ {pending, postponed}`
  - `motivational_messages.message_text` length ≤ 150

Pagination & Sorting Conventions:
- Query params: `page` (default: 1), `limit` (default: 20, max: 100), `sort` (e.g., `due_date.asc,name.desc`).
- Responses return a `pagination` object `{page, limit, total, total_pages}`.

Error Model:
```json
{
  "error": {
    "code": "string",
    "message": "human readable",
    "details": {"optional": "object"}
  }
}
```

## 2. Endpoints

### 2.1 Auth / Account

Auth is backed by Supabase Auth.

### 2.2 Space Types (system, read-only)

1) GET /api/space-types
- Description: List all space types (public, read-only, sorted by `display_order`).
- Query: none.
- Response JSON (200):
```json
{
  "data": [
    {"id":"uuid","code":"kitchen","display_name":"Kuchnia","icon":"🍳","display_order":1}
  ]
}
```
- Errors: 500.

### 2.3 Task Templates (system, read-only)

1) GET /api/task-templates
- Description: List templates, optionally filtered by `space_type`.
- Query: `space_type` (optional), `sort` (default: `space_type.asc,display_order.asc`).
- Response JSON (200):
```json
{
  "data": [
    {"id":"uuid","space_type":"kitchen","task_name":"Take out trash","default_recurrence_value":3,"default_recurrence_unit":"days","display_order":1}
  ]
}
```
- Errors: 400 (invalid `space_type`), 500.

### 2.4 Spaces

1) GET /api/spaces
- Description: List user spaces.
- Headers: Authorization
- Query: `search` (by name), `page`, `limit`, `sort` (default: `created_at.desc`).
- Response JSON (200):
```json
{
  "data": [
    {"id":"uuid","user_id":"uuid","name":"Kitchen","space_type":"kitchen","icon":"🍳","created_at":"iso","updated_at":"iso"}
  ],
  "pagination": {"page":1,"limit":20,"total":2,"total_pages":1}
}
```
- Errors: 401, 500.

2) POST /api/spaces
- Description: Create a space. Enforces `UNIQUE(user_id, name)`.
- Headers: Authorization
- Request JSON:
```json
{ "name": "string", "space_type": "kitchen|bathroom|...", "icon": "string|null" }
```
- Response JSON (201): space record (as above).
- Errors: 400 (invalid input), 409 (duplicate name), 401, 500.

3) GET /api/spaces/{spaceId}
- Description: Get a specific space owned by the user.
- Headers: Authorization
- Response JSON (200): space record.
- Errors: 401, 404 (not found or not owned), 500.

4) PATCH /api/spaces/{spaceId}
- Description: Update `name` or `icon`. Enforces unique name per user. Note: `space_type` is immutable after creation as it's used only for initial task template selection.
- Headers: Authorization
- Request JSON:
```json
{ "name": "string?", "icon": "string|null?" }
```
- Response JSON (200): updated space.
- Errors: 400, 401, 404, 409 (duplicate), 500.

5) DELETE /api/spaces/{spaceId}
- Description: Delete a space; cascades to tasks.
- Headers: Authorization
- Response: 204 No Content.
- Errors: 401, 404, 500.

### 2.5 Tasks

1) GET /api/tasks
- Description: List tasks across user spaces (dashboard backing).
- Headers: Authorization
- Query:
  - `space_id` (optional)
  - `status` in `pending,postponed` (optional, filters by physical status; to get overdue tasks use `due_before=now`)
  - `due_before` / `due_after` (ISO timestamps)
  - `page`, `limit`, `sort` (default: `recurrence.asc`)
- Response JSON (200):
```json
{
  "data": [
    {
      "id":"uuid","space_id":"uuid","user_id":"uuid","name":"Vacuum",
      "recurrence_value":7,"recurrence_unit":"days",
      "due_date":"iso","status":"pending","postponement_count":0,
      "last_completed_at":null,"created_at":"iso","updated_at":"iso",
      "space": {"id":"uuid","name":"Bedroom","space_type":"bedroom","icon":"🛏️"}
    }
  ],
  "pagination": {"page":1,"limit":20,"total":12,"total_pages":1}
}
```
- Errors: 400 (invalid filters), 401, 500.

2) POST /api/tasks
- Description: Create a custom task.
- Headers: Authorization
- Request JSON:
```json
{
  "space_id":"uuid",
  "name":"string",
  "recurrence_value":1,
  "recurrence_unit":"days|months"
}
```
- Behavior:
  - Compute first `due_date` as `now + recurrence`.
  - Enforce `UNIQUE(space_id, name)`.
- Response JSON (201): created task record.
- Errors: 400 (validation), 401, 404 (space not owned), 409 (duplicate), 500.

3) POST /api/spaces/{spaceId}/tasks/bulk-from-templates
- Description: Batch-create tasks from templates for a space.
- Headers: Authorization
- Request JSON:
```json
{
  "items": [
    {
      "template_id":"uuid",
      "override_recurrence_value":null,
      "override_recurrence_unit":null
    }
  ]
}
```
- Behavior:
  - For each item, resolve template; set `name` from `task_name`.
  - Use overrides if provided; else default values from template.
  - Compute first due date as `now + recurrence`.
  - Deduplicate by `name` within the space; skip or return 409 per item (see `details`).
- Response JSON (207 Multi-Status):
```json
{
  "results": [
    {"status":201, "task": {"id":"uuid","name":"..."}},
    {"status":409, "error": {"code":"duplicate_task","message":"...","template_id":"uuid"}}
  ]
}
```
- Errors: 400 (invalid payload), 401, 404 (space or template not found), 500.

4) GET /api/tasks/{taskId}
- Description: Fetch a single task owned by the user.
- Headers: Authorization
- Response JSON (200): task record.
- Errors: 401, 404, 500.

5) PATCH /api/tasks/{taskId}
- Description: Update recurrence only (`recurrence_value`, `recurrence_unit`). Name is immutable by design.
- Headers: Authorization
- Request JSON:
```json
{ "recurrence_value": 14, "recurrence_unit": "days" }
```
- Behavior: Recompute `due_date` based on new recurrence from `now` (configurable) or keep existing schedule (recommended: recompute next due date from `last_completed_at` if available else from `now`).
- Response JSON (200): updated task.
- Errors: 400, 401, 404, 422 (invalid recurrence), 500.

6) DELETE /api/tasks/{taskId}
- Description: Delete a task.
- Headers: Authorization
- Response: 204 No Content.
- Errors: 401, 404, 500.

7) POST /api/tasks/{taskId}/complete
- Description: Mark task as completed and start next cycle.
- Headers: Authorization
- Request JSON (optional):
```json
{ "completed_at": "iso|null" }
```
- Behavior:
  - Set `last_completed_at = completed_at || now`.
  - Reset `postponement_count = 0`.
  - Compute new `due_date = last_completed_at + recurrence_value * unit`.
  - Status remains `pending` (no 'completed' status for recurring tasks).
- Response: 204 No Content.
- Errors: 401, 404, 500.
- Note: No 409 for "already completed" - completing a task simply advances its cycle. If called multiple times rapidly, last call wins.

9) POST /api/tasks/{taskId}/postpone
- Description: "I'll do it tomorrow" — push due date by 24h, up to 3 times per cycle.
- Headers: Authorization
- Behavior:
  - If `postponement_count >= 3`, reject with 422.
  - Increment `postponement_count`.
  - Update `due_date = due_date + 1 day`.
  - Change `status` to `postponed`.
- Response 204 No Content.
- Errors: 401, 404, 422 (limit reached), 409 (not eligible), 500.

### 2.6 Motivational Messages

1) GET /api/tasks/{taskId}/motivational-messages/latest
- Description: Fetch the latest motivational message for the task (single item).
- Headers: Authorization
- Response JSON (200):
```json
{ "id":"uuid","task_id":"uuid","message_text":"string","generated_at":"iso" }
```
- Errors: 401, 404 (no message yet or task not owned), 500.

2) POST /api/tasks/{taskId}/motivational-messages/generate
- Description: Generate a new message via OpenRouter AI and persist it.
- Headers: Authorization
- Request JSON (required fields shown):
```json
{ "task_name": "string", "tone": "encouraging|playful|neutral", "max_length": 150 }
```
- Behavior:
  - Compose prompt from `task_name` (taken from task) and optional `tone`.
  - Enforce `message_text` length ≤ 150.
  - Store in `motivational_messages` with `generated_at = now`.
- Response JSON (201): created message record.
- Errors: 400 (invalid), 401, 404, 429 (rate limit), 500.

### 2.7 Dashboard (aggregated views)

1) GET /api/dashboard/tasks
- Description: Aggregated tasks across all user spaces, segmented.
- Headers: Authorization
- Query:
  - `section`: `overdue` | `upcoming` | `all` (default: `all`)
  - `days_ahead`: integer (default: 7) for `upcoming`
  - `page`, `limit`, `sort` (default: `due_date.asc`)
- Behavior:
  - Overdue: tasks where `due_date < now` (computed at query-time).
  - Upcoming: tasks with `due_date ≤ now + days_ahead`.
- Response JSON (200): same list shape as GET /api/tasks.
- Errors: 400, 401, 500.

## 3. Authentication and Authorization

- Mechanism: Supabase Auth JWT. Clients authenticate with `Authorization: Bearer <jwt>`.
- Enforcement:
  - API middleware validates JWT and injects `user_id` from token.
  - Database RLS policies ensure `auth.uid() = user_id` for user-owned rows (`spaces`, `tasks`, `motivational_messages`).
  - System tables (`space_types`, `task_templates`) are read-only.

## 4. Validation and Business Logic

### 4.1 Validation Rules

- UUIDs: Validate `spaceId`, `taskId`, and request `space_id`.
- Spaces:
  - `name`: required, non-empty, max 100 chars.
  - `space_type`: optional; must match existing `space_types.code` if provided.
  - `icon`: optional string, max 50 chars.
  - Duplicate name per user → 409.
- Tasks:
  - `name`: required, non-empty, max 200 chars; immutable after creation.
  - `recurrence_value`: integer > 0.
  - `recurrence_unit`: `days` or `months`.
  - First `due_date` is computed by the server as `now + recurrence`.
  - Enforce `UNIQUE(space_id, name)` → 409.
  - `status`: server-managed; allowed values: pending, postponed.
  - Note: "overdue" is not a physical status but a computed state (when `due_date < now`).
  - `postponement_count`: server-managed; 0..3.
- Motivational Messages:
  - `message_text`: ≤ 150 chars.
  - `task_id`: must belong to the caller.

### 4.2 Business Logic

- Task Completion (`/api/tasks/{taskId}/complete`):
  - Set `last_completed_at = provided || now`.
  - Reset `postponement_count = 0`.
  - Compute next `due_date`:
    - If `recurrence_unit = days`: add `recurrence_value` days to `last_completed_at`.
    - If `months`: add `recurrence_value` calendar months (end-of-month safe add).
  - Status remains `pending` (no separate 'completed' status for recurring tasks).
  - Note: Completing a task immediately starts the next cycle; there is no persistent "completed" state.

- Task Postpone (`/api/tasks/{taskId}/postpone`):
  - If `postponement_count >= 3` → 422.
  - Increment `postponement_count` by 1.
  - `due_date = due_date + 1 day`.
  - Set `status = postponed`.

- Overdue Handling:
  - Overdue is not a physical status in the database.
  - Computed at query-time: task is overdue when `due_date < now` and `status in (pending, postponed)`.
  - Filtering overdue tasks: use `due_before=now` query parameter, not status filter.

- Templates Bulk Add:
  - Resolve templates by `template_id`.
  - Use overrides if provided; else defaults.
  - Skip duplicates per `UNIQUE(space_id, name)` with 409 per-item result.

- Motivational Message Generation:
  - Compose prompt from provided `task_name`.
  - Call OpenRouter with configured model and max tokens to keep 150 chars.
  - Persist message in `motivational_messages`.

### 4.3 Performance and Indexing

- Use DB indexes for efficient queries:
  - `spaces`: index on `user_id`.
  - `tasks`: indexes on `space_id`, and composite on `(user_id, status, due_date)`.
  - `space_types`: unique on `code`, index on `display_order`.
  - `task_templates`: index on `space_type`, composite `(space_type, display_order)`.
- For listing endpoints, always restrict by `user_id` first to leverage composite indexes.
- Use keyset pagination where necessary for very large lists; default is page/limit.

### 4.4 Security Controls

- Authentication: Supabase JWT.
- Authorization: RLS plus application-level ownership checks.
- Input Validation: Zod/Valibot schemas per endpoint.
- Logging: Log request id, user id, method, path, latency, result code (avoid PII in logs).
- Error Handling: Return standardized error JSON; avoid leaking DB internals.



