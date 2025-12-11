# Plan implementacji komponentu wiadomości motywacyjnych

## 1. Przegląd
Komponent wyświetla wyłącznie tekst ostatniej wiadomości motywacyjnej powiązanej z zadaniem. Generacja odbywa się automatycznie, zgodnie z regułami (24h, dzień terminu/po terminie). Jeśli nie uda się pobrać/wygenenerować, komponent pokazuje fallback z przykładowym komunikatem.

## 2. Routing widoku
Brak własnego adresu URL. Komponent do osadzenia w kartach zadań.

## 3. Struktura komponentów
- `MotivationalMessageText` (root, renderuje tekst lub placeholder)
  - `MessageInlineSkeleton` (loading)
  - `MessageInlineFallback` (przykładowy komunikat gdy brak/nieudane)

## 4. Szczegóły komponentów
### MotivationalMessageText
- Opis: Pobiera najnowszą wiadomość dla taskId i renderuje tekst. Jeśli brak wiadomości lub minęło ≥24h, automatycznie wywołuje POST generate i po sukcesie renderuje nowy tekst.
- Główne elementy: kontener tekstowy, fallback przykładowy komunikat przy błędzie/braku.
- Interakcje: brak (czysto prezentacyjne). Automatyczna generacja/pobranie odbywa się w efektach.
- Walidacja: taskId musi być UUID zanim wywołamy API; logika czasu/tonu i limitów; UI tylko reaguje na 404/429/500.
- Typy: `MotivationalMessageDto`, `LatestMessageVM`, `AutoGenerateState`.
- Propsy: `{ taskId: string }`.

### MessageInlineSkeleton
- Opis: Skeleton tekstowy do stanu ładowania.
- Elementy: 1-2 paski skeleton.
- Propsy: none.

### MessageInlineFallback
- Opis: Krótki tekst zastępczy, np. “Spróbuj podejść do zadania energicznie!” lub podobny przykładowy komunikat.
- Propsy: none.

## 5. Typy
- Istniejące: `MotivationalMessageDto` (zawiera `id`, `task_id`, `message_text`, `generated_at`).
- Nowy ViewModel `LatestMessage`:
  - `text: string | null` — treść do renderu lub null przy braku.
  - Dodatkowy stan `AutoGenerateState`:
    - `isGenerating: boolean`
    - `canGenerate: boolean` — wynik heurystyki po GET (np. brak lub stale/24h+).
    - `lastTriedAt?: string`

## 6. Zarządzanie stanem
- Hook `useLatestMotivationalMessage(taskId, { enabled })`:
  - stan: `message: MotivationalMessageDto | null`, `status`, `error`.
  - efekty: GET na mount oraz przy zmianie `taskId`, ale tylko gdy `enabled` (okno generacji otwarte).
  - mapowanie do `LatestMessage` (status + tekst).
- Hook `useAutoGenerateMotivationalMessage(taskId)`:
  - po wynikach GET decyduje, czy wykonać POST (gdy brak wiadomości lub `generated_at` starsze niż 24h, reguły generowania); zawiera `isGenerating`, `error`.
  - po POST refetch GET aby pobrać świeży tekst.
  - `enabled` blokuje całkowicie POST/GET poza oknem generacji (tylko w dzień terminu lub po terminie).

## 7. Integracja API
- GET `/api/tasks/{taskId}/motivational-messages/latest`
  - Parametr: `taskId` (UUID).
  - Odpowiedzi: 200 → render tekst; 404 → stan `empty`; 401/500 → stan `error` (opcjonalnie nic nie renderuj poza placeholderem).
  - Jeśli 404/empty → hook `useAutoGenerateMotivationalMessage` podejmie próbę POST (o ile dozwolone).
- POST `/api/tasks/{taskId}/motivational-messages/generate`
  - Body: `{ task_name, tone, max_length: 150 }`.
  - Wywoływany automatycznie w hooku, bez UI. Po sukcesie → refetch GET.
  - Wywoływany tylko w oknie generacji (dzień terminu lub po terminie).

## 8. Interakcje użytkownika
- Brak interakcji. Komponent wyświetla tekst; w razie błędu lub braku danych pokazuje fallbackowy komunikat przykładowy. Generacja dzieje się automatycznie w tle.

## 9. Warunki i walidacja
- `taskId` musi być poprawnym UUID zanim zostanie użyty w fetchu.
- Jeśli `message_text` pusta/null (nie powinno się zdarzyć przy 200) → potraktuj jako `empty` i pokaż placeholder.
- Pozostałe warunki biznesowe (24h, 3 odłożenia, ton zależny od etapu); komponent obsługuje logikę oraz próbuje wykonać POST, gdy GET zwraca brak/stare dane.

## 10. Obsługa błędów
- 404 → automatyczna próba POST; jeśli nadal brak/niepowodzenie → fallbackowy przykładowy komunikat (tylko w oknie generacji).
- 401/500 → pokaż fallbackowy przykładowy komunikat.
- 429 → nie ponawiaj POST do czasu odczekania; pokaż fallback.
- Network error → status `error`, fallback; log do console/telemetry (bez UI).

## 11. Kroki implementacji
1) Utworzyć komponent `MotivationalMessageText` w `src/components/motivational/MotivationalMessageText.tsx`.
2) Dodać hook `useLatestMotivationalMessage` w `src/lib/hooks/useLatestMotivationalMessage.ts` z GET do endpointu latest; mapować do `LatestMessage`.
3) Dodać hook `useAutoGenerateMotivationalMessage` w `src/lib/hooks/useAutoGenerateMotivationalMessage.ts` (wykrywa brak/starość, robi POST, refetch GET).
4) Dodać proste skeletony/placeholdery w `src/components/motivational/MessageInlineSkeleton.tsx` i `MessageInlineFallback.tsx` lub jako warianty w jednym pliku.
5) W miejscach użycia (karta zadania, szczegóły) wpiąć komponent z `taskId`.
