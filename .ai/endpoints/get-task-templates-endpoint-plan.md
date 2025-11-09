# API Endpoint Implementation Plan: GET /api/task-templates

## 1. Przegląd punktu końcowego
Endpoint `GET /api/task-templates` umożliwia pobranie listy szablonów zadań systemowych. Wspiera opcjonalne filtrowanie po `space_type` oraz sortowanie według domyślnej kolejności `space_type.asc,display_order.asc`.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- URL: `/api/task-templates`
- Nagłówki: Brak wymaganych (opcjonalnie `Authorization` jeśli middleware wymusza)
- Parametry zapytania:
  - `space_type` (string, opcjonalne): kod typu przestrzeni dla filtrowania np. `kitchen`
  - `sort` (string, opcjonalne): lista pól i kierunków oddzielonych przecinkiem, domyślnie `space_type.asc,display_order.asc`
- Body: brak

## 3. Wykorzystywane typy
- `TaskTemplateDto` (src/types.ts) – reprezentacja szablonu zadania: `id`, `space_type`, `task_name`, `default_recurrence_value`, `default_recurrence_unit`, `display_order`

## 4. Szczegóły odpowiedzi
- Kody statusów:
  - 200 OK: zwraca tablicę `TaskTemplateDto[]`
  - 400 Bad Request: nieprawidłowe wartości parametrów zapytania
  - 500 Internal Server Error: błąd serwera
- Struktura odpowiedzi (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "space_type": "kitchen",
      "task_name": "Take out trash",
      "default_recurrence_value": 3,
      "default_recurrence_unit": "days",
      "display_order": 1
    }
  ]
}
```

## 5. Przepływ danych
1. Middleware (opcjonalnie) weryfikuje token i realizuje RLS.
2. Handler GET w `src/pages/api/task-templates.ts`:
   - Odczyt `searchParams` z URL.
   - Walidacja parametrów za pomocą Zod
   - Parsowanie wyników.
3. Wywołanie serwisu `taskTemplatesService.list({ spaceType, sort })`:
   - Budowa zapytania Supabase
   - Pobranie wszystkich rekordów.
4. Zwrócenie Response 200 z obiektem `{ data: TaskTemplateDto[] }`.

## 6. Względy bezpieczeństwa
- RLS w Supabase pozwala na selekcję tylko uprawnionym użytkownikom.
- Brak wrażliwych danych w szablonach (publiczne, tylko do odczytu).
- Walidacja Zod zabezpiecza przed złym formatem parametrów.

## 7. Obsługa błędów
- 400: ZodError → Response z kodem 400 i szczegółami błędów.
- 500: nieoczekiwane wyjątki → logowanie (console.error/Sentry) i Response 500.

## 8. Rozważania dotyczące wydajności
- Tabela `task_templates` jest niewielka (kilkadziesiąt rekordów) → szybki SELECT.
- Indeks na kolumnach `space_type` i `(space_type, display_order)` wspiera filtrowanie i sortowanie.
- Możliwość dodania cache (Redis lub HTTP Cache-Control) dla rzadko zmieniających się danych.

## 9. Kroki wdrożenia
1. Utworzyć serwis `src/lib/services/taskTemplatesService.ts` z metodą:
   ```ts
   list(params: { spaceType?: string; sort?: string }): Promise<TaskTemplateDto[]>
   ```
2. Utworzyć plik API: `src/pages/api/task-templates.ts` z handlerem GET.
3. Zaaplikować walidację parametrów i wywołać serwis.
4. Zwrócić odpowiedź 200 z obiektem `{ data: TaskTemplateDto[] }`.
