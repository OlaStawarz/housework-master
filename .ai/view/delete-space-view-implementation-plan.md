# Plan implementacji widoku usuwania przestrzeni (Dialog)

## 1. Przegląd
Funkcjonalność usuwania przestrzeni realizowana jest poprzez modalny dialog potwierdzenia (`ConfirmDeleteSpaceDialog`). Jest to operacja krytyczna (destrukcyjna), dostępna z poziomu nagłówka szczegółów przestrzeni. Wymaga wyraźnego potwierdzenia od użytkownika, ponieważ usuwa nie tylko przestrzeń, ale kaskadowo wszystkie powiązane z nią zadania.

## 2. Routing widoku
Funkcjonalność nie posiada własnego adresu URL. Jest częścią widoku szczegółów przestrzeni:
- **Rodzic:** `src/pages/spaces/[spaceId].astro` -> `SpaceDetailsContainer`.

## 3. Struktura komponentów

```text
ConfirmDeleteSpaceDialog (AlertDialog)
├── AlertDialogContent
│   ├── AlertDialogHeader
│   │   ├── AlertDialogTitle
│   │   └── AlertDialogDescription
│   └── AlertDialogFooter
│       ├── AlertDialogCancel ("Anuluj")
│       └── AlertDialogAction ("Usuń" - wariant destructive)
```

## 4. Szczegóły komponentów

### `ConfirmDeleteSpaceDialog`
- **Opis:** Komponent dialogowy (oparty na `AlertDialog` z Shadcn UI) służący do potwierdzenia intencji usunięcia przestrzeni.
- **Główne elementy:**
  - Tytuł ostrzegawczy.
  - Opis konsekwencji (usunięcie zadań).
  - Przyciski akcji (Anuluj / Usuń).
- **Obsługiwane interakcje:**
  - Kliknięcie "Anuluj" -> zamyka dialog bez akcji.
  - Kliknięcie "Usuń" -> wywołuje funkcję `onConfirm` i wchodzi w stan ładowania (jeśli obsługiwany przez komponent UI) lub rodzic zarządza stanem.
- **Propsy:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onConfirm: () => Promise<void>`
  - `spaceName: string` (do wyświetlenia w komunikacie)
  - `isDeleting: boolean` (do zablokowania przycisku i pokazania spinnera)

## 5. Typy

Brak dodatkowych typów DTO (operacja DELETE nie przyjmuje ani nie zwraca body danych biznesowych).

## 6. Zarządzanie stanem

Stan zarządzany jest w komponencie nadrzędnym (`SpaceDetailsContainer`):
- `isDeleteModalOpen`: boolean - steruje widocznością dialogu.
- `isDeletingSpace`: boolean - steruje stanem loading przycisku w dialogu podczas trwania żądania API.

## 7. Integracja API

### Żądanie
- **Metoda:** `DELETE`
- **URL:** `/api/spaces/{spaceId}`
- **Nagłówki:** `Authorization: Bearer <token>`

### Odpowiedź
- **Sukces:** `204 No Content` (brak treści).
- **Błędy:** `404 Not Found`, `500 Internal Server Error`.

## 8. Interakcje użytkownika

1.  Użytkownik klika przycisk "Usuń przestrzeń" (ikona kosza) w nagłówku widoku przestrzeni.
2.  Otwiera się `ConfirmDeleteSpaceDialog` z pytaniem: "Czy na pewno chcesz usunąć przestrzeń **[Nazwa]**? Zostaną również usunięte wszystkie przypisane do niej zadania."
3.  Użytkownik klika "Usuń".
4.  Przycisk zmienia stan na ładowanie (disabled + spinner).
5.  Aplikacja wysyła żądanie `DELETE`.
6.  Po sukcesie (204):
    - Dialog się zamyka.
    - Wyświetlany jest toast: "Przestrzeń została usunięta".
    - Następuje przekierowanie (nawigacja) do listy przestrzeni (`/spaces`).

## 9. Warunki i walidacja

- **Nieodwracalność:** Komunikat musi jasno informować o kaskadowym usunięciu zadań.
- **Blokada:** Podczas trwania żądania API interakcja z dialogiem jest zablokowana.

## 10. Obsługa błędów

- **Błąd API (500/Sieć):**
  - Dialog pozostaje otwarty.
  - Wyświetlany jest toast: "Wystąpił błąd podczas usuwania przestrzeni. Spróbuj ponownie."
  - Stan `isDeletingSpace` wraca do `false`.
- **Błąd 404 (Przestrzeń nie istnieje):**
  - Traktowany jako "sukces" (zasób i tak nie istnieje).
  - Przekierowanie do `/spaces`.

## 11. Kroki implementacji

1.  Stworzyć komponent `ConfirmDeleteSpaceDialog` w oparciu o `AlertDialog`.
2.  W `SpaceDetailsContainer` (lub hooku `useSpaceMutations`) dodać funkcję `deleteSpace`, która:
    - Ustawia `isDeletingSpace = true`.
    - Wywołuje `fetch('/api/spaces/' + spaceId, { method: 'DELETE' })`.
    - Obsługuje response (ok -> redirect, error -> toast).
    - W bloku `finally` ustawia `isDeletingSpace = false`.
3.  Podpiąć otwarcie dialogu pod przycisk w `SpaceHeader`.
4.  Przekazać odpowiednie propsy i handlery do dialogu.
