# API Endpoint Implementation Plan: GET /api/tasks

## 1. Przegląd punktu końcowego
Endpoint `GET /api/tasks` umożliwia pobranie listy zadań użytkownika z jego wszystkich przestrzeni. Wspiera filtrowanie, sortowanie i paginację.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Ścieżka: `/api/tasks`
- Nagłówki:
  - `Authorization`: Bearer token (sesja użytkownika)
- Parametry zapytania:
  - Wymagane: brak (poza autoryzacją)
  - Opcjonalne:
    - `space_id` (string): UUID przestrzeni, aby filtrować zadania dla konkretnej przestrzeni
    - `status` (string): wartość z `pending`, `postponed` (filtrowanie wg stanu)
    - `due_before` (ISO timestamp):  zwraca zadania z terminem przed wskazanym
    - `due_after` (ISO timestamp): zwraca zadania z terminem po wskazanym
    - `page` (integer, domyślnie 1)
    - `limit` (integer, domyślnie 20)
    - `sort` (string, domyślnie `recurrence.asc`)
      - Obsługiwane wartości sortowania: `due_date.asc`, `due_date.desc`, `recurrence.asc`, `recurrence.desc`
      - `recurrence.asc` sortuje najpierw po `recurrence_unit` (dni przed miesiącami), następnie po `recurrence_value` rosnąco
      - `recurrence.desc` sortuje najpierw po `recurrence_unit` (miesiące przed dniami), następnie po `recurrence_value` malejąco
- Body: brak

## 3. Wykorzystywane typy
- DTO:
  - `TaskDto` (pełne dane zadania z osadzonym `SpaceMinDto`)
  - `PaginationDto` (informacje o paginacji)
  - `TaskListDto` (lista zadań)

## 4. Szczegóły odpowiedzi
- Kody statusów:
  - 200 OK: pomyślnie zwraca `TaskListDto`
  - 400 Bad Request: błąd walidacji parametrów zapytania
  - 401 Unauthorized: brak lub nieważny token autoryzacji
  - 404 Not Found: zasób nie został znaleziony
  - 500 Internal Server Error: nieoczekiwany błąd serwera
- Struktura odpowiedzi (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "space_id": "uuid",
      "user_id": "uuid",
      "name": "Vacuum",
      "recurrence_value": 7,
      "recurrence_unit": "days",
      "due_date": "2025-11-04T12:00:00Z",
      "status": "pending",
      "postponement_count": 0,
      "last_completed_at": null,
      "created_at": "2025-11-01T10:00:00Z",
      "updated_at": "2025-11-02T11:00:00Z",
      "space": {
        "id": "uuid",
        "name": "Bedroom",
        "space_type": "bedroom",
        "icon": "🛏️"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

## 5. Przepływ danych
1. **Middleware Astro**: odczyt sesji użytkownika (`context.locals.supabase.auth.getSession()`)
2. **Walidacja parametrów**: użycie Zod schema do sparsowania `req.url.searchParams`
3. **Serwis**: wywołanie `tasksService.getTasks(userId, filters)`:
   - Budowa zapytania do Supabase z filtrami, paginacją, sortowaniem
   - Specjalne sortowanie dla `recurrence.asc` / `recurrence.desc`:
     - Mapowanie `recurrence_unit` do wartości numerycznych (days=1, months=2) dla sortowania
     - Sortowanie wielopoziomowe: najpierw po zmapowanej jednostce, potem po wartości
   - RLS zapewnia zwrot tylko danych danego użytkownika
4. **Formatowanie odpowiedzi**: mapowanie surowych danych na `TaskListDto`
5. **Zwrócenie JSON** z kodem statusu 200

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: wymuszenie obecności i poprawności tokenu w nagłówku
- **Autoryzacja**: RLS w Supabase gwarantuje, że użytkownik widzi tylko swoje zadania
- **Walidacja wejścia**: Zod (zapobieganie wstrzyknięciom SQL w parametrach filtrujących)
- **Ochrona przed nadmiernym pobraniem**: limit maksymalny (np. 100) dla parametru `limit`

## 7. Obsługa błędów
- 400 Bad Request:
  - Błąd walidacji parametrów zapytania (Zod)
- 401 Unauthorized:
  - Brak lub nieważna sesja użytkownika
- 500 Internal Server Error:
  - Błąd połączenia z bazą lub nieoczekiwany wyjątek w serwisie
  - Logować szczegóły (console.error lub Sentry)

## 8. Rozważania dotyczące wydajności
- Indeksy na kolumnach `space_id`, `status`, `due_date`, `recurrence_unit`, `recurrence_value` (zgodnie z planem bazy danych)
- Ograniczenie `limit` do rozsądnej wartości (np. max 100)
- Unikanie zbędnych JOIN-ów (jedno zapytanie Supabase zwraca `space` jako relację)
- Dla sortowania po cykliczności, użycie composite ordering w Supabase (order by unit, then by value)

## 9. Kroki wdrożenia
1. Dodać typy do `src/types.ts`:
   - `GetTasksQuery` - parametry filtrowania i paginacji dla getTasks
   - `GetTasksParams` - parametry dla funkcji serwisowej getTasks
2. Rozszerzyć serwis w `src/lib/services/tasksService.ts` o funkcję `getTasks(supabase: SupabaseClient, params: GetTasksParams): Promise<TaskListDto>`.
3. W serwisie zaimplementować:
   - Budowę zapytania Supabase z filtrami, paginacją
   - Obsługę różnych rodzajów sortowania, w tym specjalnego sortowania `recurrence.asc` i `recurrence.desc`
   - Mapowanie wyników na `TaskListDto` z zagnieżdżonym `SpaceMinDto`
4. Zdefiniować Zod schema dla parametrów zapytania w `src/pages/api/tasks.ts`.
5. Utworzyć (lub zmodyfikować) plik `src/pages/api/tasks.ts`:
   - `export const GET: ApiRoute` obsługujący żądanie
   - Parsować `searchParams`, walidować schema
   - Pobierać `userId` z `context.locals` i wołać `tasksService.getTasks`
   - Zwracać odpowiedź 200 z `TaskListDto`
