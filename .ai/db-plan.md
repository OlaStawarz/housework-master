# Schemat Bazy Danych - Housework Master

## 1. Tabele z Kolumnami, Typami Danych i Ograniczeniami

### Tabela: `users`

Tabela zarządzana przez Supabase Auth. Nie wymaga tworzenia ręcznego - Supabase automatycznie tworzy tabelę `auth.users` przy konfiguracji autentykacji.

**Kolumny używane w aplikacji:**
| Kolumna     | Typ                | Ograniczenia                        | Opis                                         |
|-------------|--------------------|-------------------------------------|----------------------------------------------|
| id          | UUID               | PRIMARY KEY                         | Unikalny identyfikator użytkownika           |
| email       | VARCHAR(255)       | NOT NULL, UNIQUE                    | Adres email użytkownika                      |
| password    | VARCHAR(255)       | NOT NULL                            | Hasło użytkownika (przechowywane hashowane)  |
---

### Tabela: `spaces`

Przechowuje przestrzenie (pomieszczenia) utworzone przez użytkowników do grupowania zadań.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator przestrzeni |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) ON DELETE CASCADE | Właściciel przestrzeni |
| `name` | VARCHAR(100) | NOT NULL | Nazwa przestrzeni (np. "Kuchnia na dole", "Łazienka główna") |
| `space_type` | VARCHAR(50) | NULL | Typ przestrzeni używany do dopasowania szablonów zadań (np. "kitchen", "bathroom") |
| `icon` | VARCHAR(50) | NULL | Ikona przestrzeni (emoji lub nazwa ikony z biblioteki) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data i czas utworzenia rekordu |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data i czas ostatniej modyfikacji rekordu |


**Ograniczenia:**
- Unikalność: `UNIQUE(user_id, name)` - użytkownik nie może mieć dwóch przestrzeni o tej samej nazwie

---

### Tabela: `space_types`

Tabela systemowa przechowująca predefiniowane typy przestrzeni. Służy jako źródło typów dla tabeli `spaces` i punkt odniesienia dla `task_templates`.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator typu przestrzeni |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | Kod techniczny typu (np. "kitchen", "bathroom", "bedroom") |
| `display_name` | VARCHAR(100) | NOT NULL | Nazwa wyświetlana użytkownikowi (np. "Kuchnia", "Łazienka", "Sypialnia") |
| `icon` | VARCHAR(50) | NULL | Domyślna ikona dla tego typu przestrzeni (emoji lub nazwa ikony) |
| `display_order` | INTEGER | NOT NULL, DEFAULT 0 | Kolejność wyświetlania w interfejsie użytkownika |

**Ograniczenia:**
- Unikalność: `UNIQUE(code)` - każdy kod typu musi być unikalny

---

### Tabela: `tasks`

Przechowuje cykliczne zadania przypisane do przestrzeni.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator zadania |
| `space_id` | UUID | NOT NULL, FOREIGN KEY → spaces(id) ON DELETE CASCADE | Przestrzeń, do której należy zadanie |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) ON DELETE CASCADE | Uzytkownik, do którego należy zadanie |
| `name` | VARCHAR(200) | NOT NULL | Nazwa zadania (niezmienna po utworzeniu) |
| `recurrence_value` | INTEGER | NOT NULL, CHECK(recurrence_value > 0) | Liczba dla cykliczności (np. 7, 14, 2) |
| `recurrence_unit` | VARCHAR(10) | NOT NULL, CHECK(recurrence_unit IN ('days', 'months')) | Jednostka cykliczności: 'days' lub 'months' |
| `due_date` | TIMESTAMP WITH TIME ZONE | NOT NULL | Termin wykonania zadania |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'pending', CHECK(status IN ('pending', 'postponed')) | Status zadania |
| `postponement_count` | INTEGER | NOT NULL, DEFAULT 0, CHECK(postponement_count BETWEEN 0 AND 3) | Licznik odroczeń dla bieżącego cyklu (max 3) |
| `last_completed_at` | TIMESTAMP WITH TIME ZONE | NULL | Data i czas ostatniego wykonania zadania |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data i czas utworzenia rekordu |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data i czas ostatniej modyfikacji rekordu |

