# API Endpoint Implementation Plan: POST /api/tasks/{taskId}/postpone

## 1. Przegląd punktu końcowego
Endpoint `POST /api/tasks/{taskId}/postpone` służy do odroczenia terminu wykonania zadania o 1 dzień, maksymalnie 3 razy w bieżącym cyklu. Po odroczeniu:
- `postponement_count` jest inkrementowany o 1,
- `due_date` jest przesuwany o 1 dzień,
- `status` zmieniany na `postponed`.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- URL: `/api/tasks/{taskId}/postpone`
- Nagłówki:
  - `Authorization`: Bearer <token>
- Parametry ścieżki:
  - `taskId` (string, UUID) – identyfikator zadania do odroczenia
- Body: brak

## 3. Wykorzystywane typy
- Command Model:
  - `PostponeTaskCommand` (src/types.ts): `{}`
  - `PostponeTaskParams` (definiowany inline):
    ```ts
    interface PostponeTaskParams {
      userId: string;
      taskId: string;
      command: PostponeTaskCommand;
    }
    ```

## 4. Szczegóły odpowiedzi
- Kody statusów:
  - 204 No Content: operacja zakończona pomyślnie, brak ciała odpowiedzi
  - 400 Bad Request: nieprawidłowy format `taskId` (UUID)
  - 401 Unauthorized: brak lub nieważny token
  - 404 Not Found: zadanie nie istnieje lub nie należy do użytkownika
  - 422 Unprocessable Entity: limit odroczeń osiągnięty (>=3)
  - 409 Conflict: zadanie nie kwalifikuje się do odroczenia (np. już postawione/postponed)
  - 500 Internal Server Error: nieoczekiwany błąd serwera

## 5. Przepływ danych
1. Middleware weryfikuje token i odczytuje `userId`.
2. Handler POST w `src/pages/api/tasks/[taskId]/postpone.ts`:
   - Parsowanie `taskId` z `params` i walidacja przez Zod:
     ```ts
     const paramsSchema = z.object({ taskId: z.string().uuid() });
     ```
3. Mapowanie na `PostponeTaskParams` i wywołanie `tasksService.postponeTask(params)`:
   - Pobranie zadania (RLS + `user_id = userId`),
   - Kontrola `postponement_count` (<3),
   - Inkrementacja licznika i zmiana `status` na `postponed`,
   - Przesunięcie `due_date` o 1 dzień.
4. Zwrócenie Response 204 No Content.

## 6. Względy bezpieczeństwa
- RLS w Supabase oraz dodatkowe zabezpieczenie warunkiem `user_id = userId`.
- Walidacja Zod zabezpiecza przed nieprawidłowym `taskId`.

## 7. Obsługa błędów
- 400: ZodError → Response 400 z listą błędów.
- 401: middleware → Response 401.
- 404: brak rekordu → Response 404.
- 422: limit odroczeń → Response 422 z kodem i komunikatem.
- 409: niekwalifikowalność → Response 409.
- 500: catch-all → logowanie (console.error/Sentry) i Response 500.

## 8. Rozważania dotyczące wydajności
- Single UPDATE na indeksowanym rekordzie.
- Minimalne koszty operacji.

## 9. Kroki wdrożenia
1. Rozbudować usługę `src/lib/services/tasksService.ts` o metodę:
   ```ts
   postponeTask(params: PostponeTaskParams): Promise<void>
   ```
2. Utworzyć plik API: `src/pages/api/tasks/[taskId]/postpone.ts` z handlerem POST:
   - Parsowanie i walidacja inline Zod,
   - Wywołanie serwisu i zwrócenie Response 204.
