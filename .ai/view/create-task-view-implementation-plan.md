# Plan implementacji widoku tworzenia zadania (Modal)

## 1. Przegląd
Modal umożliwiający użytkownikowi dodanie nowego, niestandardowego zadania do wybranej przestrzeni. Jest to kluczowa funkcjonalność pozwalająca na rozszerzanie listy obowiązków poza predefiniowane szablony.

## 2. Routing widoku
Widok nie posiada dedykowanego routingu URL. Jest realizowany jako komponent modalny (`CreateTaskModal`) wyświetlany na warstwie widoku szczegółów przestrzeni (`/spaces/[spaceId]`).

## 3. Struktura komponentów
```text
CreateTaskModal (Dialog)
├── DialogHeader
│   ├── DialogTitle ("Dodaj nowe zadanie")
│   └── DialogDescription
├── CreateTaskForm (Formularz)
│   ├── FormField (Nazwa zadania - Input)
│   ├── RecurrenceInputs (Komponent wyboru cykliczności)
│   │   ├── RecurrenceValue (Input type="number")
│   │   └── RecurrenceUnit (Select: Dni/Miesiące)
│   └── DialogFooter
│       ├── Button (Anuluj)
│       └── Button (Utwórz - type="submit")
```

## 4. Szczegóły komponentów

### `CreateTaskModal`
- **Opis:** Komponent sterujący ("Smart Component") osadzony w `SpaceDetailsContainer`.
- **Przeznaczenie:** Zarządza stanem widoczności formularza i komunikacją z API.
- **Props:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `spaceId: string` (ID przestrzeni, do której dodajemy zadanie)

### `CreateTaskForm` (wewnątrz Modala)
- **Opis:** Formularz oparty o `react-hook-form` i `zod`.
- **Obsługiwane zdarzenia:**
  - `onSubmit`: Wysyłka danych do API.
- **Walidacja (Zod Schema):**
  - `name`: wymagane, min 1 znak, max 200 znaków.
  - `recurrence_value`: wymagane, liczba całkowita dodatnia (> 0).
  - `recurrence_unit`: wymagane, enum: `days` | `months`.

### `RecurrenceInputs`
- **Opis:** Komponent wielokrotnego użytku (będzie użyty też w edycji) grupujący pola cykliczności.
- **Props:**
  - Komponent powinien korzystać z kontekstu formularza (`useFormContext`) lub przyjmować `register`/`control` jako propsy, aby spójnie zarządzać stanem.
- **Elementy:**
  - Input numeryczny (min 1).
  - Select (Dni / Miesiące).

## 5. Typy

### ViewModel (Form Schema)
Wykorzystanie istniejącego `createTaskSchema` z `pages/api/task.ts`.

### DTO
Wykorzystanie `CreateTaskCommand` z `src/types.ts`:
```typescript
type CreateTaskCommand = {
  space_id: string;
  name: string;
  recurrence_value: number;
  recurrence_unit: 'days' | 'months';
}
```

## 6. Zarządzanie stanem

- **Formularz:** `useForm<CreateTaskFormValues>` zarządzający polami `name`, `recurrence_value`, `recurrence_unit`.
- **Status API:** Wykorzystanie hooka mutacji (np. `useCreateTask` z `useTaskMutations` lub bezpośrednio `useMutation` z React Query).
  - `isPending`: blokuje przycisk "Utwórz" i pokazuje spinner.
  - `error`: służy do wyświetlania globalnych błędów (np. toast).

## 7. Integracja API

- **Endpoint:** `POST /api/tasks`
- **Payload:**
  ```json
  {
    "space_id": "uuid", // przekazane z props
    "name": "Mycie okien",
    "recurrence_value": 3,
    "recurrence_unit": "months"
  }
  ```
- **Response:** `201 Created` (zwraca utworzony obiekt `TaskDto`).
- **Post-action:**
  - Inwalidacja cache dla listy zadań w danej przestrzeni (`['tasks', spaceId]`).
  - Wyświetlenie toasta "Zadanie zostało utworzone".
  - Zamknięcie modala (`onClose`).

## 8. Interakcje użytkownika

1.  Użytkownik klika przycisk "Dodaj zadanie" w widoku przestrzeni.
2.  Modal otwiera się z pustym formularzem (domyślna cykliczność np. 1 dzień).
3.  Użytkownik wpisuje nazwę zadania i ustawia cykliczność.
4.  Użytkownik klika "Utwórz".
5.  Aplikacja blokuje przycisk i pokazuje stan ładowania.
6.  Po sukcesie modal zamyka się, a nowe zadanie pojawia się na liście (dzięki inwalidacji cache).
7.  W przypadku błędu walidacji (np. pusta nazwa), formularz pokazuje komunikat błędu pod polem.

## 9. Warunki i walidacja

- **Unikalność nazwy:** Jeśli API zwróci błąd `409 Conflict`, formularz musi wyświetlić błąd pod polem "Nazwa": *"Zadanie o tej nazwie już istnieje w tej przestrzeni"*.
- **Wymagalność pól:** Przycisk "Utwórz" zadziała tylko przy poprawnie wypełnionym formularzu (obsługa `handleSubmit` z `react-hook-form`).

## 10. Obsługa błędów

- **409 Conflict:** Specjalna obsługa w `onError` mutacji - ustawienie błędu pola `name` w formularzu (`setError`).
- **400 Bad Request:** Toast "Nieprawidłowe dane".
- **500 Internal Server Error:** Toast "Wystąpił błąd serwera, spróbuj ponownie później".

## 11. Kroki implementacji

1.  Stworzyć komponent `RecurrenceInputs` (jeśli jeszcze nie istnieje).
2.  Stworzyć komponent `CreateTaskModal` z wykorzystaniem komponentów `Dialog` (Shadcn UI).
3.  Zdefiniować schemat walidacji Zod (`createTaskSchema`).
4.  Zaimplementować hooka mutacji `useCreateTask` (wrapper na `fetch POST /api/tasks`).
5.  Obsłużyć logikę `onSubmit`: wywołanie mutacji -> sukces/błąd.
6.  Obsłużyć specyficzny błąd `409` (ustawienie błędu w formularzu).
7.  Zintegrować modal z widokiem `SpaceDetailsContainer` (przekazanie `isOpen`, `onClose`, `spaceId`).

