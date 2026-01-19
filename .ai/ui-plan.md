# Architektura UI dla Housework Master

## 1. Przegląd struktury UI

Aplikacja składa się z głównego TopNavigation (desktop) i hamburger (mobile), a główne obszary funkcjonalne to Dashboard i Przestrzenie. Interaktywne komponenty (TaskCard, SpaceCard, modalne formularze) są budowane w React z wykorzystaniem Shadcn/ui. Architektura opiera się na podejściu z responsywnym layoutem kontrolowanym przez Tailwind breakpoints.

## 2. Lista widoków

### Dashboard
- Ścieżka: `/dashboard`
- Główny cel: Wyświetlenie zadań przeterminowanych, dzisiejszych i zbliżających się dla szybkiego przeglądu priorytetów.
- Kluczowe informacje: nazwa zadania, przestrzeń, badge z liczbą dni, komunikat motywacyjny.
- Kluczowe komponenty: `TopNavigation`, `TaskList` (infinite scroll), `TaskCard`, `ToastProvider`.
- Sekcje na dashboardzie:
  - **Zaległe** (overdue) - zadania przeterminowane, wyróżnione kolorem czerwonym (destructive)
  - **Dzisiaj** (today) - zadania z terminem na dzisiejszy dzień, wyróżnione kolorem niebieskim (blue/info)
  - **Nadchodzące** (upcoming) - zadania z terminem w ciągu najbliższych 7 dni (od jutra)
- UX, dostępność, bezpieczeństwo: sekcje oddzielone wizualnie z charakterystycznymi kolorami, odpowiedni kontrast kolorów, ARIA labels dla kart i akcji, keyboard navigation.

### Przestrzenie
- Ścieżka: `/spaces`
- Główny cel: Przegląd i zarządzanie przestrzeniami użytkownika.
- Kluczowe informacje: ikona emoji, nazwa przestrzeni, CTA "Dodaj nową przestrzeń".
- Kluczowe komponenty: `SpaceGrid`, `SpaceCard`, `CreateSpaceModal`, `ConfirmDialog`, `TopNavigation`.
- UX, dostępność, bezpieczeństwo: responsywny grid, focus management w modalu, walidacja formularza, ARIA.

### Szczegóły przestrzeni
W widoku przestrzeni zadania są grupowane w sekcje z nagłówkami według cykliczności:
- Nagłówek sekcji: jednostka czasu (np. "Codziennie", "Co 3 dni", "Co miesiąc").
- Wewnątrz sekcji: karty z poszczególnymi zadaniami.
- Pozwala to szybciej zorientować się w planie pracy dla danej przestrzeni.
- Kluczowe informacje: nagłówek (nazwa, ikona, opcja usunięcia), lista zadań pogrupowana według cykliczności (recurrence_unit i wartości), przycisk "Dodaj zadanie".
- Grupowanie zadań: zadania są wyświetlane pogrupowane według cykliczności (np. 1 dzień, 2 dni, 7 dni, 1 miesiąc), sortowane najpierw po jednostce (dni, miesiące), a następnie po wartości rosnąco.
- Kluczowe komponenty: `TaskList`, `TaskCard`, `CreateTaskModal`, `EditTaskRecurrenceModal`, `ConfirmDialog`.
- UX, dostępność, bezpieczeństwo: modalne formy, tooltipy dla disabled, potwierdzenie kaskadowego usunięcia.

### Formularz tworzenia przestrzeni (modal)
- Typ: multi-step modal/slide-in
- Step 1 (CreateSpaceStep): konfiguracja przestrzeni (nazwa, typ przestrzeni select, grid emoji)
- Step 2 (AddTasksFromTemplatesStep): opcjonalne dodanie zadań z szablonów lub pominięcie (checkboxy + inline edycja cykliczności dla każdego zadania)
- API: `POST /api/spaces` (tworzenie) i `POST /api/spaces/{spaceId}/tasks/bulk-from-templates` (bulk add, opcjonalne)
- Komponenty: `CreateSpaceModal` z dwoma krokami, `CreateSpaceStep`, `AddTasksFromTemplatesStep`, `SpaceTypeSelect`, `EmojiGrid`, `RecurrenceInputs`, walidacja inline, obsługa 207 Multi-Status.

### Formularz tworzenia własnego zadania (modal)
- Typ: modal/slide-in
- Pola: nazwa zadania, recurrence value + unit (przestrzeń jest zawsze znana z kontekstu widoku szczegółów przestrzeni).
- API: `POST /api/tasks`
- Komponenty: `CreateTaskModal`, `RecurrenceInputs` walidacja z Zod.

