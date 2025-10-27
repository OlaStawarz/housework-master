# API Endpoint Implementation Plan: POST /api/spaces

## 1. Przegląd punktu końcowego
Tworzy nową przestrzeń (`spaces`) przypisaną do zalogowanego użytkownika, egzekwując unikalność nazwy w ramach użytkownika oraz walidując opcjonalny `space_type`.

## 2. Szczegóły żądania
- Metoda: POST
- URL: `/api/spaces`
- Nagłówki: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body JSON:
  - `name` (string, required, 1–100 znaków)
  - `space_type` (string|null, optional, musi istnieć w `space_types.code`)
  - `icon` (string|null, optional, max 50 znaków)


**Przykład 1 - minimalne dane**:
```json
{
  "name": "Kuchnia na dole"
}
```

**Przykład 2 - pełne dane**:
```json
{
  "name": "Łazienka główna",
  "space_type": "bathroom",
  "icon": "🚿"
}
```

**Przykład 3 - niestandardowa przestrzeń**:
```json
{
  "name": "Garaż",
  "space_type": null,
  "icon": "🚗"
}
```

### Walidacja Request Body (Zod Schema)

```typescript
const postSpaceBodySchema = z.object({
  name: z.string()
    .min(1, "Name is required and cannot be empty")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  space_type: z.string()
    .max(50, "Space type code must be at most 50 characters")
    .optional()
    .nullable(),
  icon: z.string()
    .max(50, "Icon must be at most 50 characters")
    .optional()
    .nullable()
});
```

---

## 3. Wykorzystywane typy
- `CreateSpaceCommand` (`src/types.ts`)
- `CreateSpaceParams` (`src/lib/services/spacesService.ts`): { userId: string; command: CreateSpaceCommand }
- `SpaceDto` (`src/types.ts`)

## 4. Szczegóły odpowiedzi
- 201 Created: zwraca obiekt `SpaceDto`
- 400 Bad Request: nieprawidłowe dane (Zod errors lub invalid `space_type`)
- 401 Unauthorized: brak lub nieprawidłowy token
- 409 Conflict: duplikat nazwy przestrzeni
- 500 Internal Server Error: błąd serwera

**Przykład 201:**
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

## 5. Przepływ danych
1. Middleware weryfikuje JWT i ustawia `locals.user.id` oraz `locals.supabase`.
2. Handler POST:
   - Parsuje i waliduje body (Zod).
   - Wywołuje `createSpace(supabase, { userId, command })`.
   - Zwraca odpowiedni status i JSON.
3. Service Layer
   - Jeśli `space_type` jest podany to wykonuje zapytanie do tabeli `space_types` - jeśli typ  nie istnieje rzuca odpowiednim komunikatem

## 6. Względy bezpieczeństwa
- Autoryzacja: Supabase Auth JWT oraz RLS na `spaces`.
- `user_id` jest zawsze pobierane z tokena JWT na serwerze — klient nie przekazuje go w body.
- Walidacja Zod wymusza limity i format pól.

## 7. Obsługa błędów
| Źródło błędu                   | Warunek                            | Status | Kod błędu             | Komunikat                                                   |
|-------------------------------|------------------------------------|--------|-----------------------|-------------------------------------------------------------|
| Zod validation                | Nieprawidłowy lub brak `name`      | 400    | `validation_error`    | Szczegóły walidacji                                          |
| SpaceTypeNotFoundError        | `space_type` nie istnieje         | 400    | `invalid_space_type`  | "Space type '{type}' does not exist"                      |
| Middleware/Auth               | Brak/nieprawidłowy token           | 401    | `unauthorized`        | "Authentication required"                                 |
| DuplicateSpaceNameError       | Duplikat nazwy (UNIQUE violation)  | 409    | `duplicate_name`      | "A space with name '{name}' already exists"               |
| Inne wyjątki                  | Błąd serwera lub DB                | 500    | `internal_error`      | "Internal server error"                                   |

## 8. Rozważania dotyczące wydajności
1. **Walidacja space_type**:
   - Każde utworzenie przestrzeni z `space_type` wymaga dodatkowego SELECT do tabeli `space_types`
   - Tabela `space_types` jest mała (< 20 rekordów) i rzadko modyfikowana

2. **UNIQUE constraint check**:
   - PostgreSQL sprawdza unikalność (user_id, name) przy każdym INSERT
   - Wymaga dostępu do indeksu

3. **RLS policy evaluation**:
   - PostgreSQL sprawdza politykę RLS przy każdym INSERT
   - Wymaga wywołania auth.uid() i porównania z user_id

## 9. Kroki implementacji
1. Dodać `postSpaceBodySchema` w `src/pages/api/spaces.ts`.
2. Wprowadzić `createSpace` w `src/lib/services/spacesService.ts`.
3. Zaimplementować handler POST wg wzorca GET.

