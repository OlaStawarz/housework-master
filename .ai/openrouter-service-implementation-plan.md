# OpenRouter Service Implementation Plan

## 1. Opis usługi
Usługa OpenRouter integruje komunikację z modelem LLM poprzez API OpenRouter. Działa jako bezstanowy serwis (Stateless Service), umożliwiający generowanie odpowiedzi tekstowych oraz ściśle typowanych struktur JSON (Structured Outputs) w bezpieczny i przewidywalny sposób.

## 2. Opis konstruktora
Konstruktor usługi powinien:
- Inicjować konfigurację API (pobierać `OPENROUTER_API_KEY` i `PUBLIC_SITE_URL` ze zmiennych środowiskowych).
- Ustawiać domyślny model (np. zdefiniowany w `.env` lub stałej).
- Walidować obecność kluczy API przy starcie (Fail-fast).

## 3. Publiczne metody i pola

Główne elementy interfejsu publicznego:

- **getChatCompletion(messages: Message[], options?: CompletionOptions): Promise<string>**
  - Podstawowa metoda do rozmowy.
  - `messages`: Tablica obiektów `{ role, content }`.
  - `options`: Opcjonalne nadpisanie modelu, temperatury itp.
  - Zwraca czysty tekst odpowiedzi.

- **getStructuredCompletion<T>(messages: Message[], schema: JSONSchema, options?: CompletionOptions): Promise<T>**
  - Metoda generyczna `<T>` do zwracania obiektów JSON.
  - Wymusza `response_format` w API OpenRouter.
  - Parsuje odpowiedź JSON i (opcjonalnie) waliduje ją względem schematu.
  - Zwraca obiekt typu `T`.

- Publiczne pola (read-only): `defaultModel`.

## 4. Prywatne metody i pola

Kluczowe komponenty wewnętrzne:

- **headers: Record<string, string>**
  - Getter zwracający nagłówki z autoryzacją oraz `HTTP-Referer` i `X-Title`.

- **performRequest(payload: unknown): Promise<any>**
  - Wraper na `fetch`.
  - Obsługuje logikę retry (ponawiania) i timeoutów.
  - Obsługuje kody błędów HTTP (4xx, 5xx) i rzuca odpowiednie wyjątki.

## 5. Obsługa błędów

Klasa `OpenRouterError` obsługująca scenariusze:
- `API_KEY_MISSING`: Brak konfiguracji.
- `NETWORK_ERROR`: Problemy z połączeniem (fetch failed).
- `API_ERROR`: Błędy zwrócone przez OpenRouter (np. Rate Limit, Context Window Exceeded).
- `INVALID_JSON`: Model zwrócił tekst, który nie jest poprawnym JSON-em (w przypadku `getStructuredCompletion`).

## 6. Względy bezpieczeństwa
- Klucz API dostępny tylko po stronie serwera (`import.meta.env` w Astro).
- Brak logowania pełnej treści promptów w środowisku produkcyjnym (RODO/Prywatność).
- Strict Mode w JSON Schema, aby zapobiec "halucynowaniu" pól przez model.

## 7. Plan implementacji krok po kroku

1. **Setup**: Instalacja `zod` (do schematów) i konfiguracja zmiennych `.env`.
2. **Core Service**: Implementacja klasy `OpenRouterService` z metodą `performRequest` i obsługą błędów.
3. **Chat Method**: Implementacja `getChatCompletion` obsługującej standardowy strumień wiadomości.
4. **Structured Output**: Implementacja `getStructuredCompletion` z wykorzystaniem parametru `response_format` (JSON Schema).
5. **Integracja**: Stworzenie endpointu API w Astro wykorzystującego serwis.