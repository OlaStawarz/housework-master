# Plan implementacji widoku edycji i usuwania zadania (Modale)

## 1. Przegląd
Plan obejmuje implementację dwóch kluczowych interakcji zarządzania zadaniami: edycji cykliczności oraz trwałego usuwania. Obie funkcjonalności realizowane są poprzez modale wywoływane z poziomu karty zadania (`TaskCard`) w widoku szczegółów przestrzeni.

## 2. Routing widoku
Funkcjonalności nie posiadają własnych adresów URL. Są realizowane jako komponenty modalne w kontekście widoku:
- **Rodzic:** `src/pages/spaces/[spaceId].astro` -> `SpaceDetailsContainer`.

## 3. Struktura komponentów

### Drzewo komponentów
```text
SpaceDetailsContainer (istniejący)
├── ...
└── Modals
    ├── EditTaskRecurrenceModal (Dialog)
    │   ├── DialogHeader (Tytuł z nazwą zadania)
    │   ├── EditTaskForm (Formularz)
    │   │   ├── RecurrenceInputs (Współdzielony komponent Value+Unit)
    │   │   └── DialogFooter (Anuluj, Zapisz)
    │   └── LoadingOverlay (opcjonalnie podczas zapisu)
    └── ConfirmDeleteTaskDialog (AlertDialog)
        ├── AlertDialogHeader (Pytanie o potwierdzenie)
        └── AlertDialogFooter (Anuluj, Usuń)
```

## 4. Szczegóły komponentów

### `EditTaskRecurrenceModal`
- **Opis:** Modal umożliwiający zmianę parametrów powtarzalności zadania. Nazwa zadania jest wyświetlana tylko do odczytu (zgodnie z PRD).
- **Props:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `task: TaskDto | null` (edytowane zadanie)
- **Interakcje:**
  - Otwarcie: Wypełnienie formularza aktualnymi wartościami `recurrence_value` i `recurrence_unit` z obiektu `task`.
  - Zapis: Wywołanie API `PATCH`.
- **Walidacja:**
  - `recurrence_value`: liczba całkowita dodatnia.
  - `recurrence_unit`: `days` lub `months`.

### `ConfirmDeleteTaskDialog`
- **Opis:** Dialog ostrzegawczy przed usunięciem zadania.
- **Props:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onConfirm: () => Promise<void>`
  - `taskName: string`
- **Interakcje:**
  - Potwierdzenie wywołuje API `DELETE`.

### `RecurrenceInputs` (Współdzielony)
- Wykorzystany ponownie z formularza tworzenia zadania (Value Input + Unit Select).

## 5. Typy

### ViewModel (Form Schema - Edycja)
Wykorzystanie istniejącego `editTaskSchema`.

### DTO
Wykorzystanie istniejących typów:
- `UpdateTaskRecurrenceCommand` (payload do PATCH).
- `TaskDto` (obiekt zadania).

## 6. Zarządzanie stanem

### W komponencie rodzica (`SpaceDetailsContainer`)
- `editingTask: TaskDto | null`: Przechowuje zadanie aktualnie edytowane. Jeśli `null`, modal edycji jest zamknięty.
- `deletingTask: TaskDto | null`: Przechowuje zadanie do usunięcia. Jeśli `null`, dialog potwierdzenia jest zamknięty.

### W modalu edycji (`EditTaskRecurrenceModal`)
- `useForm<EditTaskFormValues>`: Zarządza stanem pól formularza.
- `useUpdateTask` (Mutation): Zarządza stanem żądania API (`isPending`, `error`).

## 7. Integracja API

### Edycja zadania
- **Endpoint:** `PATCH /api/tasks/{taskId}`
- **Payload:** `{ recurrence_value: number, recurrence_unit: string }`
- **Response:** `200 OK` (zaktualizowane zadanie).
- **Efekt:** Inwalidacja cache listy zadań (`['tasks', spaceId]`), zamknięcie modala, toast "Zadanie zaktualizowane".

### Usuwanie zadania
- **Endpoint:** `DELETE /api/tasks/{taskId}`
- **Response:** `204 No Content`.
- **Efekt:** Inwalidacja cache listy zadań, zamknięcie dialogu, toast "Zadanie usunięte".

## 8. Interakcje użytkownika

### Scenariusz: Edycja
1. Użytkownik klika przycisk "Edytuj".
2. Otwiera się modal `EditTaskRecurrenceModal`.
3. Użytkownik widzi nazwę zadania (nieedytowalną) oraz pola cykliczności.
4. Zmienia "co 3 dni" na "co 1 tydzień" (7 dni).
5. Klika "Zapisz".
6. Przycisk zmienia stan na ładowanie.
7. Po sukcesie modal znika, a na liście widać zaktualizowane dane (np. nowa data wykonania). Pokazuje się komunikat, że zadanie zostało zaktualizowane.

### Scenariusz: Usuwanie
1. Użytkownik klika przycisk "Usuń".
2. Otwiera się dialog z pytaniem "Czy na pewno chcesz usunąć zadanie 'Odkurzanie'?".
3. Użytkownik klika "Usuń".
4. Przycisk zmienia stan na ładowanie.
5. Po sukcesie dialog znika, zadanie znika z listy. Pokazuje się komunikat, że zadanie zostało usunięte.

## 9. Warunki i walidacja

- **Edycja:** Nie można zapisać formularza z pustą lub ujemną wartością cyklu.
- **Spójność:** Jeśli API zwróci błąd, należy wyświetlić odpowiedni komunikat i odświeżyć listę.

## 10. Obsługa błędów

- **Błąd walidacji API (422):** Wyświetlenie błędu w formularzu.
- **Błąd 404:** Toast "Zadanie nie istnieje", zamknięcie modala, odświeżenie listy.
- **Błąd 500/Network:** Toast "Wystąpił błąd, spróbuj ponownie".

## 11. Kroki implementacji

1.  Stworzyć komponent `EditTaskRecurrenceModal` z użyciem `RecurrenceInputs`.
2.  Zintegrować walidację Zod w modalu edycji.
3.  Wykorzystać komponent `ConfirmDeleteSpaceDialog` do implementacji `ConfirmDeleteTaskDialog` - stworzyć generyczny komponent.
4.  Zaimplementować hooki mutacji `useUpdateTask` i `useDeleteTask` w `src/components/hooks/useTaskMutations.ts`.
5.  W `SpaceDetailsContainer` dodać stan `editingTask` i `deletingTask`.
6.  Przekazać handlery otwierające te stany do `TaskGroupingList` -> `TaskCard`.
7.  Wyrenderować modale w `SpaceDetailsContainer`, przekazując im odpowiednie propsy i funkcje zamykające (zerujące stan).

