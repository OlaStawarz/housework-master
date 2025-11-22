# Plan implementacji widoku listy przestrzeni

## 1. Przegląd
Widok dostępny pod adresem `/spaces` służący do przeglądania przestrzeni użytkownika. Jest to główny punkt nawigacyjny do organizacji przestrzeni. Skupia się na prezentacji danych w formie siatki oraz umożliwia dodanie nowej przestrzeni.

## 2. Routing widoku
- **Ścieżka:** `/spaces`
- **Plik Astro:** `src/pages/spaces/index.astro`
- **Zabezpieczenie:** Wymagana autentykacja (middleware sprawdzający sesję).

## 3. Struktura komponentów
Widok zostanie zbudowany jako strona Astro osadzająca główny komponent Reactowy odpowiedzialny za interaktywność (pobieranie danych).

Drzewo komponentów:
```text
src/pages/spaces/index.astro (Layout: AppLayout)
└── SpacesListContainer (React, client:load)
    ├── PageHeader (Tytuł + Przycisk "Dodaj nową przestrzeń")
    ├── SpaceGrid (Kontener layoutu - CSS Grid)
    │   ├── SpaceCard (Pojedyncza karta przestrzeni - Link)
    │   └── LoadingSkeleton (Stan ładowania)
    ├── EmptyState (Widok dla braku przestrzeni - Onboarding)
    └── PaginationControls (Opcjonalnie, jeśli liczba stron > 1)
```

## 4. Szczegóły komponentów

### `SpacesListContainer`
- **Opis:** Główny komponent zarządzający stanem widoku ("Smart Component").
- **Odpowiedzialność:**
  - Komunikacja z API (`GET /api/spaces`).
  - Zarządzanie stanem ładowania, błędów i danych listy.
- **Główne elementy:** `div` wrapper, warunkowe renderowanie (`Skeleton` vs `Grid` vs `EmptyState`).

### `SpaceCard`
- **Opis:** Komponent prezentacyjny ("Dumb Component") wyświetlający pojedynczą przestrzeń.
- **Props:**
  - `space: SpaceDto`
- **Wygląd:**
  - **Ikona:** Emoji reprezentujące przestrzeń (duży rozmiar, centralnie lub po lewej).
  - **Nazwa:** Nagłówek karty.
- **Interakcje:**
  - Kliknięcie w kartę (cały obszar) przenosi do `/spaces/[id]`.

### `EmptyState`
- **Opis:** Widok wyświetlany, gdy użytkownik nie ma żadnych przestrzeni.
- **Treść:** "Nie masz jeszcze żadnych przestrzeni." + Przycisk CTA "Stwórz pierwszą przestrzeń".

## 5. Typy

Wykorzystanie typów zdefiniowanych w `src/types.ts`.

```typescript
// Importowane z src/types.ts
import type { SpaceDto, SpaceListDto } from '@/types';

// DTO (zgodne z API plan)
// SpaceDto: { id, user_id, name, space_type, icon, created_at, updated_at }

// Interfejsy propsów
interface SpaceCardProps {
  space: SpaceDto;
}
```

## 6. Zarządzanie stanem

Komponent `SpacesListContainer` będzie wykorzystywał React Hooks:

1.  `const [spaces, setSpaces] = useState<SpaceDto[]>([]);`
2.  `const [isLoading, setIsLoading] = useState(true);`

## 7. Integracja API

### Pobieranie przestrzeni
- **Metoda:** `GET`
- **URL:** `/api/spaces`
- **Query Params:**
  - `sort`: `created_at.desc` (domyślnie, aby najnowsze były pierwsze).
- **Response Type:** `SpaceListDto`

## 8. Interakcje użytkownika

1.  **Przeglądanie:** Użytkownik widzi siatkę swoich przestrzeni.
2.  **Nawigacja:** Kliknięcie w kartę przenosi do widoku szczegółów `/spaces/{id}`.
3.  **Tworzenie:** Kliknięcie przycisku "Dodaj nową przestrzeń" w nagłówku (wywołuje modal - implementacja modala poza zakresem tego zadania, tu tylko przycisk).

## 9. Warunki i walidacja

- **Stan pusty (Brak danych):**
  - Jeśli API zwraca pustą listę -> Pokaż `EmptyState` (Onboarding).
- **Ładowanie:** Podczas pobierania danych wyświetlane są `Skeleton`y kart, aby uniknąć skoków layoutu (CLS).

## 10. Obsługa błędów

- **Błąd API (500/400):** Wyświetlenie komunikatu błędu w miejscu gridu ("Nie udało się załadować przestrzeni") z przyciskiem "Spróbuj ponownie".
- **Błąd sieci:** Standardowy toast z informacją o problemie z połączeniem.

## 11. Kroki implementacji

1.  **Setup strony:** Utworzenie pliku `src/pages/spaces/index.astro` i podstawowego layoutu.
2.  **Komponent Karty:** Implementacja `SpaceCard.tsx` z użyciem komponentów Shadcn (`Card`).
    - Karta powinna działać jako link.
3.  **Kontener:** Implementacja `SpacesListContainer.tsx`.
    - Dodanie logiki `fetch` do `/api/spaces`.
    - Obsługa stanu `loading` i renderowanie szkieletów.
4.  **Grid i Responsywność:** Ustawienie CSS Grid (np. `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
5.  **Empty State:** Dodanie warunkowego renderowania dla braku przestrzeni.
6.  **Integracja:** Osadzenie kontenera w stronie Astro.
