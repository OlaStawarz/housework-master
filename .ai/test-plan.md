# Plan Testów - Housework Master

## 1. Wprowadzenie i cele testowania

Celem niniejszego planu jest zdefiniowanie strategii zapewnienia jakości dla aplikacji "Housework Master". Proces testowy ma na celu zweryfikowanie, czy aplikacja spełnia wymagania funkcjonalne (US-001 do US-018), jest wolna od krytycznych błędów oraz zapewnia bezpieczeństwo danych użytkowników.

Główne cele:
*   Potwierdzenie poprawności kluczowych procesów biznesowych (cykl życia zadania).
*   Weryfikacja integracji komponentów w architekturze Astro Islands.
*   Zapewnienie stabilności integracji z usługami zewnętrznymi (Supabase, OpenRouter).

## 2. Zakres testów

### W zakresie (In Scope):
*   **Moduł Użytkownika**: Rejestracja, logowanie, wylogowanie, reset hasła, usuwanie konta.
*   **Moduł Przestrzeni**: CRUD przestrzeni, kaskadowe usuwanie danych.
*   **Moduł Zadań**: Tworzenie (własne/szablony), edycja cykliczności, usuwanie, oznaczanie jako wykonane, odkładanie ("Zrobię to jutro").
*   **Moduł AI**: Generowanie komunikatów motywacyjnych, obsługa błędów API.
*   **Interfejs**: Dashboard, widoki list, responsywność (RWD).

### Poza zakresem (Out of Scope):
*   Funkcjonalności oznaczone jako "Poza zakresem MVP" (logowanie społecznościowe, gamifikacja).
*   Testy wydajnościowe obciążeniowe (na obecnym etapie MVP przewidywany ruch jest niski).

## 3. Typy testów do przeprowadzenia

1.  **Testy Jednostkowe (Unit Tests)**:
    *   Testowanie funkcji logicznych w `src/lib/utils` (szczególnie obliczanie dat).
    *   Testowanie serwisów `src/lib/services` z mockowaniem bazy danych i API.
    *   Testowanie izolowanych komponentów React (np. `CreateTaskModal`).
2.  **Testy Integracyjne (Integration Tests)**:
    *   Weryfikacja API Endpoints w `src/pages/api`.
    *   Testowanie komunikacji z lokalną instancją Supabase (z użyciem Docker/Supabase CLI).
3.  **Testy End-to-End (E2E)**:
    *   Symulacja pełnych ścieżek użytkownika w przeglądarce.
    *   Weryfikacja poprawnej hydracji i interakcji komponentów React wewnątrz stron Astro.
4.  **Testy Bezpieczeństwa (Security/RLS Tests)**:
    *   Weryfikacja czy użytkownik A nie widzi danych użytkownika B (testy na poziomie bazy danych).

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### Obszar 1: Zarządzanie Kontem (Auth)

*   **TC-AUTH-01: Rejestracja nowego użytkownika**
    Celem jest weryfikacja procesu zakładania konta. Użytkownik wypełnia formularz poprawnymi danymi (email, hasło). Oczekuje się utworzenia konta w bazie, automatycznego zalogowania i przekierowania na dashboard.

*   **TC-AUTH-02: Walidacja formularza rejestracji**
    Celem jest sprawdzenie zabezpieczeń formularza przed błędnymi danymi. Próba rejestracji z niepoprawnym formatem email lub różnymi hasłami. Oczekuje się wyświetlenia odpowiednich komunikatów błędu i braku utworzenia konta.

*   **TC-AUTH-03: Logowanie i Wylogowanie**
    Celem jest sprawdzenie dostępu do sesji. Użytkownik loguje się poprawnymi danymi, uzyskuje dostęp, a następnie wylogowuje się. Oczekuje się poprawnego ustanowienia i zakończenia sesji oraz przekierowań.

