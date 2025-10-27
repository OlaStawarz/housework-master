# API Endpoint Implementation Plan: PATCH /api/spaces/{spaceId}

## 1. Przegląd punktu końcowego
Aktualizuje istniejącą przestrzeń (`spaces`) należącą do zalogowanego użytkownika. Endpoint umożliwia częściową aktualizację (partial update) pól: `name` lub `icon`, egzekwując unikalność nazwy w ramach użytkownika. Pole `space_type` jest niezmienne (immutable) po utworzeniu, ponieważ służy wyłącznie do początkowego doboru szablonów zadań.

## 2. Szczegóły żądania
- Metoda: PATCH
- URL: `/api/spaces/{spaceId}`
- Nagłówki: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Parametry URL:
  - `spaceId` (UUID, required) - identyfikator przestrzeni do aktualizacji
- Body JSON (przynajmniej jedno pole wymagane):
  - `name` (string, optional, 1–100 znaków)
  - `icon` (string|null, optional, max 50 znaków)

**Przykład 1 - aktualizacja nazwy**:
```json
{
  "name": "Kuchnia na górze"
}
```

**Przykład 2 - aktualizacja ikony**:
```json
{
  "icon": "🍳"
}
```

**Przykład 3 - aktualizacja obu pól**:
```json
{
  "name": "Łazienka główna",
  "icon": "🚿"
}
```

### Walidacja parametrów URL i Request Body (Zod Schema)

```typescript
const patchSpaceParamsSchema = z.object({
  spaceId: z.string()
    .uuid("Invalid space ID format")
});

const patchSpaceBodySchema = z.object({
  name: z.string()
    .min(1, "Name cannot be empty")
    .max(100, "Name must be at most 100 characters")
    .trim()
    .optional(),
  icon: z.string()
    .max(50, "Icon must be at most 50 characters")
    .optional()
    .nullable()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);
```

---

## 3. Wykorzystywane typy
- `UpdateSpaceCommand` (`src/types.ts`) - partial update command
- `SpaceDto` (`src/types.ts`) - zaktualizowana przestrzeń w odpowiedzi

---

## 4. Szczegóły odpowiedzi
- 200 OK: zwraca zaktualizowany obiekt `SpaceDto`
- 400 Bad Request: nieprawidłowe dane (Zod errors, puste body)
- 401 Unauthorized: brak lub nieprawidłowy token
- 404 Not Found: przestrzeń nie istnieje lub nie należy do użytkownika
- 409 Conflict: duplikat nazwy przestrzeni (nowa nazwa już istnieje)
- 500 Internal Server Error: błąd serwera

**Przykład 200:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Kuchnia na górze",
  "space_type": "kitchen",
  "icon": "🍳",
  "created_at": "2025-10-26T10:30:00Z",
  "updated_at": "2025-10-26T14:45:00Z"
}
```

**Przykład 400:**
```json
{
  "error": {
    "code": "validation_error",
    "message": "At least one field must be provided"
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

**Przykład 409:**
```json
{
  "error": {
    "code": "duplicate_name",
    "message": "A space with name 'Kuchnia' already exists"
  }
}
```

---

## 5. Przepływ danych
1. Middleware weryfikuje token i ustawia `locals.user.id` oraz `locals.supabase`
2. W handlerze PATCH:
   - Parsowanie i walidacja `spaceId` oraz body przez Zod
   - Wywołanie serwisu `updateSpace({ supabase, spaceId, userId, command })`
   - Serwis sprawdza ownership, wykonuje UPDATE
3. Handler serializuje zaktualizowany `SpaceDto` do JSON i zwraca status 200

---

## 6. Względy bezpieczeństwa
- Autoryzacja: JWT token + RLS na `spaces` (filtrowanie po `user_id`)
- Walidacja Zod wymusza poprawny format UUID i limity pól
- Zwracamy 404 (nie 403) gdy przestrzeń nie należy do użytkownika - nie ujawniamy istnienia zasobu
- `user_id` jest zawsze pobierane z tokena JWT, nigdy z requestu klienta
- `space_type` nie może być aktualizowany - jest immutable po utworzeniu

---

## 7. Obsługa błędów

| Źródło błędu | Warunek | Status | Kod błędu | Komunikat |
|--------------|---------|--------|-----------|-----------|
| Zod validation (params) | Nieprawidłowy format UUID | 400 | `invalid_uuid` | "Invalid space ID format" |
| Zod validation (body) | Puste body lub nieprawidłowe dane | 400 | `validation_error` | Szczegóły walidacji |
| Middleware/Auth | Brak/nieprawidłowy token | 401 | `unauthorized` | "Authentication required" |
| SpaceNotFoundError | Przestrzeń nie istnieje lub nie należy do użytkownika | 404 | `not_found` | "Space not found" |
| DuplicateSpaceNameError | Duplikat nazwy (UNIQUE violation) | 409 | `duplicate_name` | "A space with name '{name}' already exists" |
| Supabase/Network | Błąd połączenia z bazą | 500 | `internal_error` | "Internal server error" |
| Inne wyjątki | Nieoczekiwany błąd | 500 | `internal_error` | "Internal server error" |

---

## 8. Rozważania dotyczące wydajności
- UPDATE by PRIMARY KEY - bardzo szybkie dzięki indeksowi na `id` (UUID)
- UNIQUE constraint check na (`user_id`, `name`) - wymaga dostępu do indeksu tylko przy zmianie nazwy
- RLS overhead minimalne - proste sprawdzenie `auth.uid() = user_id`
- Brak JOIN-ów - endpoint operuje tylko na tabeli `spaces`
- Brak dodatkowych walidacji (space_type nie jest aktualizowany)
- PostgreSQL automatycznie aktualizuje `updated_at` przez trigger

---

## 9. Kroki implementacji
1. Dodać `patchSpaceParamsSchema` i `patchSpaceBodySchema` w `src/pages/api/spaces/[spaceId].ts`
2. Wprowadzić metodę `updateSpace` w `src/lib/services/spacesService.ts`
3. Dodać obsługę błędu `DuplicateSpaceNameError` (jeśli jeszcze nie istnieje)
4. Zaimplementować handler PATCH w `src/pages/api/spaces/[spaceId].ts` wg wzorca z innych endpointów

