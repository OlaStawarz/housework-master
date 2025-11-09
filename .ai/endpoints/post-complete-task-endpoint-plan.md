# API Endpoint Implementation Plan: POST /api/tasks/{taskId}/complete

## 1. Przegląd punktu końcowego
Endpoint `POST /api/tasks/{taskId}/complete` służy do oznaczenia zadania jako wykonane w bieżącym cyklu. Po wykonaniu:
- `last_completed_at` zostaje ustawione na przekazany `completed_at` lub `now`,
- `postponement_count` zostaje zresetowany do 0,
- obliczany jest nowy `due_date = last_completed_at + recurrence_value * unit`,
- status pozostaje `pending`.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- URL: `/api/tasks/{taskId}/complete`
- Nagłówki:
  - `Authorization`: Bearer <token>
  - `Content-Type`: application/json
- Parametry ścieżki:
  - `taskId` (string, UUID) – identyfikator zadania do ukończenia
- Body (opcjonalne JSON):
  ```json
  { "completed_at": "ISO timestamp" | null }
  ```
  - jeśli brak pola lub `null`, użyj aktualnego czasu serwera

## 3. Wykorzystywane typy
- Command Model:
  - `CompleteTaskCommand` (src/types.ts): { completed_at?: string | null }
  - `CompleteTaskParams` (definiowany inline):
    ```ts
    interface CompleteTaskParams {
      userId: string;
      taskId: string;
      command: CompleteTaskCommand;
    }
    ```
- DTO:
  - `TaskDto` (src/types.ts) – zaktualizowany stan zadania: `id`, `due_date`, `last_completed_at`, `postponement_count`, `status` i `space: SpaceMinDto`

## 4. Szczegóły odpowiedzi
- Kody statusów:
  - 204 No Content: operacja zakończona pomyślnie, brak ciała odpowiedzi
  - 400 Bad Request: nieprawidłowy format `taskId` lub `completed_at`
  - 401 Unauthorized: brak lub nieważny token
  - 404 Not Found: zadanie nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error: nieoczekiwany błąd serwera

## 5. Przepływ danych
1. Middleware weryfikuje token i odczytuje `userId`.
2. Handler POST w `src/pages/api/tasks/[taskId]/complete.ts`:
   - Parsowanie `taskId` z `params` i validation via Zod.
   - Parsowanie body JSON i walidacja.
3. Mapowanie na `CompleteTaskParams` i wywołanie `tasksService.completeTask(params)`:
   - Pobranie zadania i wykonanie operacji (ustawienie daty, reset licznika, przeliczenie `due_date`).
4. Zwrócenie Response 204 No Content.

## 6. Względy bezpieczeństwa
- RLS w Supabase oraz dodatkowe zabezpieczenie warunkiem `user_id = userId`.
- Walidacja Zod zabezpiecza przed nieprawidłowymi wartościami.

## 7. Obsługa błędów
- 400: ZodError → Response 400 z listą błędów.
- 401: middleware → Response 401.
- 404: brak rekordu → Response 404.
- 500: catch-all → logowanie (console.error/Sentry) i Response 500.

## 8. Rozważania dotyczące wydajności
- Pojedyncza operacja UPDATE na indeksowanym kluczu głównym.
- Minimalne narzuty, brak dodatkowych zapytań.

## 9. Kroki wdrożenia
1. Rozbudować `src/lib/services/tasksService.ts` o metodę:
   ```ts
   completeTask(params: CompleteTaskParams): Promise<void>
   ```
2. Utworzyć plik API: `src/pages/api/tasks/[taskId]/complete.ts` z handlerem POST:
   - Parsowanie i walidacja inline Zod,
   - Wywołanie serwisu i zwrócenie Response 204.
