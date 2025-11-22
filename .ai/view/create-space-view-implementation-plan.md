# Plan implementacji widoku tworzenia przestrzeni (Modal)

## 1. Przegląd
Widok realizowany jest jako wielokrokowy modal (`CreateSpaceModal`), dostępny z poziomu listy przestrzeni (`/spaces`). Proces składa się z dwóch etapów:
1.  Definicja przestrzeni (Nazwa, Typ, Ikona).
2.  (Opcjonalnie) Masowe dodawanie zadań z szablonów powiązanych z wybranym typem przestrzeni.

## 2. Routing widoku
Widok nie posiada dedykowanego routingu URL (jest to modal). Jest osadzony w:
- **Rodzic:** `src/pages/spaces/index.astro` -> `SpacesListContainer`.

## 3. Struktura komponentów

```text
CreateSpaceModal (Dialog Container)
├── CreateSpaceStep (Step 1)
│   ├── SpaceNameInput
│   ├── SpaceTypeSelect (Async Select)
│   ├── EmojiGrid (Selection)
│   └── StepActions (Anuluj, Utwórz)
└── AddTasksFromTemplatesStep (Step 2)
    ├── TaskTemplatesList (Form Array)
    │   └── TemplateItemRow
    │       ├── SelectionCheckbox
    │       ├── TaskNameLabel
    │       └── RecurrenceControls (Value Input + Unit Select)
    └── StepActions (Pomiń, Dodaj zadania)
```

## 4. Szczegóły komponentów

### `CreateSpaceModal`
- **Opis:** Kontener (Dialog) zarządzający stanem procesu.
- **Odpowiedzialność:**
  - Przechowuje stan: aktualny krok (`step`), dane utworzonej przestrzeni (`createdSpace`).
  - Warunkowo renderuje `CreateSpaceStep` lub `AddTasksFromTemplatesStep`.
  - Obsługuje zamknięcie modala (reset stanu).
