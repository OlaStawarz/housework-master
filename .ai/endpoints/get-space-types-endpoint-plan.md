# API Endpoint Implementation Plan: GET /api/space-types

## 1. Przegląd punktu końcowego
Pobiera listę wszystkich dostępnych typów przestrzeni z tabeli systemowej `space_types`. Endpoint jest publiczny (dostępny dla zalogowanych użytkowników), tylko do odczytu i zwraca predefiniowaną listę typów używanych przy tworzeniu nowych przestrzeni. Lista jest posortowana według `display_order` dla zapewnienia spójnej kolejności w UI.

## 2. Szczegóły żądania
- Metoda: GET
- URL: `/api/space-types`
- Nagłówki: Brak wymaganych (opcjonalnie `Authorization` jeśli middleware wymusza)
- Parametry URL: brak
- Query parameters: brak
- Request Body: brak

**Przykład URL:**
```
GET /api/space-types
```

---

## 3. Wykorzystywane typy
- `SpaceTypeDto` (`src/types.ts`) - pojedynczy typ przestrzeni w liście

---

## 4. Szczegóły odpowiedzi
- 200 OK: zwraca listę typów przestrzeni
- 500 Internal Server Error: błąd serwera

**Przykład 200:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "kitchen",
      "display_name": "Kuchnia",
      "icon": "🍳",
      "display_order": 1
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "code": "bathroom",
      "display_name": "Łazienka",
      "icon": "🚿",
      "display_order": 2
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "code": "bedroom",
      "display_name": "Sypialnia",
      "icon": "🛏️",
      "display_order": 3
    }
  ]
}
```

---

## 5. Przepływ danych
1. Handler GET w `src/pages/api/space-types.ts`:
   - Pobiera instancję `supabase` z `context.locals`
   - Wywołuje serwis `listSpaceTypes(supabase)`
   - Zwraca odpowiedź z tablicą typów w formacie `{ data: SpaceTypeDto[] }`
2. Service Layer:
   - Wykonuje SELECT na tabeli `space_types`
   - Sortuje po `display_order ASC`
   - Zwraca wszystkie rekordy (brak paginacji - tabela mała)

---

## 6. Względy bezpieczeństwa
- Dane publiczne: typy przestrzeni są danymi systemowymi dostępnymi dla wszystkich użytkowników
- RLS policy: SELECT dozwolony dla authenticated users (lub public w zależności od konfiguracji)
- Read-only: Tabela jest tylko do odczytu dla użytkowników aplikacji
- Brak parametrów wejściowych: minimalne ryzyko injection attacks
- Brak wrażliwych danych: kod, nazwa i ikona są bezpiecznymi informacjami publicznymi

---

## 7. Obsługa błędów

| Źródło błędu | Warunek | Status | Kod błędu | Komunikat |
|--------------|---------|--------|-----------|-----------|
| Supabase/Network | Błąd połączenia z bazą | 500 | `internal_error` | "Internal server error" |
| Inne wyjątki | Nieoczekiwany błąd | 500 | `internal_error` | "Internal server error" |

**Uwaga:** Endpoint nie wymaga obsługi błędów 401, 404, czy 400 - po prostu zawsze zwraca listę (pustą w najgorszym przypadku).

---

## 8. Rozważania dotyczące wydajności
- **Tabela mała:** < 20 rekordów, SELECT jest bardzo szybki
- **Brak paginacji:** Nie jest potrzebna ze względu na małą liczbę rekordów
- **Indeks na display_order:** Przyspiesza sortowanie (zgodnie z db-plan.md)
- **Caching potential:** Dane zmieniają się bardzo rzadko - idealny kandydat do cache
- **Brak JOIN-ów:** Prosty SELECT z pojedynczej tabeli
- **RLS overhead:** Minimalny - prosty predykat na authenticated users

**Rekomendacje optymalizacji (opcjonalne dla MVP):**
- Cache response na 1h lub więcej (Redis, CDN, lub HTTP Cache-Control headers)
- Dane można również załadować przy inicjalizacji aplikacji i trzymać w pamięci

---

## 9. Kroki implementacji
1. Utworzyć serwis `src/lib/services/spaceTypesService.ts` z metodą `listSpaceTypes`
2. Utworzyć plik API: `src/pages/api/space-types.ts`
3. Zaimplementować handler GET wykonujący SELECT z sortowaniem po `display_order`
4. Zwrócić dane w formacie `{ data: SpaceTypeDto[] }`

