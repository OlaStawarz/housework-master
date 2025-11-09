# API Endpoint Implementation Plan: POST /api/tasks

## 1. Przegląd punktu końcowego
Endpoint `POST /api/tasks` umożliwia utworzenie nowego, niestandardowego zadania w wybranej przestrzeni użytkownika. Oblicza początkowy termin wykonania (`due_date`) na podstawie wartości cykliczności oraz wymusza unikalność nazwy w obrębie tej przestrzeni.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- URL: `/api/tasks`
- Nagłówki:
  - `Authorization`: Bearer <token>
  - `Content-Type`: application/json
- Body (JSON):
  ```json
  {
    "space_id": "uuid",
    "name": "string",
    "recurrence_value": number,
    "recurrence_unit": "days" | "months"
  }
  ```

## 3. Wykorzystywane typy
- Command Model:
  - `CreateTaskCommand` (src/types.ts): Pick<TablesInsert<'tasks'>, 'space_id'|'name'|'recurrence_value'|'recurrence_unit'>
  - `CreateTaskParams` (src/types.ts): { userId: string; command: CreateTaskCommand }
- DTO:
  - `TaskDto` (src/types.ts) – zwracany obiekt zadania z polami `space: SpaceMinDto`

## 4. Szczegóły odpowiedzi
- Kody statusów:
  - 201 Created: zadanie utworzone pomyślnie, zwraca `TaskDto`
  - 400 Bad Request: błąd walidacji payloadu
  - 401 Unauthorized: brak lub nieważny token
  - 404 Not Found: przestrzeń nie istnieje lub nie należy do użytkownika
  - 409 Conflict: nazwa zadania duplikat w obrębie przestrzeni
  - 500 Internal Server Error: nieoczekiwany błąd serwera
- Struktura odpowiedzi (201):
  ```json
  {
    "id": "uuid",
    "space_id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "recurrence_value": number,
    "recurrence_unit": "days" | "months",
    "due_date": "ISO timestamp",
    "status": "pending",
    "postponement_count": 0,
    "last_completed_at": null,
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp",
    "space": { "id": "uuid", "name": "string", "space_type": "string", "icon": "string" }
  }
  ```

## 5. Przepływ danych
1. Middleware Astro weryfikuje token i odczytuje `userId` z `context.locals`.
2. Handler `POST` w `src/pages/api/tasks.ts`:
   - Parsuje JSON z `req.json()` i waliduje payload przy pomocy Zod.
   - Mapuje do `CreateTaskParams`.
3. Wywołanie serwisu `tasksService.createTask(params)`:
   - Sprawdza istnienie i własność przestrzeni (`space_id`).
   - Oblicza `due_date = now + recurrence_value * unit`.
   - Wstawia rekord do tabeli `tasks`, uwzględniając `UNIQUE(space_id, name)`.
4. Mapowanie zwróconego rekordu na `TaskDto` (zagnieżdżając `SpaceMinDto`).
5. Zwrócenie Response 201 z JSON.

## 6. Względy bezpieczeństwa
- Autoryzacja: tylko zalogowany użytkownik może utworzyć zadanie w swojej przestrzeni.
- RLS i dodatkowe sprawdzenie własności przestrzeni w serwisie.
- Walidacja payloadu przez Zod zapobiegająca wstrzyknięciom.
- Limit długości nazwy (zgodnie z definicją bazy: VARCHAR(200)).

## 7. Obsługa błędów
- 400: ZodError → Response z `err.errors`.
- 401: middleware zwraca przed handlerem.
- 404: brak przestrzeni lub inny właściciel → Response 404.
- 409: błąd unikalności → Response 409 z kodem i wiadomością.
- 500: catch-all → logowanie (console.error/Sentry) i Response 500.

## 8. Rozważania dotyczące wydajności
- Pojedyncze INSERT, niski narzut.
- Indeks na `(space_id, name)` wspiera wykrywanie duplikatów.
- Obliczenie `due_date` na serwerze, unikanie dodatkowych zapytań.

## 9. Kroki wdrożenia
1. Rozbudować `src/lib/services/tasksService.ts` o metodę:
   ```ts
   createTask(params: CreateTaskParams): Promise<TaskDto>
   ```
2. Utworzyć Zod schema:
   ```ts
   const createTaskSchema = z.object({
     space_id: z.string().uuid(),
     name: z.string().min(1).max(200),
     recurrence_value: z.number().int().positive(),
     recurrence_unit: z.enum(['days', 'months']),
   });
   ```
3. W pliku `src/pages/api/tasks.ts` dodać handler POST:
   - Parsowanie i walidacja payloadu.
   - Pobranie `userId` z `context.locals`.
   - Wywołanie `tasksService.createTask`.
   - Early return on 404/409.
   - Zwrócenie 201 z obiektem `TaskDto`.
