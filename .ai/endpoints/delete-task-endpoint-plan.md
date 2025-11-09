# API Endpoint Implementation Plan: DELETE /api/tasks/{taskId}

## 1. Przegląd punktu końcowego
Endpoint `DELETE /api/tasks/{taskId}` umożliwia trwałe usunięcie zadania należącego do zalogowanego użytkownika na podstawie jego identyfikatora.

## 2. Szczegóły żądania
- Metoda HTTP: DELETE
- URL: `/api/tasks/{taskId}`
- Nagłówki:
  - `Authorization`: Bearer <token>
- Parametry ścieżki:
  - `taskId` (string, UUID): identyfikator zadania do usunięcia
- Body: brak

## 3. Wykorzystywane typy
- Command Model (nie istnieje w typach; zdefiniować inline):
  ```ts
  interface DeleteTaskParams {
    userId: string;
    taskId: string;
  }
  ```

## 4. Szczegóły odpowiedzi
- Kody statusów:
  - 204 No Content: zadanie usunięte pomyślnie
  - 400 Bad Request: nieprawidłowy format `taskId` (np. nie-UUID)
  - 401 Unauthorized: brak lub nieważny token
  - 404 Not Found: zadanie nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error: nieoczekiwany błąd serwera
- Brak ciała odpowiedzi przy 204

## 5. Przepływ danych
1. Middleware weryfikuje token i odczytuje `userId`.
2. Handler DELETE w `src/pages/api/tasks/[taskId].ts`:
   - Parsowanie `taskId` z `params` i walidacja przez Zod:
     ```ts
     const paramsSchema = z.object({ taskId: z.string().uuid() });
     ```
3. Mapowanie na `DeleteTaskParams` i wywołanie `tasksService.deleteTask(params)`:
   - Serwis wykonuje DELETE na tabeli `tasks` z warunkiem `id = taskId` i `user_id = userId`.
   - Sprawdza, czy usunięto dokładnie jeden wiersz; jeśli 0 → rzuca `NotFoundError`.
4. Jeśli usunięto, zwraca Response 204.

## 6. Względy bezpieczeństwa
- RLS w Supabase blokuje usuwanie cudzych zasobów.
- Dodatkowo warunek `user_id = userId` w zapytaniu DELETE.
- Walidacja Zod zabezpiecza przed nieprawidłowymi `taskId`.

## 7. Obsługa błędów
- 400: ZodError → Response 400 z listą błędów.
- 401: middleware → Response 401.
- 404: brak rekordu → Response 404 z komunikatem.
- 500: catch-all → logowanie (console.error/Sentry) i Response 500.

## 8. Rozważania dotyczące wydajności
- DELETE na kluczu głównym z dodatkowym filtrem na `user_id` obsługiwany przez indeks → minimalne opóźnienie.
- Brak dodatkowych odczytów.

## 9. Kroki wdrożenia
1. Rozbudować serwis `src/lib/services/tasksService.ts` o metodę:
   ```ts
   deleteTask(params: DeleteTaskParams): Promise<void>
   ```
   która wykonuje DELETE i rzuca `NotFoundError` jeśli brak wiersza.
2. W pliku `src/pages/api/tasks/[taskId].ts` dodać handler DELETE:
   - Parsowanie i walidacja `params.taskId` przez Zod inline.
   - Pobranie `userId` z `context.locals`.
   - Wywołanie `tasksService.deleteTask`.
   - Zwrócenie Response 204.