**Ograniczenia:**
- Unikalność: `UNIQUE(space_id, name)` - w jednej przestrzeni nie może być dwóch zadań o tej samej nazwie

---

### Tabela: `task_templates`

Przechowuje predefiniowane szablony zadań dla różnych typów przestrzeni. Tabela systemowa wypełniona danymi początkowymi.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator szablonu |
| `space_type` | VARCHAR(50) | NOT NULL | Typ przestrzeni (np. "kitchen", "bathroom", "bedroom") |
| `task_name` | VARCHAR(200) | NOT NULL | Nazwa zadania w szablonie |
| `default_recurrence_value` | INTEGER | NOT NULL, CHECK(default_recurrence_value > 0) | Domyślna wartość cykliczności |
| `default_recurrence_unit` | VARCHAR(10) | NOT NULL, CHECK(default_recurrence_unit IN ('days', 'months')) | Domyślna jednostka cykliczności |
| `display_order` | INTEGER | NOT NULL, DEFAULT 0 | Kolejność wyświetlania w liście szablonów |

**Ograniczenia:**
- Unikalność: `UNIQUE(space_type, task_name)` - w jednym typie przestrzeni nie może być dwóch zadań o tej samej nazwie

---

### Tabela: `motivational_messages`

Przechowuje komunikaty motywacyjne generowane przez AI dla zadań.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator komunikatu |
| `task_id` | UUID | NOT NULL, FOREIGN KEY → tasks(id) ON DELETE CASCADE | Zadanie, dla którego wygenerowano komunikat |
| `message_text` | TEXT | NOT NULL, CHECK(length(message_text) <= 150) | Treść komunikatu motywacyjnego (max 150 znaków) |
| `generated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data i czas wygenerowania komunikatu |

---

## 2. Relacje Między Tabelami

### Relacja: `auth.users` → `spaces` (1:N)
- **Kardynalność:** Jeden użytkownik może mieć wiele przestrzeni
- **Klucz obcy:** `spaces.user_id` → `auth.users.id`
- **Polityka usuwania:** `ON DELETE CASCADE` - usunięcie użytkownika usuwa wszystkie jego przestrzenie

### Relacja: `space_types` ↔ `spaces` (Logiczna)
- **Kardynalność:** Jeden typ przestrzeni może być używany przez wiele przestrzeni
- **Powiązanie:** `spaces.space_type` = `space_types.code` (bez klucza obcego)
- **Uwaga:** Jest to logiczna relacja bez formalnego FK. Kolumna `space_type` w tabeli `spaces` może być NULL (niestandardowa przestrzeń)

### Relacja: `space_types` ↔ `task_templates` (Logiczna)
- **Kardynalność:** Jeden typ przestrzeni może mieć wiele szablonów zadań
- **Powiązanie:** `task_templates.space_type` = `space_types.code` (bez klucza obcego)
- **Uwaga:** Jest to logiczna relacja bez formalnego FK dla zachowania elastyczności

### Relacja: `spaces` → `tasks` (1:N)
- **Kardynalność:** Jedna przestrzeń może mieć wiele zadań
- **Klucz obcy:** `tasks.space_id` → `spaces.id`
- **Polityka usuwania:** `ON DELETE CASCADE` - usunięcie przestrzeni usuwa wszystkie przypisane do niej zadania

### Relacja: `tasks` → `motivational_messages` (1:N)
- **Kardynalność:** Jedno zadanie może mieć wiele komunikatów motywacyjnych (historia komunikatów)
- **Klucz obcy:** `motivational_messages.task_id` → `tasks.id`
- **Polityka usuwania:** `ON DELETE CASCADE` - usunięcie zadania usuwa wszystkie jego komunikaty motywacyjne

---

## 3. Indeksy

### Tabela: `spaces`
- Indeks na `user_id` dla szybkiego filtrowania przestrzeni użytkownika

### Tabela: `space_types`
- Unikalny indeks na `code` dla szybkiego wyszukiwania typu po kodzie
- Indeks na `display_order` dla sortowanego pobierania listy typów

### Tabela: `task_templates`
- Indeks na `space_type` dla szybkiego pobierania szablonów dla danego typu przestrzeni
- Kompozytowy indeks na `(space_type, display_order)` dla sortowanego pobierania szablonów

### Tabela: `tasks`
- Indeks na `space_id` dla szybkiego pobierania zadań z danej przestrzeni
- Kompozytowy indeks dla filtrowania zadań na kolumnach `user_id`, `status`, `due_date`


### Tabela: `motivational_messages`
- Indeks na `task_id` dla szybkiego pobierania komunikatów dla zadania
- Kompozytowy indeks dla pobierania najnowszych komunikatów dla zadania na kolumnach `task_id` i `generated_at`


---

## 4. Polityki Row Level Security (RLS)

Supabase używa PostgreSQL Row Level Security do zabezpieczenia danych na poziomie wiersza. Wszystkie tabele wymagają włączenia RLS i odpowiednich polityk.

### Tabele systemowe: `space_types`, `task_templates`

Tabele systemowe dostępne tylko do odczytu dla wszystkich użytkowników:
- **SELECT:** Publiczny dostęp do odczytu dla wszystkich zalogowanych użytkowników
- **INSERT/UPDATE/DELETE:** Brak polityk - tylko administratorzy bazy danych mogą modyfikować dane systemowe

### Tabele użytkownika: `spaces`, `tasks`, `motivational_messages`

Wszystkie tabele użytkownika używają polityk RLS opartych na `user_id`:
- Polityki wykorzystują `auth.uid() = user_id` z użyciem klauzul `USING` i `WITH_CHECK`
- Użytkownicy mają dostęp tylko do własnych danych (spaces) lub danych powiązanych przez klucze obce (tasks, motivational_messages)

## 5. Dodatkowe Uwagi i Wyjaśnienia Decyzji Projektowych

### 5.1. Użycie UUID jako Kluczy Głównych
UUID zostały wybrane zamiast sekwencyjnych liczb całkowitych ze względu na:
- Lepszą integrację z Supabase, który domyślnie używa UUID dla `auth.users`
- Zwiększone bezpieczeństwo (brak przewidywalności identyfikatorów)

### 5.2. Status Zadania jako ENUM
Pole `status` używa ograniczenia CHECK z wartościami:
- `pending` - zadanie aktywne, oczekuje na wykonanie w bieżącym cyklu
- `postponed` - zadanie zostało odroczone (do 3 razy)

**Uwaga o statusach pominiętych:**

**`completed`** - Status celowo pominięty. W systemie zadań cyklicznych "wykonanie" to akcja, nie stan trwały. Gdy użytkownik oznaczy zadanie jako wykonane, system automatycznie:
1. Zapisuje `last_completed_at = NOW()`
2. Przelicza nowy `due_date` (dodaje `recurrence_value` jednostek czasu)
3. Resetuje `postponement_count = 0`
4. Pozostawia status jako `pending` (zadanie czeka na kolejny cykl)

**`overdue`** - Status celowo pominięty. Stan "przeterminowane" jest wyliczany w czasie zapytania (query-time) jako logiczny widok, a nie fizyczny status w bazie. Zadanie jest traktowane jako overdue gdy `due_date < NOW()` i `status IN ('pending', 'postponed')`.

### 5.3. Mechanizm Odkładania Zadań
Kolumna `postponement_count` z ograniczeniem `CHECK(postponement_count BETWEEN 0 AND 3)` implementuje limit 3 odroczeń. Po wykonaniu zadania licznik jest resetowany do 0.

### 5.4. Cykliczność Zadań
Zamiast przechowywać bezpośrednio cron expression, system używa prostszego modelu:
- `recurrence_value` - liczba (np. 7, 14, 2)
- `recurrence_unit` - jednostka ('days' lub 'months')
- Przykład: co 7 dni = `{recurrence_value: 7, recurrence_unit: 'days'}`

### 5.5. Komunikaty Motywacyjne
Tabela `motivational_messages` przechowuje historię wygenerowanych komunikatów. Maksymalna długość komunikatu to 150 znaków.

### 5.6. CASCADE DELETE
Wszystkie relacje używają `ON DELETE CASCADE`:
- Usunięcie użytkownika → usuwa wszystkie jego przestrzenie → usuwa wszystkie zadania → usuwa wszystkie komunikaty
- To zapewnia spójność danych i spełnia wymaganie US-004 (usunięcie konta)

### 5.7. Kolumny audytowe
Tylko wybrane tabele zawierają kolumny audytowe:
- **`spaces`**: `created_at` i `updated_at` - użytkownik może edytować nazwę/ikonę przestrzeni
- **`tasks`**: `created_at` i `updated_at` - użytkownik może edytować cykliczność zadania
- **`motivational_messages`**: `generated_at` - data wygenerowania komunikatu przez AI
- **`space_types` i `task_templates`**: Brak kolumn audytowych - to dane systemowe, rzadko modyfikowane

Kolumna `updated_at` w tabelach `spaces` i `tasks` jest aktualizowana poprzez trigger przy każdej modyfikacji rekordu.

### 5.8. Typy Przestrzeni
Tabela `space_types` przechowuje predefiniowane typy przestrzeni:
- **Tabela systemowa:** Zawiera zestaw typów przestrzeni zdefiniowanych przez system (np. kuchnia, łazienka, sypialnia).
- **Brak relacji FK:** Powiązanie z `spaces` i `task_templates` jest logiczne (przez `code`), bez formalnych kluczy obcych dla elastyczności.
- **Ikony:** Każdy typ ma domyślną ikonę, którą użytkownik może nadpisać w swojej przestrzeni.
- **Dostęp tylko do odczytu:** Użytkownicy mogą tylko odczytywać typy. Dodawanie/modyfikacja wymaga uprawnień administratora.

**Przykładowe dane początkowe:**
```
{code: "kitchen", display_name: "Kuchnia", icon: "🍳", display_order: 1}
{code: "bathroom", display_name: "Łazienka", icon: "🚿", display_order: 2}
{code: "bedroom", display_name: "Sypialnia", icon: "🛏️", display_order: 3}
{code: "living_room", display_name: "Salon", icon: "🛋️", display_order: 4}
{code: "garage", display_name: "Garaż", icon: "🚗", display_order: 5}
```

### 5.9. Szablony Zadań
Tabela `task_templates` przechowuje predefiniowane szablony zadań dla różnych typów przestrzeni:
- **Powiązanie z typami:** Szablony są powiązane z typami przestrzeni przez `space_type` = `space_types.code`.
- **Brak relacji FK do tasks:** Szablony nie są połączone z tabelą `tasks`. Służą jedynie jako źródło danych podczas tworzenia nowych zadań.
- **Kolejność wyświetlania:** Kolumna `display_order` kontroluje kolejność prezentacji szablonów dla danego typu.
- **Dostęp tylko do odczytu:** Użytkownicy mogą tylko odczytywać szablony. Modyfikacja wymaga uprawnień administratora.

**Przykładowe dane początkowe:**
```
kitchen: Wyrzucenie śmieci (3 dni), Umycie podłogi (7 dni), Czyszczenie lodówki (30 dni)
bathroom: Czyszczenie toalety (3 dni), Pranie ręczników (7 dni), Czyszczenie prysznica (7 dni)
bedroom: Zmiana pościeli (14 dni), Odkurzanie (7 dni), Wietrzenie (1 dzień)
```


