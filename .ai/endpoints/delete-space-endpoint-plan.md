# API Endpoint Implementation Plan: DELETE /api/spaces/{spaceId}

## 1. Przegląd punktu końcowego
Trwale usuwa przestrzeń (`spaces`) należącą do zalogowanego użytkownika wraz ze wszystkimi przypisanymi do niej zadaniami. Operacja wykorzystuje CASCADE DELETE na poziomie bazy danych, więc usunięcie przestrzeni automatycznie usuwa wszystkie powiązane rekordy w tabeli `tasks` oraz `motivational_messages`.

## 2. Szczegóły żądania
- Metoda: DELETE
- URL: `/api/spaces/{spaceId}`
- Nagłówki: `Authorization: Bearer <token>`
- Parametry URL:
  - `spaceId` (UUID, required) - identyfikator przestrzeni do usunięcia
- Query parameters: brak
- Request Body: brak

**Przykład URL:**
```
DELETE /api/spaces/550e8400-e29b-41d4-a716-446655440000
```

### Walidacja parametrów URL (Zod Schema)

```typescript
const deleteSpaceParamsSchema = z.object({
  spaceId: z.string()
    .uuid("Invalid space ID format")
});
```

---

## 3. Wykorzystywane typy
Brak - endpoint nie zwraca danych (204 No Content) i nie przyjmuje body

---

## 4. Szczegóły odpowiedzi
- 204 No Content: przestrzeń została pomyślnie usunięta (brak treści odpowiedzi)
- 400 Bad Request: nieprawidłowy format UUID
- 401 Unauthorized: brak lub nieprawidłowy token
- 404 Not Found: przestrzeń nie istnieje lub nie należy do użytkownika
- 500 Internal Server Error: błąd serwera

**Przykład 204:**
```
HTTP/1.1 204 No Content
```

**Przykład 400:**
```json
{
  "error": {
    "code": "invalid_uuid",
    "message": "Invalid space ID format"
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
2. W handlerze DELETE:
   - Parsowanie i walidacja `spaceId` przez Zod
   - Wywołanie serwisu `deleteSpace({ supabase, spaceId, userId })`
   - Serwis weryfikuje ownership i wykonuje DELETE (CASCADE automatycznie usuwa tasks)
3. Handler zwraca status 204 bez treści

---

## 6. Względy bezpieczeństwa
- Autoryzacja: JWT token + RLS na `spaces` (filtrowanie po `user_id`)
- Walidacja Zod wymusza poprawny format UUID
- Zwracamy 404 (nie 403) gdy przestrzeń nie należy do użytkownika - nie ujawniamy istnienia zasobu
- `user_id` jest zawsze pobierane z tokena JWT, nigdy z requestu klienta
- CASCADE DELETE: PostgreSQL automatycznie usuwa powiązane rekordy (tasks → motivational_messages)
- Operacja jest nieodwracalna - UI powinien wymuszać potwierdzenie przed wywołaniem

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
- DELETE by PRIMARY KEY - bardzo szybkie dzięki indeksowi na `id` (UUID)
- CASCADE DELETE na poziomie bazy danych - PostgreSQL automatycznie usuwa powiązane rekordy
- Wydajność CASCADE zależy od liczby powiązanych zadań i wiadomości motywacyjnych
- RLS overhead minimalne - proste sprawdzenie `auth.uid() = user_id`
- Dla przestrzeni z dużą liczbą zadań (>1000) operacja może trwać dłużej (ale to rzadki przypadek w MVP)
- Brak transakcji explicit - PostgreSQL traktuje DELETE jako atomową operację

---

## 9. Kroki implementacji
1. Dodać `deleteSpaceParamsSchema` w `src/pages/api/spaces/[spaceId].ts`
2. Wprowadzić metodę `deleteSpace` w `src/lib/services/spacesService.ts`
3. Wykorzystać istniejący `SpaceNotFoundError` (powinien już istnieć po implementacji GET)
4. Zaimplementować handler DELETE w `src/pages/api/spaces/[spaceId].ts` wg wzorca z innych endpointów

