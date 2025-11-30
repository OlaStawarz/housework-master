# Plan implementacji widoku szczegółów przestrzeni

## 1. Przegląd
Widok dostępny pod adresem `/spaces/[spaceId]`, prezentujący listę zadań przypisanych do konkretnej przestrzeni. Kluczową cechą tego widoku jest grupowanie zadań według ich cykliczności (np. "Codziennie", "Co tydzień"), co pozwala użytkownikowi na szybką ocenę obciążenia pracą w danej strefie domu. Widok umożliwia również zarządzanie zadaniami (dodawanie, oznaczanie jako wykonane, odkładanie) oraz zarządzanie samą przestrzenią (usuwanie).

## 2. Routing widoku
- **Ścieżka:** `/spaces/[spaceId]`
- **Plik Astro:** `src/pages/spaces/[spaceId].astro`
- **Zabezpieczenie:** Middleware (wymagana sesja).

## 3. Struktura komponentów

```text
src/pages/spaces/[spaceId].astro (Layout: AppLayout)
└── SpaceDetailsContainer (React, client:load)
    ├── SpaceHeader (Ikona, Nazwa, Menu akcji przestrzeni)
    ├── TaskGroupingList (Lista grup zadań)
    │   ├── RecurrenceGroup (Sekcja np. "Codziennie")
    │   │   └── TaskCard (Pojedyncze zadanie)
    │   │       └── TaskActions (Menu/Przyciski: Complete, Postpone, Edit, Delete)
    │   └── LoadingSkeleton
    ├── EmptySpaceState (Gdy brak zadań)
    ├── CreateTaskButton (Floating Action Button lub w nagłówku)
    └── Modals (CreateTaskModal, EditTaskRecurrenceModal, ConfirmDialog)
```

## 4. Szczegóły komponentów

### `SpaceDetailsContainer`
- **Opis:** Główny kontener logiki. Pobiera szczegóły przestrzeni oraz listę zadań.
- **Odpowiedzialność:**
  - Pobranie danych przestrzeni (`GET /api/spaces/[id]`).
  - Pobranie zadań z API z sortowaniem po cykliczności (`GET /api/tasks?space_id=...&sort=recurrence.asc`).
  - Przetworzenie płaskiej listy zadań na strukturę pogrupowaną.
  - Zarządzanie stanem modali (dodawanie/edycja zadań, usuwanie przestrzeni).
  - Obsługa akcji na zadaniach (wykonanie, odłożenie, usunięcie).
- **Props:**
  - `spaceId`: string (przekazany z parametru URL Astro).

### `SpaceHeader`
- **Opis:** Nagłówek widoku z informacjami o przestrzeni.
- **Elementy:** Ikona (duża), Nazwa przestrzeni, Przycisk Usuń przestrzeń.
- **Props:**
  - `space: SpaceDto`
  - `onDeleteSpace: () => void`

### `TaskGroupingList`
- **Opis:** Komponent renderujący listę zadań podzieloną na sekcje.
- **Props:** `groupedTasks: Record<string, TaskDto[]>`.
- **Logika:** Iteruje po kluczach grup i renderuje komponenty `RecurrenceGroup`.

### `RecurrenceGroup`
- **Opis:** Sekcja wizualna dla danej cykliczności.
- **Props:** `title: string`, `tasks: TaskDto[]`.
- **Wygląd:** Nagłówek (np. "Co 3 dni") + Grid/Lista `TaskCard`.

### `TaskCard`
- **Opis:** Karta pojedynczego zadania (podobnie jak w Dashboard, ale w kontekście listy).
- **Props:** `task: TaskDto`, handlery (`onComplete`, `onPostpone`, `onDelete`, `onEditRecurrence`).
- **Elementy:** Nazwa zadania, Termin (badge: overdue/upcoming), Checkbox "Complete", Przycisk "Zrobię to jutro", Menu kontekstowe (Edytuj, Usuń).

## 5. Typy

### ViewModel: `GroupedTasks`
Struktura danych używana do renderowania widoku:
```typescript
interface TaskGroup {
  title: string; // np. "Codziennie", "Co 2 tygodnie"
  recurrenceKey: string; // np. "days-1", "months-1" - do sortowania
  tasks: TaskDto[];
}
// Tablica grup, aby zachować kolejność sortowania
type GroupedTasksList = TaskGroup[];
```

### DTO
Użycie istniejących `TaskDto` i `SpaceDto` z `src/types.ts`.

## 6. Zarządzanie stanem