### Formularz edycji cykliczności zadania (modal)
- Typ: modal/slide-in
- Pola: recurrence value + unit
- API: `PATCH /api/tasks/{taskId}`
- Komponenty: `EditTaskRecurrenceModal`, `RecurrenceInputs`, walidacja z Zod.

### Onboarding (empty state)
- Ścieżka: `/dashboard` (brak przestrzeni)
- Cel: Zachęcenie do utworzenia pierwszej przestrzeni.
- Elementy: centralny CTA, krótki tekst wyjaśniający.
- Komponenty: `EmptyStateCard`, `CreateSpaceModal`.

### Authentication (dostęp)
- Ścieżki: `/login`, `/register`
- Cel: Rejestracja i logowanie (Supabase Auth UI lub custom).
- Komponenty: `AuthForm`, `AuthContext`, route guards.

### Globalne modale i toasty
- `ConfirmDialog` (AlertDialog) - potwierdzenie usuwania przestrzeni, zadań, akcji
- `ToastProvider` + `useToast` - notyfikacje o sukcesach i błędach
- `GlobalLoadingIndicator` - wskaźnik ładowania przy fetchach

## 3. Mapa podróży użytkownika

1. Użytkownik bez konta → `/register` → po rejestracji przekierowanie do pustego dashboardu → onboarding CTA.
2. Kliknięcie "Utwórz pierwszą przestrzeń" → `CreateSpaceModal` Step 1 (`CreateSpaceStep`): konfiguracja przestrzeni → Step 2 (`AddTasksFromTemplatesStep`): wybór zadań z szablonu lub pominięcie.
3. Po zakończeniu modal: tworzenie przestrzeni → (opcjonalnie bulk-add wykonywane wewnątrz modal) → przekierowanie do szczegółów nowo utworzonej przestrzeni.
4. W szczegółach przestrzeni: przegląd zadań pogrupowanych według cykliczności, przycisk "Dodaj zadanie" (tylko ręczne tworzenie z tego poziomu).
5. W szczegółach przestrzeni: każde zadanie ma opcje → akcja ✓ (ukończenie), "Zrobię to jutro" (odroczenie), edycja cykliczności, usunięcie → optymistic update → toast.
6. Dashboard: przegląd zadań z wszystkich przestrzeni → akcje ✓ lub "Zrobię to jutro" → optymistic update → toast. W dashboardzie brak edycji cykliczności.
7. Zarządzanie przestrzeniami → `/spaces` → `SpaceCard` → edycja (nazwa/ikona) / usunięcie (`ConfirmDialog`).

## 4. Układ i struktura nawigacji

- Desktop: `header` z logo (lewo), linki (Dashboard, Przestrzenie), ikona użytkownika/menu ustawień (prawo).
- Mobile: `hamburger` otwierający `Drawer` z linkami i profilem.
- Route guards zabezpieczają dostęp do `/dashboard` i `/spaces`.

## 5. Kluczowe komponenty

### Nawigacja
- `TopNavigation` - nawigacja desktopowa z logo, linkami i menu użytkownika
- `MobileDrawer` - wysuwane menu mobilne z linkami i profilem

### Zadania
- `TaskList` - lista zadań z infinite scroll i skeleton loader
- `TaskCard` - karta pojedynczego zadania z akcjami (ukończ, odrocz, edytuj cykliczność, usuń)
- `CreateTaskModal` - modal do tworzenia nowego zadania (tylko w widoku szczegółów przestrzeni)
- `EditTaskRecurrenceModal` - modal do edycji cykliczności zadania

### Przestrzenie
- `SpaceGrid` - siatka kart przestrzeni
- `SpaceCard` - karta pojedynczej przestrzeni z akcjami (edytuj, usuń)
- `CreateSpaceModal` - modal wielokrokowy do tworzenia przestrzeni
  - `CreateSpaceStep` - Step 1: konfiguracja przestrzeni
  - `AddTasksFromTemplatesStep` - Step 2: opcjonalne dodawanie zadań z szablonów
- `SpaceTypeSelect` - select typu przestrzeni
- `EmojiGrid` - siatka emoji do wyboru ikony

### Wspólne komponenty
- `RecurrenceInputs` - pola do edycji cykliczności (value + unit)
- `ConfirmDialog` - dialog potwierdzenia akcji (usuwanie przestrzeni, zadań)
- `EmptyStateCard` - stan pusty (onboarding, brak zadań)
- `ToastProvider` / `useToast` - system notyfikacji
- `GlobalLoadingIndicator` - globalny wskaźnik ładowania

### Autentykacja
- `AuthForm` - formularz logowania/rejestracji
- `AuthContext` - kontekst autentykacji
- `RouteGuard` - ochrona tras wymagających uwierzytelnienia
