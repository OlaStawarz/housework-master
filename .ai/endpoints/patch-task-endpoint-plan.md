# API Endpoint Implementation Plan: PATCH /api/tasks/{taskId}

## 1. Przegląd punktu końcowego
Endpoint `PATCH /api/tasks/{taskId}` umożliwia aktualizację cykliczności zadania. Modyfikowane są tylko pola `recurrence_value` i `recurrence_unit`, a następnie przeliczany jest nowy termin wykonania (`due_date`).

## 2. Szczegóły żądania
- Metoda HTTP: PATCH
- URL: `/api/tasks/{taskId}`
- Nagłówki:
  - `Authorization`: Bearer <token>
  - `Content-Type`: application/json
- Parametry ścieżki:
  - `taskId` (string, UUID) – identyfikator aktualizowanego zadania
- Body (JSON):
  ```json
  {
    "recurrence_value": number,
    "recurrence_unit": "days" | "months"
  }
  ```

## 3. Wykorzystywane typy
- Command Model:
  - `UpdateTaskRecurrenceCommand` (src/types.ts): Pick<TablesUpdate<'tasks'>, 'recurrence_value'|'recurrence_unit'>
  - `UpdateTaskParams` (src/types.ts): { userId: string; taskId: string; command: UpdateTaskRecurrenceCommand }
- DTO:
  - `TaskDto` (src/types.ts) – zaktualizowany obiekt zadania z polami `due_date`, `last_completed_at`, `updated_at` oraz `space: SpaceMinDto`

## 4. Szczegóły odpowiedzi
- Kody statusów:
  - 200 OK: pomyślnie zwraca zaktualizowany `TaskDto`
  - 400 Bad Request: nieprawidłowy format `taskId` lub wartości cykliczności
  - 401 Unauthorized: brak lub nieważny token
  - 404 Not Found: zadanie nie istnieje lub nie należy do użytkownika
  - 422 Unprocessable Entity: błędna kombinacja wartości cykliczności (np. niepozytywna liczba)
  - 500 Internal Server Error: nieoczekiwany błąd serwera
- Struktura odpowiedzi (200):
  ```json
  { /* TaskDto */ }
  ```

## 5. Przepływ danych
1. Middleware weryfikuje token i odczytuje `userId`.
2. Handler PATCH w `src/pages/api/tasks/[taskId].ts`:
   - Parsowanie `taskId` z `params` i walidacja poprzez Zod:
     ```ts
     const schema = z.object({
       taskId: z.string().uuid(),
       recurrence_value: z.number().int().positive(),
       recurrence_unit: z.enum(['days','months']),
     });
     ```
   - Parsowanie body na obiekt `command`.
3. Mapowanie na `UpdateTaskParams` i wywołanie `tasksService.updateTaskRecurrence(params)`:
   - Sprawdzenie własności zadania (RLS + dodatkowe WHERE user_id).
   - Aktualizacja pól `recurrence_value`, `recurrence_unit` oraz przeliczenie i ustawienie nowego `due_date` (bazując na `last_completed_at` lub na `now`).
4. Zwrócenie zaktualizowanego rekordu jako `TaskDto`.

## 6. Względy bezpieczeństwa
- RLS w Supabase oraz dodatkowe zabezpieczenie, że `userId` odpowiada właścicielowi zadania.
- Walidacja Zod zabezpiecza przed nieprawidłowym `taskId` i wartościami recurrences.

## 7. Obsługa błędów
- 400: ZodError → Response 400 z listą błędów.
- 401: middleware → 401.
- 404: brak rekordu lub inny właściciel → Response 404.
- 422: błędne dane cykliczności → Response 422 z komunikatem i kodem błędu.
- 500: catch-all → logowanie (console.error/Sentry) i Response 500.

## 8. Rozważania dotyczące wydajności
- Aktualizacja pojedynczego rekordu po indeksowanym kluczu.
- Przeliczenie `due_date` na serwerze, unikanie kolejnych zapytań.

## 9. Kroki wdrożenia
1. Rozbudować usługę w `src/lib/services/tasksService.ts` o metodę:
   ```ts
   updateTaskRecurrence(params: UpdateTaskParams): Promise<TaskDto>
   ```
2. W pliku `src/pages/api/tasks/[taskId].ts` dodać handler PATCH:
   - Parsowanie i walidacja Zod inline.
   - Wywołanie serwisu i zwrot odpowiedzi 200 lub odpowiedniego kodu.
