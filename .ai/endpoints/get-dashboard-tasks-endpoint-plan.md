# API Endpoint Implementation Plan: GET /api/dashboard/tasks

## 1. Przegląd punktu końcowego
Endpoint agreguje zadania ze wszystkich przestrzeni użytkownika z możliwością segmentacji na trzy kategorie: overdue (przeterminowane), upcoming (nadchodzące), all (wszystkie). Wspiera paginację i sortowanie, zwracając listę zadań z zagnieżdżonymi informacjami o przestrzeni.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- URL: `/api/dashboard/tasks`
- Nagłówki:
  - `Authorization`: Bearer <token>
- Parametry query:
  - Wymagane: brak (poza autoryzacją)
  - Opcjonalne:
    - `section` (string): `overdue` | `upcoming` | `all` (domyślnie: `all`)
    - `days_ahead` (integer): liczba dni dla sekcji upcoming (domyślnie: 7, min: 1)
    - `page` (integer, domyślnie 1)
    - `limit` (integer, domyślnie 20, max 100)
    - `sort` (string, domyślnie `due_date.asc`)
- Body: brak

**Logika segmentacji:**
- `overdue`: tasks where `due_date < now`
- `upcoming`: tasks with `due_date ≤ now + days_ahead` 
- `all`: wszystkie zadania bez dodatkowego filtrowania

## 3. Wykorzystywane typy
- DTO:
  - `TaskListDto` (src/types.ts) - główny typ odpowiedzi z `data: TaskDto[]` i `pagination: PaginationDto`
  - `TaskDto` (src/types.ts) - pełne dane zadania z osadzonym `SpaceMinDto`
  - `PaginationDto` (src/types.ts) - informacje o paginacji
- Command Model:
  - `GetDashboardTasksParams` (src/types.ts) - parametry dla funkcji serwisu

## 4. Szczegóły odpowiedzi
- Kody statusów:
  - 200 OK: pomyślnie zwraca `TaskListDto`
  - 400 Bad Request: błąd walidacji parametrów zapytania
  - 401 Unauthorized: brak lub nieważny token autoryzacji
  - 500 Internal Server Error: nieoczekiwany błąd serwera
- Struktura odpowiedzi (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "space_id": "uuid",
      "user_id": "uuid",
      "name": "Odkurzanie",
      "recurrence_value": 7,
      "recurrence_unit": "days",
      "due_date": "2025-11-05T10:00:00.000Z",
      "status": "pending",
      "postponement_count": 0,
      "last_completed_at": "2025-10-29T10:00:00.000Z",
      "created_at": "2025-10-01T10:00:00.000Z",
      "updated_at": "2025-10-29T10:00:00.000Z",
      "space": {
        "id": "uuid",
        "name": "Sypialnia",
        "space_type": "bedroom",
        "icon": "🛏️"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "total_pages": 1
  }
}
```

## 5. Przepływ danych
1. **Middleware Astro**: weryfikacja tokenu JWT i odczyt `userId` z `context.locals.session`
2. **Walidacja parametrów**: użycie Zod schema `GetDashboardTasksQuerySchema` do sparsowania query params
3. **Serwis**: wywołanie `tasksService.getDashboardTasks(supabase, params)`:
   - Budowa zapytania do Supabase z filtrami zależnymi od `section`
   - Dla overdue: `due_date < now()`
   - Dla upcoming: `due_date <= now() + days_ahead`
   - JOIN z tabelą `spaces` dla zagnieżdżonych danych
   - RLS zapewnia zwrot tylko danych danego użytkownika
4. **Formatowanie odpowiedzi**: mapowanie surowych danych na `TaskListDto`
5. **Zwrócenie JSON** z kodem statusu 200

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: wymuszenie obecności i poprawności tokenu JWT w nagłówku (middleware)
- **Autoryzacja**: RLS w Supabase + filtrowanie po `user_id` gwarantuje dostęp tylko do własnych danych
- **Walidacja wejścia**: Zod schema waliduje wszystkie query params (zapobieganie injection)
- **Ochrona przed nadmiernym pobraniem**: limit maksymalny 100 dla parametru `limit`
- **Rate limiting**: rozważyć dla często odświeżanego dashboardu (opcjonalne)

## 7. Obsługa błędów
- 400 Bad Request:
  - Nieprawidłowy `section` (nie jest overdue/upcoming/all)
  - `days_ahead < 1` lub nie jest liczbą
  - `page < 1` lub `limit` poza zakresem 1-100
  - Nieprawidłowy format `sort`
  - Błąd walidacji parametrów zapytania (Zod) → Response 400 z `details`
- 401 Unauthorized:
  - Brak lub nieważna sesja użytkownika (middleware zwraca przed handlerem)
- 500 Internal Server Error:
  - Błąd połączenia z bazą lub nieoczekiwany wyjątek w serwisie
  - Logować szczegóły (console.error) bez ujawniania w response

## 8. Rozważania dotyczące wydajności
- **Indeksy**: `idx_tasks_user_status_due` na `(user_id, status, due_date)` optymalizuje filtrowanie dla overdue/upcoming
- **JOIN optimization**: użycie `spaces!inner(id, name, space_type, icon)` minimalizuje dane
- **Pojedyncze zapytanie**: `.select('*', { count: 'exact' })` zwraca dane + count w jednym roundtrip
- **Limit maksymalny**: 100 zapobiega przeciążeniu
- **Obliczanie dat w aplikacji**: `targetDate` obliczane w TypeScript, nie w SQL (bardziej index-friendly)
- **Monitoring**: logowanie wolnych zapytań (>1000ms) z kontekstem

## 9. Kroki implementacji
1. Dodać typ `GetDashboardTasksParams` w `src/types.ts`
2. Utworzyć Zod schema:
   ```ts
   z.object({
     section: z.enum(['overdue', 'upcoming', 'all']).default('all'),
     days_ahead: z.coerce.number().int().min(1).default(7),
     page: z.coerce.number().int().min(1).default(1),
     limit: z.coerce.number().int().min(1).max(100).default(20),
     sort: z.string().regex(/^(due_date|name|created_at|updated_at)\.(asc|desc)$/).default('due_date.asc'),
   })
   ```
3. Rozszerzyć `src/lib/services/tasksService.ts` o metodę:
   ```ts
   getDashboardTasks(supabase: SupabaseClient, params: GetDashboardTasksParams): Promise<TaskListDto>
   ```
4. Utworzyć plik API: `src/pages/api/dashboard/tasks.ts`:
   - `export const GET: APIRoute` obsługujący żądanie
   - Parsować query params, walidować schema
   - Pobierać `userId` z `context.locals` i wołać `tasksService.getDashboardTasks`
   - Zwracać odpowiedź 200 z `TaskListDto`
5. Zaimplementować logikę warunkowego filtrowania w serwisie:
   - Dla `overdue`: `.lt('due_date', now)`
   - Dla `upcoming`: `.lte('due_date', targetDate)` 
   - Dla `all`: brak dodatkowego filtrowania po `due_date`
6. Testowanie: curl z różnymi parametrami (section, days_ahead, page, limit, sort)