*   **TC-AUTH-04: Resetowanie hasła**
    Celem jest weryfikacja procedury odzyskiwania dostępu. Użytkownik inicjuje reset hasła dla swojego emaila. Oczekuje się wysłania linku resetującego (symulacja) i możliwości ustawienia nowego hasła.

*   **TC-AUTH-05: Usuwanie konta**
    Celem jest sprawdzenie prawa do bycia zapomnianym. Użytkownik wybiera opcję usunięcia konta w ustawieniach. Oczekuje się trwałego usunięcia konta oraz wszystkich powiązanych danych (przestrzenie, zadania) z bazy.

### Obszar 2: Zarządzanie Przestrzeniami

*   **TC-SPACE-01: Tworzenie nowej przestrzeni**
    Celem jest weryfikacja możliwości organizowania zadań. Użytkownik dodaje nową przestrzeń o nazwie "Sypialnia" wraz z wybraniem zadań z szablonów/nie wybraniem zadań z szablonów. Oczekuje się pojawienia nowej karty przestrzeni na liście i w bazie danych.

*   **TC-SPACE-02: Usuwanie przestrzeni (Kaskadowe)**
    Celem jest sprawdzenie spójności danych przy usuwaniu. Użytkownik usuwa przestrzeń zawierającą aktywne zadania. Oczekuje się usunięcia samej przestrzeni oraz wszystkich przypisanych do niej zadań (brak "sierot" w bazie).

*   **TC-SPACE-03: Widok pusty (Onboarding)**
    Celem jest weryfikacja UX dla nowego użytkownika. Nowy użytkownik wchodzi na listę przestrzeni. Oczekuje się wyświetlenia komunikatu zachęcającego do stworzenia pierwszej przestrzeni zamiast pustej listy.

### Obszar 3: Zarządzanie Zadaniami

*   **TC-TASK-01: Tworzenie zadania niestandardowego**
    Celem jest weryfikacja elastyczności konfiguracji zadań. Użytkownik tworzy zadanie z własną nazwą i cyklicznością (np. co 3 miesiące). Oczekuje się poprawnego zapisu i obliczenia daty pierwszego wykonania.

*   **TC-TASK-02: Wykonanie zadania (Recurrence Logic)**
    Celem jest weryfikacja logiki cykliczności. Użytkownik oznacza zadanie cykliczne jako wykonane. Oczekuje się zmiany statusu i automatycznego utworzenia/zaktualizowania terminu na kolejny cykl (np. dzisiaj + cykl).

*   **TC-TASK-03: Odkładanie zadania ("Zrobię to jutro")**
    Celem jest weryfikacja funkcji snooze. Użytkownik klika "Zrobię to jutro" na zadaniu. Oczekuje się przesunięcia terminu o 24h i zwiększenia licznika użyć tej opcji.

*   **TC-TASK-04: Limit odkładania zadania**
    Celem jest sprawdzenie reguł biznesowych (anti-procrastination). Użytkownik próbuje odłożyć zadanie po raz czwarty z rzędu. Oczekuje się, że przycisk odkładania jest nieaktywny (zablokowany) po 3 użyciach.

*   **TC-TASK-05: Usuwanie zadania**
    Celem jest weryfikacja czyszczenia listy. Użytkownik usuwa wybrane zadanie. Oczekuje się jego trwałego zniknięcia z listy i bazy danych.

### Obszar 4: System Motywacyjny (AI)

*   **TC-AI-01: Generowanie komunikatu motywacyjnego**
    Celem jest weryfikacja integracji z OpenRouter. Użytkownik posiada zadanie ze zbliżającym się terminem. Oczekuje się wyświetlenia przy zadaniu kontekstowego tekstu wygenerowanego przez AI (np. nawiązującego do nazwy zadania).

*   **TC-AI-02: Obsługa niedostępności AI (Graceful Degradation)**
    Celem jest sprawdzenie stabilności aplikacji przy awarii zewnętrznego serwisu. Symulowany błąd API AI podczas pobierania dashboardu. Oczekuje się poprawnego załadowania listy zadań (bez komunikatów AI lub z tekstem domyślnym), bez awarii całej strony.