- **Props:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onSpaceCreated: () => void` (callback do odświeżenia listy przestrzeni w rodzicu).

### `CreateSpaceStep`
- **Opis:** Formularz tworzenia samej przestrzeni.
- **Interakcje:**
  - Wybór typu przestrzeni pobiera domyślną ikonę i sugeruje ją w `EmojiGrid`.
  - Zatwierdzenie wysyła `POST /api/spaces`.
  - Sukces -> Przekazuje dane przestrzeni do rodzica i przechodzi do kroku 2 (jeśli wybrano typ) lub zamyka modal (jeśli nie wybrano typu).
- **Walidacja (Zod):**
  - `name`: wymagane, min 1, max 100 znaków.
  - `space_type`: opcjonalne.
  - `icon`: opcjonalne, max 50 znaków.
- **Obsługa błędów:** Wyświetlenie błędu 409 (duplikat nazwy) pod polem nazwy.

### `AddTasksFromTemplatesStep`
- **Opis:** Formularz wyboru szablonów zadań.
- **Props:**
  - `spaceId`: ID utworzonej w kroku 1 przestrzeni.
  - `spaceType`: Kod typu przestrzeni (do pobrania szablonów).
  - `onFinish`: Zamknięcie modala.
- **Interakcje:**
  - Pobiera szablony (`GET /api/task-templates`).
  - Renderuje listę z checkboxami (domyślnie zaznaczone).
  - Umożliwia edycję cykliczności dla każdego wiersza (nadpisanie domyślnych wartości szablonu).
  - Zatwierdzenie wysyła `POST .../bulk-from-templates`.
- **Walidacja:** Przynajmniej jeden szablon wybrany (jeśli użytkownik klika "Dodaj"), walidacja wartości cykliczności (>0).

### `SpaceTypeSelect`
- **Opis:** Select pobierający opcje z `GET /api/space-types`.
- **Props:** `value`, `onChange`.

## 5. Typy

### DTO (używane w API)
Wykorzystanie istniejących typów z `src/types.ts`:
- `SpaceDto`, `SpaceTypeDto`, `TaskTemplateDto`.
- `CreateSpaceCommand`.
- `BulkCreateTasksCommand`, `BulkCreateTaskItemCommand`.

### ViewModel (Stan formularzy)

**Step 1 Schema (`createSpaceSchema`):**
```typescript
{
  name: string;
  space_type: string | null; // code
  icon: string | null;
}
```

**Step 2 Schema (`addTemplatesSchema`):**
```typescript
{
  templates: {
    template_id: string;
    isSelected: boolean;
    task_name: string; // display only
    recurrence_value: number; // editable
    recurrence_unit: 'days' | 'months'; // editable
  }[]
}
```

## 6. Zarządzanie stanem

- **Globalny (w Modalu):**
  - `step`: `'create' | 'templates'`
  - `newSpace`: `SpaceDto | null` (wynik kroku 1, potrzebny ID do kroku 2).

- **Lokalny (Step 1 - React Hook Form):**
  - Pola formularza, obsługa `isSubmitting`.

- **Lokalny (Step 2 - React Hook Form + useFieldArray):**
  - Tablica szablonów. `useFieldArray` idealnie obsłuży dynamiczną listę z edytowalnymi polami.

- **Data Fetching (React Query):**
  - `useSpaceTypes` (Step 1).
  - `useCreateSpace` (Step 1 Mutation).
  - `useTaskTemplates` (Step 2 Query, enabled when step === 'templates').
  - `useBulkCreateTasks` (Step 2 Mutation).

## 7. Integracja API

### Krok 1: Utworzenie przestrzeni
- **Request:** `POST /api/spaces`
- **Payload:** `{ name, space_type, icon }`
- **Response:** `201 Created` -> `SpaceDto`

### Pobranie typów (pomocnicze)
- **Request:** `GET /api/space-types`
- **Response:** `{ data: SpaceTypeDto[] }`

### Krok 2: Pobranie szablonów
- **Request:** `GET /api/task-templates?space_type={selectedType}`
- **Response:** `{ data: TaskTemplateDto[] }`

### Krok 2: Dodanie zadań
- **Request:** `POST /api/spaces/{spaceId}/tasks/bulk-from-templates`
- **Payload:**
```json
{
  "items": [
    {
      "template_id": "uuid",
      "override_recurrence_value": 7, // tylko jeśli zmieniono
      "override_recurrence_unit": "days" // tylko jeśli zmieniono
    }
  ]
}
```
- **Response:** `207 Multi-Status`

## 8. Interakcje użytkownika

1.  Kliknięcie "Dodaj nową przestrzeń" w `SpacesListContainer` otwiera Modal.
2.  **Krok 1:**
    - Użytkownik wpisuje nazwę.
    - Wybiera typ (np. "Kuchnia"). Formularz automatycznie ustawia ikonę "🍳", ale użytkownik może ją zmienić.
    - Klika "Utwórz".
3.  **Przejście:**
    - Jeśli request OK: Aplikacja zapisuje utworzoną przestrzeń.
    - Jeśli wybrano typ -> przechodzi do Kroku 2.
    - Jeśli NIE wybrano typu -> zamyka modal, odświeża listę przestrzeni, pokazuje toast "Przestrzeń utworzona".
4.  **Krok 2:**
    - Wyświetla się lista sugerowanych zadań (np. "Wyrzuć śmieci", "Mycie podłogi").
    - Użytkownik odznacza te, których nie chce.
    - Użytkownik zmienia "Wyrzuć śmieci" z "co 3 dni" na "co 2 dni".
    - Klika "Dodaj wybrane zadania".
    - LUB klika "Pomiń" (zamyka modal, tylko przestrzeń zostaje utworzona).
5.  **Finał:**
    - Request `bulk-from-templates`.
    - Po sukcesie: Zamknięcie modala, Toast ("Przestrzeń i zadania utworzone"), Odświeżenie listy.

## 9. Warunki i walidacja

- **Unikalność nazwy:** Jeśli API zwróci 409 w Kroku 1, formularz musi wyświetlić błąd pod polem `name`: "Przestrzeń o tej nazwie już istnieje".
- **Wymagalność:** Nazwa jest wymagana.
- **Brak szablonów:** Jeśli w kroku 2 API zwróci pustą listę szablonów, wyświetl komunikat "Brak szablonów dla tego typu" i przycisk "Zakończ".

## 10. Obsługa błędów

- **Step 1 Fail:** Błąd API wyświetlany w formularzu (dla 400/409) lub jako Toast (dla 500). Modal pozostaje otwarty.
- **Step 2 Fail (Bulk):**
  - Jeśli 500/400: Toast błędu, modal otwarty, można ponowić.
  - Jeśli 207 (Multi-Status): Sprawdzenie czy wszystkie się udały. Jeśli część failed (np. duplikaty), można pokazać info "Dodano X zadań, Y pominięto".
- **Utrata kontekstu:** Jeśli użytkownik zamknie modal w kroku 2, przestrzeń już istnieje (utworzona w kroku 1). Jest to akceptowalne zachowanie (po prostu nie dodał zadań na start).

## 11. Kroki implementacji

1.  **Hooki API:** Implementacja `useSpaceTypes`, `useTaskTemplates`, `useCreateSpace`, `useBulkCreateTasks` (z użyciem serwisu API).
2.  **Komponent `CreateSpaceStep`:** Budowa formularza z Zod i walidacją asynchroniczną (409).
3.  **Komponent `AddTasksFromTemplatesStep`:** Budowa formularza dynamicznego z `useFieldArray`. Logika mapowania `TaskTemplateDto` -> `FormItem`.
4.  **Komponent `CreateSpaceModal`:** Logika przełączania kroków i zarządzania stanem `createdSpace`.
5.  **Integracja:** Podpięcie modala w `SpacesListContainer`.

