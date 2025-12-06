# Plan implementacji widoku Dashboardu (Zadania)

## 1. Przegląd
Widok Dashboardu jest głównym punktem wejścia dla zalogowanego użytkownika. Jego celem jest prezentacja najpilniejszych zadań z podziałem na "Zaległe" (Overdue) i "Nadchodzące" (Upcoming). Widok obsługuje również stan "Onboarding" dla nowych użytkowników (brak przestrzeni).

## 2. Routing widoku
- **Ścieżka:** `/` (strona główna po zalogowaniu) lub `/dashboard`.
- **Plik Astro:** `src/pages/index.astro` (zabezpieczony middlewarem sesji).

## 3. Struktura komponentów

```text
src/pages/index.astro (Layout: AppLayout)
└── DashboardContainer (React, client:load)
    ├── DashboardHeader (Powitanie, Data)
    ├── OnboardingState (Widoczny, gdy brak przestrzeni)
    │   └── CreateSpaceButton (Przekierowuje na /spaces i otwiera CreateSpaceModal)
    ├── DashboardContent (Widoczny, gdy są przestrzenie)
    │   ├── OverdueSection (Sekcja przeterminowanych)
    │   │   ├── SectionHeader (Tytuł, Licznik)
    │   │   ├── TaskList (Lista zadań)
    │   │   │   └── TaskCard (Karta zadania - reusing)
    │   │   └── LoadMoreButton (Paginacja)
    │   ├── UpcomingSection (Sekcja nadchodzących)
    │   │   ├── SectionHeader
    │   │   ├── TaskList
    │   │   │   └── TaskCard
    │   │   └── LoadMoreButton (Karta zadania - reusing)
    │   └── EmptyTasksState (Gdy przestrzenie są, ale brak zadań - "Wszystko zrobione")
```

## 4. Szczegóły komponentów

### `DashboardContainer`
- **Opis:** Główny kontener logiki. Koordynuje pobieranie danych o przestrzeniach (aby wykryć stan onboardingu) oraz zadań (dla sekcji).
- **Główne elementy:** Wrapper layoutu, warunkowe renderowanie (`OnboardingState` vs `DashboardContent`).
- **Obsługiwane interakcje:** Inicjalizacja pobierania danych.
- **Typy:** Brak propsów (top-level).

### `OnboardingState`
- **Opis:** Ekran dla użytkownika bez zdefiniowanych przestrzeni.
- **Główne elementy:** Ilustracja/Ikona, Tekst powitalny, Przycisk "Stwórz swoją pierwszą przestrzeń".
- **Obsługiwane interakcje:** Kliknięcie przycisku (przekierowanie do `/spaces` i otwarcie modala).

### `DashboardContent`
- **Opis:** Wyświetla właściwą zawartość dashboardu podzieloną na sekcje.
- **Główne elementy:** `OverdueSection`, `UpcomingSection`.
- **Warunki:** Renderuje się tylko, gdy użytkownik posiada przynajmniej jedną przestrzeń.

### `TasksSection` (Reużywalny dla Overdue/Upcoming)
- **Opis:** Generyczna sekcja wyświetlająca listę zadań.
- **Props:**
  - `title`: string (np. "Zaległe", "Nadchodzące")
  - `tasks`: TaskDto[]
  - `isLoading`: boolean
  - `onLoadMore`: () => void
  - `hasMore`: boolean
- **Główne elementy:** Nagłówek sekcji, Grid/Lista kart `TaskCard`, przycisk "Pokaż więcej".

### `TaskCard` (Rozbudowany)
- **Opis:** Karta zadania (zgodna z poprzednimi planami implementacji Complete/Postpone).
- **Props:** `task: TaskDto`.
- **Elementy:** Nazwa, Ikona przestrzeni, Nazwa przestrzeni, Badge terminu (czerwony dla overdue, szary dla upcoming).

## 5. Typy

Wykorzystanie typów z `src/types.ts`.

### Nowe definicje (lokalne lub w types.ts)

```typescript
// Parametry dla hooka dashboardu
interface UseDashboardTasksOptions {
  section: 'overdue' | 'upcoming';
  daysAhead?: number; // domyślnie 7
  limit?: number; // domyślnie 20
}

// Struktura danych zwracana przez hooka
interface DashboardTasksResult {
  tasks: TaskDto[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
}
```

## 6. Zarządzanie stanem

