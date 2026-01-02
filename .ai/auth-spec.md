# Specyfikacja Architektury Uwierzytelniania (Auth Spec)

## 1. Architektura Interfejsu Użytkownika (UI)

### 1.1. Nowe Strony i Trasy (Astro Pages)

Wszystkie nowe strony będą obsługiwane w trybie SSR (`output: 'server'`), co pozwala na weryfikację sesji przed wyrenderowaniem treści.

1.  **`/login`** (`src/pages/login.astro`):
    *   **Cel**: Umożliwienie logowania istniejącym użytkownikom.
    *   **Layout**: Nowy `AuthLayout.astro` (uproszczony, wycentrowany content, brak pełnej nawigacji).
    *   **Komponenty**: `LoginForm.tsx` (React).
    *   **Logika**: Jeśli użytkownik jest już zalogowany -> przekierowanie na `/dashboard`.

2.  **`/register`** (`src/pages/register.astro`):
    *   **Cel**: Rejestracja nowych użytkowników.
    *   **Layout**: `AuthLayout.astro`.
    *   **Komponenty**: `RegisterForm.tsx` (React).
    *   **Logika**: Jeśli użytkownik jest już zalogowany -> przekierowanie na `/dashboard`.

3.  **`/forgot-password`** (`src/pages/forgot-password.astro`):
    *   **Cel**: Formularz resetowania hasła.
    *   **Layout**: `AuthLayout.astro`.
    *   **Komponenty**: `ForgotPasswordForm.tsx`.

4.  **`/auth/callback`** (`src/pages/api/auth/callback.ts`):
    *   **Cel**: Endpoint API (nie strona wizualna) do obsługi potwierdzeń email i wymiany kodu na sesję (PKCE flow dla Supabase).

### 1.2. Modyfikacja Istniejących Stron

1.  **Strona Główna (`src/pages/index.astro`)**:
    *   **Obecnie**: Przekierowuje sztywno na `/dashboard`.
    *   **Zmiana**:
        *   Sprawdzenie sesji w `Astro.locals` (lub bezpośrednio przez helpery Supabase).
        *   **Jeśli zalogowany**: Przekierowanie na `/dashboard`.
        *   **Jeśli gość**: Renderowanie nowej zawartości "Landing Page" – tzw. "Mock Dashboard".
    *   **Mock Dashboard**: Wykorzystuje istniejące komponenty (`DashboardContainer`, `TaskCard`), ale z zahardcodowanymi, przykładowymi danymi (read-only) i nakładką/banerem zachęcającym do logowania (CTA: "Zaloguj się, aby zarządzać swoim domem").

### 1.3. Komponenty React (Client-Side)

Nowe komponenty w katalogu `src/components/auth`:

1.  **`LoginForm.tsx`**:
    *   Używa `react-hook-form` + `zod` do walidacji.
    *   Pola: Email, Hasło.
    *   Obsługa błędów: Wyświetla komunikaty z API (np. "Błędne dane logowania").
    *   Akcja: `POST /api/auth/signin`.

2.  **`RegisterForm.tsx`**:
    *   Walidacja: Email (format), Hasło (min. długość), Powtórz hasło (zgodność).
    *   Akcja: `POST /api/auth/register`.

3.  **`DeleteAccountDialog.tsx`**:
    *   Modal z potwierdzeniem (wymaga wpisania np. "USUŃ" lub hasła - zależnie od API Supabase, przy logowaniu OAuth hasło może nie być dostępne, więc potwierdzenie tekstowe jest bezpieczniejsze dla MVP).
    *   **Lokalizacja**: Wywoływany bezpośrednio z `UserMenu`.

4.  **`ForgotPasswordForm.tsx`**:
    *   Używa `react-hook-form` + `zod` do walidacji.
    *   Pola: Email.
    *   Obsługa błędów: Wyświetla komunikaty z API.
    *   Akcja: `POST /api/auth/reset-password` (endpoint wywołujący `auth.resetPasswordForEmail`).
    *   Logika: Po wysłaniu wyświetla komunikat o konieczności sprawdzenia skrzynki email.

### 1.4. Nawigacja (`src/components/navigation`)

Modyfikacja `UserSection.tsx` oraz `MobileNavigation.tsx`:

*   **Stan uwierzytelnienia**: Komponenty muszą wiedzieć, czy wyświetlić menu użytkownika, czy przycisk "Zaloguj".
*   Informacja o użytkowniku będzie przekazywana z warstwy Astro (Layout) do komponentów React jako props (np. `user: User | null`).
*   **Dla Gościa**: Wyświetla przycisk `Button` (wariant `default` lub `ghost`) kierujący do `/login`.
*   **Dla Zalogowanego**: Wyświetla istniejące `UserMenu` (Avatar + Dropdown).
*   **UserMenu**: 
    *   Dodanie pozycji "Wyloguj" (`LogOut` icon), która wywołuje akcję `POST /api/auth/signout`.
    *   Dodanie pozycji "Usuń konto" (w sekcji niebezpiecznej/oddzielonej separatorem), która otwiera `DeleteAccountDialog`.

---

## 2. Logika Backendowa

### 2.1. Middleware (`src/middleware/index.ts`)

Centralny punkt ochrony aplikacji.

