# API Endpoint Implementation Plan: GET /api/tasks/{taskId}

## 1. Przegląd punktu końcowego
Endpoint `GET /api/tasks/{taskId}` umożliwia pobranie pojedynczego zadania należącego do zalogowanego użytkownika na podstawie jego identyfikatora. Zwracany jest obiekt `TaskDto` wraz z minimalnymi informacjami o przypisanej przestrzeni (`SpaceMinDto`).

## 2. Szczegóły żądania
- Metoda HTTP: GET
- URL: `/api/tasks/{taskId}`
- Nagłówki:
  - `Authorization`: Bearer <token>
- Parametry ścieżki:
  - `taskId` (string, UUID): identyfikator zadania
- Parametry zapytania: brak
- Body: brak

## 3. Wykorzystywane typy
- `TaskDto` (src/types.ts) – pełna reprezentacja zadania z polem `space: SpaceMinDto`
- `SpaceMinDto` (src/types.ts) – minimalne dane przestrzeni

## 4. Szczegóły odpowiedzi
- Kody statusów:
  - 200 OK: pomyślnie zwraca obiekt `TaskDto`
  - 400 Bad Request: nieprawidłowy format `taskId` (np. nie-UUID)
  - 401 Unauthorized: brak lub nieważny token autoryzacji
  - 404 Not Found: zadanie nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error: nieoczekiwany błąd serwera
- Struktura odpowiedzi (200):
```json
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
```

## 5. Przepływ danych
1. Middleware Astro weryfikuje token i odczytuje `userId` z `context.locals`.
2. Handler parsuje `taskId` z parametrów ścieżki i waliduje za pomocą Zod.
3. Wywołanie serwisu `tasksService.getTaskById(userId, taskId)`:
   - Budowa zapytania do Supabase z filtrem po `id` i `user_id` (RLS)
   - Zwrot pojedynczego rekordu lub null
4. Jeżeli wynik istnieje, mapowanie na `TaskDto`; w przeciwnym razie zwrócenie 404.
5. Zwrócenie odpowiedzi JSON z kodem 200 i obiektem `TaskDto`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: wymuszenie obecności valid tokenu w nagłówku (middleware).
- **Autoryzacja**: RLS w bazie zapewnia, że użytkownik otrzymuje tylko swoje dane.
- **Walidacja**: Zod ogranicza nieprawidłowe wartości `taskId`.

## 7. Obsługa błędów
- 400: ZodError przy parsowaniu `taskId` → Response 400 z listą błędów.
- 401: middleware zwraca 401 przed wejściem do handlera.
- 404: brak rekordu lub inny właściciel → Response 404 z komunikatem.
- 500: nieoczekiwane wyjątki → logowanie szczegółów (console.error/Sentry) i Response 500.

## 8. Rozważania dotyczące wydajności
- Zapytanie do bazy po kluczu głównym i dodatkowym filterze na `user_id` obsługiwane przez indeksy → minimalne opóźnienie.
- Brak paginacji, zwracany pojedynczy rekord.

## 9. Kroki wdrożenia
1. Rozbudować serwis `src/lib/services/tasksService.ts` o metodę:
   ```ts
   getTaskById(userId: string, taskId: string): Promise<TaskDto | null>
   ```
2. Utworzyć Zod schema:
   ```ts
   const getTaskParamsSchema = z.object({
     taskId: z.string().uuid(),
   });
   ```
3. Utworzyć plik API: `src/pages/api/tasks/[taskId].ts`:
   - `export const GET: ApiRoute`
   - Parsowanie i walidacja `params.taskId` przez `getTaskParamsSchema`.
   - Pobranie `userId` z `context.locals`, wywołanie `tasksService.getTaskById`.
   - Early return 404 lub 200 z JSON.