Stan zarządzany głównie przez **React Query** (TanStack Query).

### Hook: `useDashboardTasks(section)`
Będzie to wrapper na `useInfiniteQuery` (dla obsługi "Load More") lub `useQuery` z paginacją. Ze względu na specyfikę dashboardu (dwa niezależne listy), rekomendowane jest użycie dwóch niezależnych zapytań.

1.  **Query Key:** `['dashboard', 'tasks', 'overdue']`
2.  **Query Key:** `['dashboard', 'tasks', 'upcoming']`

### Hook: `useMySpaces`
Potrzebny do sprawdzenia, czy użytkownik ma jakiekolwiek przestrzenie (logika Onboardingu).
- **Query Key:** `['spaces', 'list']`

## 7. Integracja API

### Endpoint: `GET /api/dashboard/tasks`

1.  **Pobranie zaległych:**
    - **Query:** `?section=overdue&sort=due_date.asc&page=1&limit=20`
    - **Cel:** Pokaż zadania, które są "najbardziej" przeterminowane (najstarsza data) na górze.

2.  **Pobranie nadchodzących:**
    - **Query:** `?section=upcoming&days_ahead=7&sort=due_date.asc&page=1&limit=20`
    - **Cel:** Pokaż zadania na najbliższe 7 dni, posortowane od tych na "już".

### Endpoint: `GET /api/spaces` (lub dedykowany check)
- Służy do weryfikacji stanu "First Run". Jeśli lista przestrzeni jest pusta -> pokaż `OnboardingState`.

## 8. Interakcje użytkownika

1.  **Pierwsze wejście (Pusty stan):** Użytkownik widzi zachętę do utworzenia przestrzeni.
2.  **Codzienne użytkowanie:**
    - Użytkownik widzi sekcję "Zaległe" (jeśli istnieją).
    - Użytkownik widzi sekcję "Nadchodzące".
    - Użytkownik klika "Complete" na karcie (zadanie 'znika' z listy - obsługa przez `useCompleteTask`).
    - Użytkownik klika "Postpone" (zadanie przesuwa się na liście lub znika, jeśli data wykracza poza zakres - obsługa przez `usePostponeTask`).
3.  **Ładowanie więcej:** Użytkownik klika "Pokaż więcej" pod listą, aby doładować kolejne strony (infinite query).

## 9. Warunki i walidacja

- **Onboarding:** Wyświetlany TYLKO gdy `spaces.length === 0`.
- **Empty Inbox:** Wyświetlany gdy `spaces.length > 0` ORAZ `overdueTasks.length === 0` ORAZ `upcomingTasks.length === 0`.
- **Overdue Section:** Ukryta, jeśli brak zadań przeterminowanych.

## 10. Obsługa błędów

- **Błąd ładowania API:** Wyświetlenie komunikatu "Nie udało się załadować zadań" z przyciskiem "Spróbuj ponownie" w miejscu danej sekcji.
- **Skeleton Loading:** Podczas ładowania danych, zamiast pustej przestrzeni, wyświetlane są szkielety kart (Skeleton UI).

## 11. Kroki implementacji

1.  **API Service:**
    - Upewnić się, że `tasksService.getDashboardTasks` jest zaimplementowane i obsługuje parametry `section` oraz `days_ahead`.
2.  **Custom Hooki:**
    - Stworzyć `useDashboardTasks` wykorzystujący `useInfiniteQuery` dla obsługi paginacji "Load More".
3.  **Komponenty UI:**
    - Stworzyć `SectionHeader` i `TasksSection`.
    - Stworzyć `OnboardingState` (z ikoną).
    - Stworzyć `EmptyTasksState` (motywujący komunikat, np. "Wszystko zrobione na dziś!").
4.  **Kontener Dashboardu:**
    - Złożyć logikę w `DashboardContainer`.
    - Dodać logikę pobierania przestrzeni (`useSpaces`).
    - Zaimplementować warunkowe renderowanie sekcji.
5.  **Integracja z Page:**
    - Dodać `DashboardContainer` do `src/pages/index.astro`.
6.  **Weryfikacja:**
    - Sprawdzić sortowanie (czy przeterminowane są od najstarszych, a nadchodzące od najbliższych).
    - Sprawdzić zachowanie po oznaczeniu zadania jako wykonane (powinno zniknąć/odświeżyć listę).

