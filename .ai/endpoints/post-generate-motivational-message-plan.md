# API Endpoint Implementation Plan: Generate Motivational Message

## 1. Przegląd punktu końcowego

Endpoint odpowiada za generowanie spersonalizowanych wiadomości motywacyjnych dla zadań przy użyciu sztucznej inteligencji (OpenRouter API). Wygenerowana wiadomość jest zapisywana w bazie danych i zwracana klientowi.

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/tasks/[taskId]/motivational-messages/generate`
- **Parametry:**
  - **Wymagane (Path):**
    - `taskId` (UUID): Unikalny identyfikator zadania.
- **Request Body (JSON):**
  Wymagane, zgodne z typem `GenerateMotivationalMessageCommand`:
  ```json
  {
    "task_name": "Odkurzanie salonu",
    "tone": "encouraging",
    "max_length": 150
  }
  ```

  - `tone`: Jedna z wartości: `'encouraging' | 'playful' | 'neutral'`.
  - `max_length`: Maksymalna długość odpowiedzi (domyślnie/max 150).

## 3. Wykorzystywane typy

- **DTO & Commands:**
  - `GenerateMotivationalMessageCommand` (`src/types.ts`) - struktura wejściowa.
  - `MotivationalMessageDto` (`src/types.ts`) - struktura wyjściowa.
- **Zmienne środowiskowe:**
  - `OPENROUTER_API_KEY` - klucz do komunikacji z LLM.
  - `SITE_URL` - (opcjonalnie) dla nagłówków OpenRouter (referer).

## 3. Szczegóły odpowiedzi

- **Kod statusu 201 (Created):**
  Pomyślnie wygenerowano i zapisano wiadomość.

  ```json
  {
    "id": "uuid",
    "task_id": "uuid",
    "message_text": "Dasz radę! Czysty salon to czysty umysł!",
    "generated_at": "2023-10-27T10:00:05Z"
  }
  ```

- **Kod statusu 429 (Too Many Requests):**
  Przekroczono limit zapytań do API AI.

## 4. Przepływ danych

1.  **Endpoint:** Odbiera żądanie, waliduje sesję użytkownika oraz poprawność danych wejściowych (Zod).
2.  **Service Layer (`MotivationalMessageService`):**
    - **Weryfikacja:** Sprawdza w bazie danych, czy zadanie o podanym `taskId` istnieje i należy do `userId`. Jeśli nie -> Błąd 404 (zapobiega generowaniu kosztów dla nieistniejących zasobów).
    - **Przygotowanie Promptu:** Tworzy prompt dla modelu AI uwzględniając nazwę zadania i ton.
    - **Call AI:** Wysyła żądanie do OpenRouter API.
    - **Przetwarzanie:** Odbiera odpowiedź, przycina tekst do 150 znaków (jeśli AI przekroczyło limit).
    - **Persystencja:** Zapisuje nową wiadomość w tabeli `motivational_messages` za pomocą klienta Supabase.
3.  **Database:** Zapisuje rekord. Trigger lub default ustawia `generated_at`.
4.  **Endpoint:** Zwraca zapisany obiekt jako JSON (201).

## 5. Względy bezpieczeństwa

- **API Keys:** Klucz `OPENROUTER_API_KEY` musi być bezpiecznie przechowywany w zmiennych środowiskowych (server-side only). Nie może wyciec do klienta.
- **Autoryzacja:** Bezwzględna weryfikacja własności zadania przed wywołaniem zewnętrznego API.
- **Sanityzacja AI:** Mimo że to wiadomość motywacyjna, warto upewnić się, że prompt systemowy instruuje AI o braku wulgaryzmów (safety constraints).

## 6. Obsługa błędów

| Scenariusz                                             | Kod HTTP | Komunikat/Akcja                                    |
| :----------------------------------------------------- | :------- | :------------------------------------------------- |
| Nieprawidłowe dane wejściowe (np. brak nazwy, zły ton) | 400      | "Invalid request data"                             |
| Brak autoryzacji                                       | 401      | "Unauthorized"                                     |
| Zadanie nie znalezione (lub brak dostępu)              | 404      | "Task not found"                                   |
| Limit zapytań AI wyczerpany (OpenRouter 429)           | 429      | "AI service rate limit exceeded. Try again later." |
| Błąd wewnętrzny (OpenRouter down, błąd DB)             | 500      | "Internal Server Error"                            |

## 7. Rozważania dotyczące wydajności

- **Latency:** Wywołanie LLM może trwać od 1 do 3 sekund. Endpoint jest asynchroniczny, klient musi oczekiwać na odpowiedź.
- **Timeout:** Należy ustawić rozsądny timeout dla żądania `fetch` do OpenRouter (np. 10s), aby nie blokować serwera w nieskończoność.
- **Koszt:** Każde wywołanie kosztuje. Weryfikacja zadania (krok 2 w przepływie danych) jest kluczowa dla optymalizacji kosztów.

## 8. Etapy wdrożenia

1.  **Konfiguracja Środowiska:**
    - Dodać `OPENROUTER_API_KEY` do pliku `.env`.
    - Dodać definicję w `src/env.d.ts` (jeśli używane jest typowanie env w Astro).

2.  **Rozszerzenie Serwisu (`MotivationalMessageService`):**
    - Dodać prywatną metodę/helper do komunikacji z OpenRouter (lub wydzielić `OpenAIService`).
    - Zaimplementować metodę `generateMessage(userId, taskId, command)`.
    - Zaimplementować logikę budowania promptu: _"Write a short [tone] motivational message for a household chore named '[task_name]'. Max 150 chars."_

3.  **Implementacja Endpointu API:**
    - Stworzyć plik `src/pages/api/tasks/[taskId]/motivational-messages/generate.ts`.
    - Zaimplementować metodę `POST`.
    - Użyć Zod do walidacji body.
    - Obsłużyć specyficzne błędy (np. 429 od AI).

4.  **Testowanie:**
    - Przetestować generowanie dla różnych tonów.
    - Zweryfikować limit znaków (150).
    - Sprawdzić zachowanie przy błędnym kluczu API (symulacja błędu 500/401 od providera).