### Obszar 5: Bezpieczeństwo i Dostęp (Security)

*   **TC-SEC-01: Izolacja danych (RLS)**
    Celem jest weryfikacja poufności danych. Użytkownik A próbuje uzyskać dostęp do zadań Użytkownika B poprzez API (podmieniając ID). Oczekuje się odmowy dostępu (błąd 403/404) wymuszonej przez polityki bazy danych.

*   **TC-SEC-02: Ochrona routów**
    Celem jest weryfikacja middleware autoryzacyjnego. Niezalogowany użytkownik próbuje wejść bezpośrednio na URL `/dashboard`. Oczekuje się automatycznego przekierowania na stronę logowania.

## 5. Środowisko testowe

*   **Local (Deweloperskie)**:
    *   Lokalna instancja Supabase (uruchamiana przez `npx supabase start`).
    *   Mockowane zmienne środowiskowe dla AI API.
*   **Staging/CI**:
    *   GitHub Actions uruchamiające testy na każdym Pull Request.
    *   Efemeryczna baza danych Supabase na czas trwania testów.

## 6. Narzędzia do testowania

| Typ testu | Narzędzie | Uzasadnienie |
| :--- | :--- | :--- |
| **Unit / Integration** | **Vitest** | Natywne wsparcie dla Vite (używanego przez Astro), wysoka wydajność, kompatybilność z API Jest. |
| **Component Testing** | **React Testing Library** | Standard branżowy do testowania komponentów React z perspektywy użytkownika. |
| **E2E** | **Playwright** | Obsługa nowoczesnych przeglądarek, świetne narzędzia do debugowania, możliwość testowania scenariuszy sieciowych (mocking network requests). |
| **Database/RLS** | **Supabase CLI + pgTAP** | Umożliwia testowanie reguł bezpieczeństwa bezpośrednio na bazie danych. |

## 7. Harmonogram testów

1.  **Etap 1 (Unit)**: Pisane na bieżąco przez programistów (TDD lub równolegle z kodem). Fokus: Serwisy i Utils.
2.  **Etap 2 (Integration)**: Po zakończeniu implementacji modułu (np. API endpointów).
3.  **Etap 3 (E2E Smoke Tests)**: Przed każdym mergem do gałęzi `main`. Sprawdzenie krytycznych ścieżek (Logowanie -> Dashboard).
4.  **Etap 4 (Pełna regresja)**: Przed wydaniem wersji produkcyjnej.

## 8. Kryteria akceptacji testów

*   **Code Coverage**: Minimum 80% pokrycia dla `src/lib/services` i `src/lib/utils`.
*   **Pass Rate**: 100% testów musi przechodzić na gałęzi `main`.
*   **Bugs**: Brak błędów o priorytecie Critical i High.

## 9. Role i odpowiedzialności

*   **Developer**:
    *   Tworzenie testów jednostkowych i integracyjnych dla swojego kodu.
    *   Uruchamianie testów lokalnie przed commitowaniem.
*   **QA Engineer (Rola symulowana/przyszła)**:
    *   Tworzenie i utrzymanie scenariuszy E2E.
    *   Testy eksploracyjne i manualne weryfikowanie UI.
    *   Weryfikacja zgodności z PRD.

## 10. Procedury raportowania błędów

Błędy należy zgłaszać w systemie śledzenia (np. GitHub Issues) według szablonu:
1.  **Tytuł**: Krótki opis problemu.
2.  **Środowisko**: Wersja przeglądarki, OS, wersja aplikacji.
3.  **Kroki do reprodukcji**: Dokładna lista kroków "krok po kroku".
4.  **Oczekiwany rezultat**: Co powinno się stać.
5.  **Rzeczywisty rezultat**: Co się stało (wraz ze screenshotami/logami).
6.  **Priorytet**: (Krytyczny, Wysoki, Średni, Niski).
