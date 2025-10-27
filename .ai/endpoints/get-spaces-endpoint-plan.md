# API Endpoint Implementation Plan: GET /api/spaces

## 1. Przegląd punktu końcowego
Endpoint służy do pobierania listy przestrzeni (spaces) należących do zalogowanego użytkownika, z obsługą paginacji, sortowania i filtrowania po nazwie.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /api/spaces
- Nagłówki:
  - Authorization: Bearer <token>
- Parametry query:
  - Wymagane:
    - (nagłówek) Authorization
  - Opcjonalne:
    - search: string – filtrowanie po fragmencie nazwy
    - page: integer – numer strony, domyślnie 1
    - limit: integer – liczba rekordów na stronę, domyślnie 20, max 100
    - sort: string – kierunek i pole sortowania, whitelist: ["created_at.asc","created_at.desc","name.asc","name.desc"], domyślnie "created_at.desc"

## 3. Wykorzystywane typy
  - `SpaceListDto` (src/types.ts) - główny typ odpowiedzi
  - `SpaceDto` (src/types.ts) - pojedyncza przestrzeń w liście
  - `PaginationDto` (src/types.ts) - informacje o paginacji

## 4. Szczegóły odpowiedzi
- Kody statusów:
  - 200 OK: zwraca listę
  - 400 Bad Request: walidacja parametrów query nie powiodła się
  - 401 Unauthorized: brak lub nieważny token (obsługa middleware)
  - 500 Internal Server Error: błąd serwerowy
- Struktura odpowiedzi (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Kitchen",
      "space_type": "kitchen",
      "icon": "🍳",
      "created_at": "2025-10-19T10:00:00Z",
      "updated_at": "2025-10-19T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

## 5. Przepływ danych
1. Middleware weryfikuje token i ustawia `locals.user.id`.
2. W handlerze GET:
   - Parsowanie i walidacja query przez Zod (search, page, limit, sort)
   - Wywołanie serwisu `listSpaces({ userId, search, page, limit, sort })`
   - Serwis zwraca obiekt typu `SpaceListDto` zawierający:
     - `data`: array obiektów `SpaceDto[]`
     - `pagination`: obiekt `PaginationDto` z informacjami o stronie
3. Handler serializuje odpowiedź do JSON i zwraca status 200

## 6. Względy bezpieczeństwa
- Autoryzacja: tylko zasoby własne użytkownika (filtrowanie po userId)
- Whitelist sortowania, brak bezpośredniego wstrzykiwania wartości
- Brak wycieku szczegółów błędów do klienta (generyczny komunikat)

## 7. Obsługa błędów
- 400: Zod rzuca `ZodError` → `return new Response(JSON.stringify({ error: err.errors }), { status: 400 })`
- 401: middleware zwraca 401 przed handlerem
- 500: catch-all w handlerze → logowanie i `return new Response(null, { status: 500 })`

## 8. Rozważania dotyczące wydajności
- Limit 100 rekordów na stronę, domyślnie 20 - zapobiega przesyłaniu zbyt dużej ilości danych
- Użycie `.range()` z Supabase dla efektywnej paginacji (LIMIT/OFFSET w SQL)
- Indeks na `user_id` w tabeli `spaces` przyspiesza filtrowanie
- Złożony indeks UNIQUE(`user_id`, `name`) jest wykorzystywany przy sortowaniu i filtracji
- Search query wykorzystuje ILIKE - dla lepszej wydajności można rozważyć full-text search (pg_trgm) w przyszłości
- RLS overhead minimalny - prosty predykat `auth.uid() = user_id`
- Zwracane dane bez JOIN-ów - brak dodatkowych kosztów zapytań złączonych

## 9. Kroki implementacji
1. Utworzyć lub rozbudować `src/lib/services/spacesService.ts`, metodę `listSpaces(params)`
2. Utworzyć plik API: `src/pages/api/spaces.ts`
3. Zaimportować supabase z `context.locals`, Zod oraz serwis
4. Zaimplementować `export const GET`:
   - walidacja query (Zod)
   - pobranie danych z serwisu
   - serializacja do JSON
