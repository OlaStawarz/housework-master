# Plan implementacji Layoutu Aplikacji

## 1. Przegląd
Główny układ aplikacji (`AppLayout`) zapewnia spójną strukturę wizualną i nawigacyjną dla wszystkich widoków po zalogowaniu. Realizuje responsywny interfejs użytkownika, dostosowując nawigację do urządzeń mobilnych (Drawer) i desktopowych (Header). Zawiera również menu użytkownika z opcją wylogowania.

## 2. Routing
- Layout jest używany przez wszystkie strony chronione ("protected routes"): `/`, `/dashboard`, `/spaces/*`.
- Plik: `src/layouts/AppLayout.astro`.

## 3. Struktura komponentów

```text
src/layouts/AppLayout.astro (Astro)
└── NavigationContainer (React, client:load)
    ├── DesktopNavigation (Visible on sm+, >=640px)
    │   ├── Logo
    │   ├── NavLinks (Dashboard, Przestrzenie)
    │   └── UserSection
    │       ├── Greeting (Witaj, [Imię])
    │       └── UserMenu (Avatar, Dropdown)
    ├── MobileNavigation (Visible on <sm, <640px)
    │   ├── MobileHeader (Logo, HamburgerButton)
    │   └── MobileDrawer (Sheet component)
    │       ├── DrawerHeader (Avatar + Greeting)
    │       ├── NavLinks (Vertical)
    │       └── UserActions (Profil, Wyloguj)
    └── MainContent (Slot wrapper)
```

## 4. Szczegóły komponentów

### `AppLayout` (Astro)
- **Opis:** Główny wrapper HTML/Body.
- **Zadania:**
  - Ustawienie meta tagów (tytuł, charset).
  - Załadowanie globalnych styli.
  - Pobranie danych sesji z `Astro.locals` (użytkownik).
  - Renderowanie `NavigationContainer` z przekazaniem danych użytkownika.
  - Renderowanie zawartości strony w `<slot />`.
- **Props:** `title?: string`.

### `NavigationContainer` (React)
- **Opis:** Kontener logiczny nawigacji.
- **Zadania:**
  - Obsługa stanu otwarcia menu mobilnego.
  - Rozpoznawanie aktywnej ścieżki (dla podświetlenia linków).
- **Props:** `user: UserDto`, `currentPath: string`.

### `DesktopNavigation`
- **Opis:** Pasek nawigacyjny dla ekranów sm+ (>=640px).
- **Elementy:**
  - Lewa: Logo aplikacji.
  - Środek/Prawa: Linki nawigacyjne (`Dashboard`, `Przestrzenie`).
  - Prawa: `UserSection` (Powitanie + Menu).

### `MobileNavigation` & `MobileDrawer`
- **Opis:** Pasek dla ekranów <sm (<640px) i wysuwane menu.
- **Elementy:**
  - Header: Logo + Hamburger Icon.
  - Drawer (Sheet):
    - Nagłówek: Avatar użytkownika + "Witaj, {imię}!"
    - Lista linków w układzie pionowym.
    - Akcje użytkownika na dole: Profil (disabled), Wyloguj.
- **Biblioteki:** `shadcn/ui` (Sheet, Button, Avatar).

### `UserSection`
- **Opis:** Komponent grupujący powitanie i menu użytkownika (dla desktop).
- **Elementy:**
  - **Greeting:** Tekst "Witaj, {imię}" (lub email, jeśli brak nazwy).
  - **UserMenu:** Avatar z dropdownem.
- **Style:** Flex row, items center, gap.

### `UserMenu`
- **Opis:** Komponent wyświetlający awatar/inicjały użytkownika i menu akcji (dla desktop).
- **Elementy:**
  - Trigger: Avatar (lub inicjały jeśli brak zdjęcia).
  - Content: DropdownMenu.
    - Item: "Profil" (placeholder, disabled).
    - Item: "Wyloguj" (kolor czerwony/destrukcyjny).
- **Interakcje:** Kliknięcie "Wyloguj" wywołuje funkcję `signOut`.

## 5. Typy

Wykorzystanie typów z `src/types.ts` oraz definicje lokalne w `src/components/navigation/types.ts`.

```typescript
// Props dla komponentów nawigacyjnych
interface NavigationUser {
  email: string;
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
  };
}

interface NavigationProps {
  user: NavigationUser;
  currentPath: string;
}

interface NavLink {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}
```

## 6. Zarządzanie stanem

- **Aktywna ścieżka:** Przekazywana z Astro (`Astro.url.pathname`) do komponentu React jako prop, co eliminuje potrzebę hooków `useLocation` po stronie klienta w tym kontekście (dla SSG/SSR Astro jest to bardziej naturalne).
- **Mobile Menu:** Stan lokalny `useState<boolean>` w `MobileNavigation` lub zarządzany przez prymityw `Sheet` z shadcn/ui.

## 7. Integracja API

### Wylogowanie
- **Endpoint:** `POST /api/auth/signout`
- **Akcja:** Wywołanie `fetch` lub helpera `supabase.auth.signOut()`.
- **Po sukcesie:** `window.location.href = '/signin'`.
- **Status:** Placeholder - do implementacji po dodaniu autoryzacji.

## 8. Interakcje użytkownika

1.  **Nawigacja:** Kliknięcie linku przenosi na inną podstronę (SPA navigation lub standardowa).
2.  **Mobile Menu:** Kliknięcie hamburgera otwiera szufladę. Kliknięcie w tło lub link zamyka ją.
3.  **User Menu:** Click na avatar otwiera dropdown (desktop) lub wyświetla akcje w drawer (mobile).
4.  **Wylogowanie:** Kliknięcie wyloguj -> przekierowanie do logowania.

## 9. Warunki i walidacja

- **Aktywny link:** Link odpowiadający obecnemu URL powinien mieć wyraźny styl (np. inny kolor tekstu, tło).
- **Brak Avatara:** Wyświetlenie inicjałów wygenerowanych z emaila/nazwy.
- **Wyświetlanie nazwy:** Priorytet: `full_name` z metadanych > email.

## 10. Obsługa błędów

- **Błąd wylogowania:** Wyświetlenie Toast z informacją o błędzie, jeśli API zwróci błąd (choć zazwyczaj czyści się sesję lokalną mimo błędu serwera).

## 11. Kroki implementacji

1.  **Layout Astro:** Stworzenie `src/layouts/AppLayout.astro`.
2.  **Komponenty UI:**
    - Zainstalowanie (jeśli brak) komponentów shadcn: `sheet`, `dropdown-menu`, `avatar`.
3.  **Komponenty React:**
    - Implementacja `UserSection` z logiką wyświetlania nazwy.
    - Implementacja `UserMenu` z pozycjami Profil (disabled) i Wyloguj.
    - Implementacja `DesktopNavigation` (widoczna na sm+).
    - Implementacja `MobileNavigation` z drawer (widoczna na <sm).
    - Implementacja `NavigationContainer` (zawierającego oba komponenty).
4.  **Integracja:**
    - Osadzenie komponentów React w `AppLayout`.
    - Przekazanie danych sesji z `Astro.locals` (obecnie zamockowane).
5.  **Style:** Dostosowanie responsywności (ukrywanie/pokazywanie elementów na breakpoincie `sm` = 640px).

## 12. Pliki implementacji

```text
src/
├── layouts/
│   └── AppLayout.astro
└── components/
    └── navigation/
        ├── index.ts
        ├── types.ts
        ├── NavigationContainer.tsx
        ├── DesktopNavigation.tsx
        ├── MobileNavigation.tsx
        ├── UserSection.tsx
        └── UserMenu.tsx
```
