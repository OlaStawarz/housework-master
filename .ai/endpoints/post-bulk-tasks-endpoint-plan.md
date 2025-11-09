# API Endpoint Implementation Plan: POST /api/spaces/{spaceId}/tasks/bulk-from-templates

## 1. Przegląd punktu końcowego
Endpoint `POST /api/spaces/{spaceId}/tasks/bulk-from-templates` umożliwia masowe tworzenie zadań na podstawie szablonów dla wskazanej przestrzeni. Dla każdej pozycji:
- pobiera szablon (`task_templates`),
- stosuje nadpisania wartości cykliczności, jeśli podane,
- oblicza `due_date = now + value * unit`,
- tworzy zadanie lub zwraca błąd duplikatu.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- URL: `/api/spaces/{spaceId}/tasks/bulk-from-templates`
- Nagłówki:
  - `Authorization`: Bearer <token>
  - `Content-Type`: application/json
- Parametry ścieżki:
  - `spaceId` (string, UUID) – identyfikator przestrzeni
- Body (JSON):
  ```json
  {
    "items": [
      {
        "template_id": "uuid",
        "override_recurrence_value": number | null,
        "override_recurrence_unit": "days" | "months" | null
      }
    ]
  }
  ```

## 3. Wykorzystywane typy
- Command Model:
  - `BulkCreateTaskItemCommand` (src/types.ts): { template_id: string; override_recurrence_value: number|null; override_recurrence_unit: RecurrenceUnit|null }
  - `BulkCreateTasksCommand` (src/types.ts): { items: BulkCreateTaskItemCommand[] }
  - `BulkCreateTasksParams`: { userId: string; spaceId: string; command: BulkCreateTasksCommand }
- DTO:
  - `BulkCreateTaskResultDto` (src/types.ts): wynik pojedynczego elementu { status, task } lub { status, error }
  - `BulkCreateTasksResponseDto` (src/types.ts): { results: BulkCreateTaskResultDto[] }

## 4. Szczegóły odpowiedzi
- Kody statusów:
  - 207 Multi-Status: lista wyników w `BulkCreateTasksResponseDto`
  - 400 Bad Request: błąd walidacji payloadu lub formatu `spaceId`
  - 401 Unauthorized: brak lub nieważny token
  - 404 Not Found: przestrzeń lub szablon nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error: nieoczekiwany błąd serwera
- Struktura odpowiedzi (207):
  ```json
  {
    "results": [
      { "status": 201, "task": { /* TaskDto */ } },
      { "status": 409, "error": { "code": "duplicate_task", "message": "...", "template_id": "uuid" } }
    ]
  }
  ```

## 5. Przepływ danych
1. Middleware weryfikuje autoryzację i odczytuje `userId`.
2. Handler parsuje `spaceId` z parametrów ścieżki i body JSON. Walidacja za pomocą Zod:
   ```ts
   const schema = z.object({
     spaceId: z.string().uuid(),
     items: z.array(z.object({
       template_id: z.string().uuid(),
       override_recurrence_value: z.number().int().positive().nullable(),
       override_recurrence_unit: z.enum(['days','months']).nullable()
     }))
   });
   ```
3. Mapowanie na `BulkCreateTasksParams` i wywołanie `tasksService.bulkCreateFromTemplates(params)`:
   - Weryfikacja właściwości przestrzeni.
   - Pętla po pozycjach: dla każdej pobranie szablonu, ustalenie wartości cykliczności, obliczenie `due_date`, próba INSERT.
   - Dla duplikatów zwrócenie 409 w poszczególnym wyniku.
4. Zebranie wyników w tablicę `BulkCreateTaskResultDto[]`.
5. Zwrot Response 207 z `BulkCreateTasksResponseDto`.

## 6. Względy bezpieczeństwa
- RLS zapewnia dostęp tylko do własnych zasobów.
- Dodatkowa weryfikacja, że `spaceId` należy do `userId`.
- Walidacja Zod zabezpiecza przed niepoprawnym payloadem.

## 7. Obsługa błędów
- 400: ZodError → 400 z listą błędów.
- 401: middleware → 401.
- 404: brak przestrzeni lub szablonu → 404.
- 500: catch-all → logowanie i 500.

## 8. Rozważania dotyczące wydajności
- Możliwość batched INSERT w transakcji.
- Optymalizacja pobierania szablonów jednym zapytaniem `IN`.
- Obsługa dużych tablic przez ograniczenie maksymalnej liczby pozycji (np. max 50).

## 9. Kroki wdrożenia
1. Rozbudować `src/lib/services/tasksService.ts` o metodę:
   ```ts
   bulkCreateFromTemplates(params: BulkCreateTasksParams): Promise<BulkCreateTasksResponseDto>
   ```
2. Stworzyć plik API: `src/pages/api/spaces/[spaceId]/tasks/bulk-from-templates.ts` z handlerem POST:
   - Parsowanie i walidacja Zod inline.
   - Wywołanie serwisu i zwrot 207.
