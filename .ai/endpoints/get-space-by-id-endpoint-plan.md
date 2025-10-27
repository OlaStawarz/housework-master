# API Endpoint Implementation Plan: GET /api/spaces/{spaceId}

## 1. Przegląd punktu końcowego
Pobiera szczegółowe informacje o pojedynczej przestrzeni (`spaces`) należącej do zalogowanego użytkownika. Endpoint służy do wyświetlania widoku szczegółów przestrzeni oraz do weryfikacji istnienia i dostępu do przestrzeni przed innymi operacjami (np. przed dodaniem zadań).

## 2. Szczegóły żądania
- Metoda: GET
- URL: `/api/spaces/{spaceId}`
- Nagłówki: `Authorization: Bearer <token>`
- Parametry URL:
  - `spaceId` (UUID, required) - identyfikator przestrzeni do pobrania
- Query parameters: brak
- Request Body: brak

**Przykład URL:**
```
GET /api/spaces/550e8400-e29b-41d4-a716-446655440000
```

### Walidacja parametrów URL (Zod Schema)

```typescript
const getSpaceParamsSchema = z.object({
  spaceId: z.string()
    .uuid("Invalid space ID format")
});
```

---

## 3. Wykorzystywane typy
- `SpaceDto` (`src/types.ts`) - typ odpowiedzi reprezentujący pełne dane przestrzeni

---

## 4. Szczegóły odpowiedzi
- 200 OK: zwraca obiekt `SpaceDto`
- 400 Bad Request: nieprawidłowy format UUID
- 401 Unauthorized: brak lub nieprawidłowy token
- 404 Not Found: przestrzeń nie istnieje lub nie należy do użytkownika
- 500 Internal Server Error: błąd serwera

**Przykład 200:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Łazienka główna",
  "space_type": "bathroom",
  "icon": "🚿",
  "created_at": "2025-10-26T10:30:00Z",
  "updated_at": "2025-10-26T10:30:00Z"
}
```

**Przykład 400:**
```json
{
  "error": {
    "code": "invalid_uuid",
    "message": "Invalid space ID format",
    "details": {
      "field": "spaceId",
      "value": "invalid-id"
    }
  }
}
```

**Przykład 404:**
```json
{
  "error": {
    "code": "not_found",
    "message": "Space not found"
  }
}
```

---

## 5. Przepływ danych
1. Middleware weryfikuje token i ustawia `locals.user.id` oraz `locals.supabase`
2. W handlerze GET:
   - Parsowanie i walidacja `spaceId` przez Zod
   - Wywołanie serwisu `getSpaceById({ supabase, spaceId, userId })`
   - Serwis zwraca obiekt typu `SpaceDto` lub rzuca `SpaceNotFoundError`
3. Handler serializuje odpowiedź do JSON i zwraca status 200

---

## 6. Względy bezpieczeństwa
- Autoryzacja: JWT token + RLS na `spaces` (filtrowanie po `user_id`)
- Walidacja Zod wymusza poprawny format UUID
- Zwracamy 404 (nie 403) gdy przestrzeń nie należy do użytkownika - nie ujawniamy istnienia zasobu
- `user_id` jest zawsze pobierane z tokena JWT, nigdy z requestu klienta

---

## 7. Obsługa błędów

| Źródło błędu | Warunek | Status | Kod błędu | Komunikat |
|--------------|---------|--------|-----------|-----------|
| Zod validation | Nieprawidłowy format UUID | 400 | `invalid_uuid` | "Invalid space ID format" |
| Middleware/Auth | Brak/nieprawidłowy token | 401 | `unauthorized` | "Authentication required" |
| SpaceNotFoundError | Przestrzeń nie istnieje lub nie należy do użytkownika | 404 | `not_found` | "Space not found" |
| Supabase/Network | Błąd połączenia z bazą | 500 | `internal_error` | "Internal server error" |
| Inne wyjątki | Nieoczekiwany błąd | 500 | `internal_error` | "Internal server error" |

---

## 8. Rozważania dotyczące wydajności
- SELECT by PRIMARY KEY - bardzo szybkie dzięki indeksowi na `id` (UUID)
- Zwraca maksymalnie jeden rekord
- Brak JOIN-ów - endpoint zwraca tylko dane z tabeli `spaces`
- RLS overhead minimalne - proste sprawdzenie `auth.uid() = user_id`
- Caching potential: przestrzenie rzadko się zmieniają - można dodać cache w przyszłości

---

## 9. Kroki implementacji
1. Dodać `SpaceNotFoundError` w `src/lib/services/spacesService.ts`
2. Wprowadzić metodę `getSpaceById` w `src/lib/services/spacesService.ts`
3. Utworzyć plik `src/pages/api/spaces/[spaceId].ts` z dynamicznym parametrem
4. Zaimplementować handler GET wg wzorca z innych endpointów

