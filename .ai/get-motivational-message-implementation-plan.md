# Plan wdrożenia endpointu: GET /api/tasks/{taskId}/motivational-messages/latest

## 1. Przegląd punktu końcowego
Endpoint służy do pobrania najnowszej wiadomości motywacyjnej dla wskazanego zadania użytkownika.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- URL: `/api/tasks/{taskId}/motivational-messages/latest`
- Parametry:
  - Wymagane path params: `taskId` (UUID)
  - Opcjonalne: brak
- Nagłówki: `Authorization: Bearer <token>`
- Body: brak

## 3. Wykorzystywane typy
- DTO: `MotivationalMessageDto` z `src/types.ts`

## 4. Szczegóły odpowiedzi
- 200: `MotivationalMessageDto` najnowszej wiadomości `{ id, task_id, message_text, generated_at }`
- 400: błędny `taskId` (nie-UUID)
- 401: brak/niepoprawny token
- 404: zadanie nie istnieje lub brak wiadomości dla zadania
- 500: błąd serwera

## 5. Przepływ danych
1) Pobranie `supabase` z `context.locals` i walidacja przez `validateSupabaseClient`
2) Pobranie `userId` z kontekstu auth.
3) Walidacja `taskId` (Zod `uuid`)
4) Weryfikacja, że zadanie istnieje i należy do użytkownika (`tasks` filtr `id` + `user_id`)
5) Zapytanie do `motivational_messages` z `eq(task_id, taskId)`, sortowanie `generated_at` desc, `limit 1`
6) Mapowanie rekordu na `MotivationalMessageDto`
7) Zwrócenie 200 z danymi lub 404 gdy brak rekordu

## 6. Względy bezpieczeństwa
- Uwierzytelnienie: wymagany Bearer token; pozyskać userId z kontekstu (RLS Supabase + check ownership)
- Autoryzacja: weryfikacja właściciela zadania przed odczytem wiadomości
- Walidacja danych wejściowych: Zod na `taskId`; twarde kody statusów

## 7. Obsługa błędów
- 400: walidacja `taskId` (Zod), błędny JSON nie dotyczy (brak body)
- 401: brak/nieprawidłowy token → szybki zwrot
- 404: brak zadania lub brak wiadomości (rozróżnienie nieujawnione)
- 500: nieoczekiwane błędy Supabase/serwera; log `console.error`
- Logowanie do tabeli błędów: brak dedykowanej tabeli — zostawić `console.error` + miejsce na przyszłą integrację APM

## 8. Rozważania dotyczące wydajności
- Zapytanie `limit 1` z `order by generated_at desc` — minimalny transfer
- Sugerowany indeks (jeśli brak): `motivational_messages (task_id, generated_at desc)`

## 9. Etapy wdrożenia
1) Dodać w `src/lib/services/motivationalMessageService.ts` funkcję `getLatestMessage(supabase, { userId, taskId })`:
2) Utworzyć API route `src/pages/api/tasks/[taskId]/motivational-messages/latest.ts`
3) Obsługa błędów:
   - `TaskNotFoundError` lub brak wiadomości → `errorResponse(..., 404)`,
   - walidacja → `validationErrorResponse` (400),
   - pozostałe → `errorResponse('Internal server error', 500)` + `console.error`