1.  **Inicjalizacja Supabase**: Tworzenie klienta Supabase z wykorzystaniem `@supabase/ssr` (obsługa ciasteczek).
2.  **Odświeżanie Sesji**: Automatyczne odświeżanie tokena (`sb-access-token`), jeśli wygasł, i aktualizacja ciasteczka w odpowiedzi (`response.headers`).
3.  **Ochrona Tras (Route Guard)**:
    *   Definicja tras chronionych: `/dashboard`, `/spaces`, `/api/dashboard`, `/api/spaces`, `/api/tasks`.
    *   Jeśli brak sesji przy próbie dostępu do trasy chronionej -> Przekierowanie (302) na `/login`.
4.  **Przekazywanie Usera**: Zapisanie obiektu `user` w `Astro.locals`, aby był dostępny w stronach Astro i API routes bez ponownego odpytywania Supabase.

### 2.2. API Endpoints (`src/pages/api/auth/*`)

Wszystkie endpointy autentykacji będą działać jako Astro Server Endpoints (`.ts`), zwracające JSON lub wykonujące przekierowania.

1.  **`POST /api/auth/register`**:
    *   Odbiera: `email`, `password`.
    *   Walidacja: Zod.
    *   Supabase Call: `auth.signUp()`.
    *   Wynik: Utworzenie użytkownika. Automatyczne logowanie (jeśli potwierdzenie email wyłączone) lub komunikat "Sprawdź skrzynkę".

2.  **`POST /api/auth/signin`**:
    *   Odbiera: `email`, `password`.
    *   Supabase Call: `auth.signInWithPassword()`.
    *   Wynik: Ustawienie ciasteczek sesyjnych, zwrot statusu 200 (ok). Frontend po otrzymaniu 200 przekierowuje na dashboard.

3.  **`POST /api/auth/signout`**:
    *   Supabase Call: `auth.signOut()`.
    *   Wynik: Usunięcie ciasteczek, przekierowanie na stronę główną.

4.  **`DELETE /api/auth/user`**:
    *   Wymaga aktywnej sesji.
    *   Supabase Call: `auth.admin.deleteUser()` (wymaga klucza `service_role` po stronie serwera – BEZPIECZEŃSTWO: Upewnić się, że usuwamy tylko `current_user`). Alternatywnie wywołanie funkcji RPC w bazie danych, która czyści dane użytkownika.
    *   Dla MVP: Wykorzystanie `supabase.rpc('delete_user_account')` lub `auth.users.delete` jeśli używamy klucza service role w ściśle kontrolowanym endpoincie API, weryfikującym ID użytkownika z sesji.

### 2.3. Modele Danych (rozszerzenie `src/types.ts`)

Dodanie interfejsów DTO dla Auth:

```typescript
export interface AuthUserDto {
  id: string;
  email: string;
  created_at: string;
}

export interface LoginCommand {
  email: string; // Zwalidowany email
  password: string; // Min. 6 znaków
}

export interface RegisterCommand extends LoginCommand {
  confirmPassword: string; // Musi być równe password
}
```

---

## 3. System Autentykacji (Supabase Integration)

### 3.1. Konfiguracja Klienta

Użycie biblioteki `@supabase/ssr` zamiast podstawowego `supabase-js` w kontekście serwerowym (Astro components, Middleware, API routes), aby poprawnie obsługiwać ciasteczka w środowisku Node.js/Astro.

*   **Server Client**: Używany w `middleware`, `api/*.ts` oraz `*.astro` (w bloku frontmatter). Ma dostęp do ciasteczek requestu.
*   **Browser Client**: Używany w komponentach React (`src/lib/supabase.client.ts`) – głównie do nasłuchiwania zmian stanu (`onAuthStateChange`), choć w architekturze opartej o ciasteczka HTTP-only, główny ciężar spoczywa na serwerze.

### 3.2. Zmienne Środowiskowe

Wymagane w `.env`:
*   `PUBLIC_SUPABASE_URL`
*   `PUBLIC_SUPABASE_ANON_KEY`
*   `SUPABASE_SERVICE_ROLE_KEY` (opcjonalnie, tylko jeśli wymagane do usuwania konta z poziomu API serwera).

### 3.3. Polityki RLS (Row Level Security)

Baza danych musi mieć włączone RLS dla wszystkich tabel (`spaces`, `tasks`, etc.).
*   Polityka: `auth.uid() = user_id`.
*   Zapewnia to, że nawet przy błędzie w API, użytkownik nie pobierze danych innego użytkownika.

---

## 4. Plan Wdrożenia (Kroki)

1.  **Setup**: Instalacja `@supabase/ssr`, konfiguracja zmiennych env.
2.  **Middleware**: Utworzenie `src/middleware/index.ts` z logiką sesji.
3.  **API Routes**: Implementacja endpointów w `src/pages/api/auth/`.
4.  **Komponenty UI**: Stworzenie formularzy (Login, Register) i Layoutu Auth.
5.  **Strony Astro**: Stworzenie `/login`, `/register` i modyfikacja `index.astro`.
6.  **Nawigacja**: Aktualizacja `UserSection` i integracja z sesją.
7.  **Usuwanie konta**: Implementacja dialogu i endpointu API.