Kontener `SpaceDetailsContainer` zarządza:
1.  `space`: dane przestrzeni (cache/state).
2.  `tasks`: płaska lista zadań z API (cache/state).
3.  `groupedTasks`: stan pochodny (useMemo), transformacja `tasks` na `GroupedTasksList`.
4.  `modals`: stan otwarcia dla `CreateTask`, `EditTask`, `ConfirmDeleteSpace`, `ConfirmDeleteTask`.

Hooki:
- `useTasks({ spaceId, sort: 'recurrence.asc' })` - wrapper na React Query / fetch.
- `useSpace(spaceId)` - pobranie szczegółów przestrzeni.
- `useTaskMutations` - custom hook zawierający logikę `completeTask`, `postponeTask`, `deleteTask`.
- `useSpaceMutations` - custom hook zawierający logikę `updateSpace`.

## 7. Integracja API

### Pobranie zadań
- **Endpoint:** `GET /api/tasks`
- **Query Params:**
  - `space_id`: UUID przestrzeni.
  - `sort`: `recurrence.asc` (Kluczowe dla poprawnego grupowania - API sortuje najpierw po jednostce, potem wartości).
  - `limit`: np. 100 (aby pobrać większość zadań do grupowania).
- **Response:** `TaskListDto`.

### Pobranie szczegółów przestrzeni
- **Endpoint:** `GET /api/spaces/[id]`
- **Response:** `SpaceDto`.

### Operacje na zadaniach
- `POST /api/tasks/[id]/complete`
- `POST /api/tasks/[id]/postpone`
- `DELETE /api/tasks/[id]`
- `PATCH /api/tasks/[id]` (edycja cykliczności)

### Operacje na przestrzeni
- `DELETE /api/spaces/[id]` (usuwanie - kaskadowe usunięcie zadań)

## 8. Interakcje użytkownika

1.  **Wejście do przestrzeni:** Ładowanie danych, wyświetlenie nagłówka i pustych grup (skeleton).
2.  **Przeglądanie:** Lista podzielona na sekcje.
3.  **Ukończenie/Odkładanie zadania:** Interakcja z kartą (checkbox/przycisk).
4.  **Zarządzanie zadaniem:** Menu karty -> Edytuj/Usuń.
5.  **Dodawanie zadania:** Przycisk "Dodaj zadanie" otwiera modal.
6.  **Usuwanie przestrzeni:** Menu w nagłówku -> "Usuń przestrzeń" -> Dialog ostrzegawczy -> Potwierdzenie -> API DELETE -> Przekierowanie do `/spaces` z toastem.

## 9. Warunki i walidacja

- **Grupowanie:** Frontend musi przetłumaczyć pary `recurrence_value` + `recurrence_unit` na czytelne nagłówki (i18n/formatter).
  - `1 days` -> "Codziennie"
  - `7 days` -> "Co tydzień"
  - `1 months` -> "Co miesiąc"
  - `X days` -> "Co X dni"
- **Brak zadań:** Wyświetlenie komponentu `EmptySpaceState` z zachętą do dodania zadań.
- **Usuwanie przestrzeni:** Wymaga potwierdzenia (nieodwracalne usunięcie zadań).

## 10. Obsługa błędów

- **Błąd 404 (Przestrzeń nie istnieje):** Przekierowanie do listy przestrzeni lub wyświetlenie komunikatu "Przestrzeń nie znaleziona".
- **Błąd ładowania zadań:** Retry button w miejscu listy.
- **Błąd operacji (np. Complete):** Toast z błędem, rollback optymistycznej zmiany (jeśli stosowana).

## 11. Kroki implementacji

1.  **Strona Astro:** Utworzenie pliku `src/pages/spaces/[spaceId].astro`, pobranie `spaceId` z parametrów.
2.  **Serwisy API:** Upewnienie się, że `tasksService` obsługuje parametr `sort='recurrence.asc'`.
3.  **Kontener:** Implementacja `SpaceDetailsContainer` z pobieraniem danych (`useQuery`).
4.  **Logika grupowania:** Implementacja funkcji pomocniczej `groupTasksByRecurrence(tasks: TaskDto[]): GroupedTasksList`.
5.  **Komponenty UI:**
    - `SpaceHeader` (bazowy layout).
    - `RecurrenceGroup` i lista.
    - Dostosowanie `TaskCard` do widoku listy (ew. użycie istniejącego, jeśli pasuje).
6.  **Modale:** Podpięcie (placeholderów lub gotowych komponentów) do tworzenia i edycji zadań.
7.  **Testy manualne:** Weryfikacja poprawności grupowania i sortowania.

