# Dokument wymagań produktu (PRD) - Housework Master

## 1. Przegląd produktu

Housework Master to aplikacja, której celem jest pomoc użytkownikom w regularnym wykonywaniu obowiązków domowych. Aplikacja umożliwia definiowanie cyklicznych zadań, grupowanie ich w przestrzenie (pomieszczenia), a także dostarcza motywacji do ich wykonania poprzez kontekstowe komunikaty generowane przez AI. Głównym założeniem jest prostota i skupienie na kluczowych funkcjonalnościach, które rozwiązują problem zapominania o rzadziej wykonywanych pracach i braku motywacji.

## 2. Problem użytkownika

Użytkownicy napotykają dwa główne problemy związane z prowadzeniem gospodarstwa domowego:

- **Trudność w śledzeniu i zapamiętywaniu terminów wykonania obowiązków**, które nie są realizowane codziennie (np. wymiana pościeli, czyszczenie piekarnika). Prowadzi to do nieregularności i zaniedbań.

- **Brak motywacji do rozpoczynania i kończenia mniej przyjemnych lub czasochłonnych zadań domowych**, co powoduje prokrastynację.

Aplikacja ma na celu rozwiązanie tych problemów poprzez stworzenie prostego systemu do zarządzania zadaniami cyklicznymi oraz zintegrowanie mechanizmu motywacyjnego.

## 3. Wymagania funkcjonalne

### Zarządzanie kontem użytkownika

- Użytkownik musi mieć możliwość utworzenia konta za pomocą adresu e-mail i hasła.
- Użytkownik musi mieć możliwość zalogowania się na swoje konto.
- Użytkownik musi mieć możliwość wylogowania się ze swojego konta.
- Użytkownik musi mieć możliwość usunięcia konta i powiązanych przestrzeni wraz ze zdefiniowanymi obowiązkami.

### Zarządzanie przestrzeniami

- Użytkownik może tworzyć przestrzenie do grupowania zadań (np. "Kuchnia", "Łazienka").
- Użytkownik może przeglądać listę swoich przestrzeni.
- Użytkownik może usunąć przestrzeń, co powoduje usunięcie wszystkich przypisanych do niej zadań.

### Zarządzanie zadaniami

- Użytkownik może dodawać zadania, korzystając z predefiniowanych szablonów dla danej przestrzeni.
- Użytkownik może tworzyć własne, niestandardowe zadania za pomocą dedykowanego formularza.
- Formularz tworzenia zadania zawiera pola: Nazwa, Przestrzeń, Liczba (dla cykliczności), Jednostka czasu (dni/miesiące).
- Użytkownik może oznaczyć zadanie jako "wykonane".
- Użytkownik może usunąć zadanie.
- Użytkownik może edytować cykliczność istniejącego zadania. Nazwa zadania jest niezmienna po jego utworzeniu.

### Widok zadań i nawigacja

- Główny ekran aplikacji (Dashboard) wyświetla zagregowaną listę zadań ze wszystkich przestrzeni.
- Lista na ekranie głównym jest podzielona na dwie sekcje: "Przeterminowane" i "Zbliżające się".
- Obie listy są sortowane chronologicznie (od najstarszego do najnowszego).
- Użytkownik może wejść do konkretnej przestrzeni, aby zobaczyć listę zadań tylko z tej grupy.
- Przy każdym zadaniu na liście wyświetlana jest liczba dni, jaka pozostała do terminu wykonania (lub minęła od terminu).

### System motywacyjny

- Aplikacja wykorzystuje AI do generowania kontekstowych komunikatów motywacyjnych na podstawie nazwy zadania.
- Komunikaty motywacyjne są wyświetlane w aplikacji przy zadaniach, których termin wykonania się zbliża lub został przekroczony.
- Po oznaczeniu zadania jako wykonane, użytkownik otrzymuje prosty, pozytywny komunikat zwrotny (np. "Świetna robota!").

### Odkładanie zadań

- Użytkownik ma możliwość odroczenia terminu wykonania zadania o 24 godziny za pomocą przycisku "Zrobię to jutro".
- Opcja "Zrobię to jutro" może być użyta maksymalnie 3 razy z rzędu dla jednego cyklu zadania.

## 4. Granice produktu

### W zakresie MVP

- Rejestracja i logowanie za pomocą e-maila i hasła.
- Tworzenie, przeglądanie i usuwanie przestrzeni.
- Tworzenie zadań z szablonów i ręcznie.
- Edycja cykliczności zadań.
- Oznaczanie zadań jako wykonane i ich usuwanie.
- Zagregowany widok główny oraz widok per przestrzeń.
- Funkcja odkładania zadania na później ("Zrobię to jutro") z limitem użycia.
- Generowanie motywacyjnych komunikatów na podstawie nazwy zadania.

### Poza zakresem MVP

- Logowanie za pośrednictwem kont społecznościowych (Google, Apple itp.).
- Współdzielenie przestrzeni i zadań między użytkownikami.
- Zaawansowana gamifikacja, punkty, odznaki, rankingi.
- Obsługa multimediów (np. dodawanie zdjęć posprzątanych miejsc).
- Widok kalendarza.
- Powiadomienia push.
- Jakiekolwiek formy monetyzacji.
- Mechanizm zbierania opinii od użytkowników w aplikacji.
- Samouczek (onboarding).

## 5. Historyjki użytkowników

### Zarządzanie kontem i bezpieczeństwo

#### US-001: Rejestracja nowego użytkownika

**Opis:** Jako nowy użytkownik, chcę móc założyć konto za pomocą mojego adresu e-mail i hasła, abym mógł zacząć korzystać z aplikacji i zapisywać swoje zadania.

**Kryteria akceptacji:**
- Formularz rejestracji zawiera pola: adres e-mail, hasło, powtórz hasło.
- System waliduje poprawność formatu adresu e-mail.
- System sprawdza, czy hasła w obu polach są identyczne.
- Po pomyślnej rejestracji użytkownik jest automatycznie logowany i przekierowywany do ekranu głównego aplikacji.
- W przypadku, gdy konto o podanym adresie e-mail już istnieje, wyświetlany jest odpowiedni komunikat błędu.

#### US-002: Logowanie do aplikacji

**Opis:** Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego e-maila i hasła, aby uzyskać dostęp do moich przestrzeni i zadań.

**Kryteria akceptacji:**
- Formularz logowania zawiera pola: adres e-mail, hasło.
- Po poprawnym wprowadzeniu danych i kliknięciu "Zaloguj", użytkownik jest przenoszony na ekran główny.
- W przypadku wprowadzenia błędnego e-maila lub hasła, użytkownik widzi stosowny komunikat o błędzie.

#### US-003: Wylogowanie z aplikacji

**Opis:** Jako użytkownik, chcę mieć możliwość wylogowania się z mojego konta, aby zabezpieczyć dostęp do moich danych na współdzielonym urządzeniu.

**Kryteria akceptacji:**
- W aplikacji (np. w menu lub ustawieniach) znajduje się wyraźnie oznaczony przycisk "Wyloguj".
- Po kliknięciu przycisku użytkownik jest wylogowywany i przenoszony do ekranu logowania.
- Sesja użytkownika zostaje zakończona i ponowny dostęp do danych wymaga zalogowania.

#### US-004: Usunięcie konta

**Opis:** Jako użytkownik, chcę mieć możliwość trwałego usunięcia mojego konta i wszystkich moich danych, gdy zdecyduję się przestać korzystać z aplikacji.

**Kryteria akceptacji:**
- W ustawieniach konta dostępna jest opcja "Usuń konto".
- Po kliknięciu opcji, system wyświetla prośbę o potwierdzenie decyzji, informując, że jest ona nieodwracalna.
- Po potwierdzeniu, konto użytkownika oraz wszystkie powiązane z nim dane (przestrzenie, zadania) są trwale usuwane z systemu.
- Użytkownik jest automatycznie wylogowywany z aplikacji.

### Onboarding

#### US-005: Pierwsze uruchomienie aplikacji

**Opis:** Jako nowy, zalogowany użytkownik, po pierwszym uruchomieniu aplikacji chcę zobaczyć pusty ekran główny z wyraźnym wezwaniem do działania, abym wiedział, jak zacząć.

**Kryteria akceptacji:**
- Ekran główny dla nowego użytkownika nie zawiera żadnych zadań ani przestrzeni.
- Na ekranie widoczny jest przycisk lub link z tekstem "Stwórz swoją pierwszą przestrzeń".
- Kliknięcie przycisku przenosi użytkownika do formularza tworzenia nowej przestrzeni.

### Zarządzanie przestrzeniami i zadaniami

#### US-006: Tworzenie nowej przestrzeni

**Opis:** Jako użytkownik, chcę móc stworzyć nową przestrzeń (np. "Sypialnia"), aby logicznie pogrupować związane z nią obowiązki.

**Kryteria akceptacji:**
- Dostępny jest formularz do tworzenia przestrzeni, który wymaga podania jej nazwy.
- Po zatwierdzeniu nazwy, nowa przestrzeń jest tworzona i użytkownik jest pytany, czy chce dodać zadania z szablonu, czy stworzyć własne.

#### US-007: Usuwanie przestrzeni

**Opis:** Jako użytkownik, chcę mieć możliwość usunięcia całej przestrzeni (np. "Garaż") wraz ze wszystkimi jej zadaniami, gdy nie jest mi już potrzebna.

**Kryteria akceptacji:**
- W widoku listy przestrzeni lub w ustawieniach danej przestrzeni, dostępna jest opcja "Usuń".
- System wyświetla ostrzeżenie, że usunięcie przestrzeni spowoduje również usunięcie wszystkich przypisanych do niej zadań.
- System wymaga potwierdzenia tej operacji.
- Po potwierdzeniu, przestrzeń i wszystkie jej zadania są trwale usuwane.

#### US-008: Dodawanie zadań z szablonu

**Opis:** Jako użytkownik, po stworzeniu przestrzeni chcę mieć możliwość szybkiego dodania typowych dla niej zadań z gotowego szablonu, aby zaoszczędzić czas.

**Kryteria akceptacji:**
- Po stworzeniu przestrzeni (np. "Kuchnia"), aplikacja proponuje listę zadań z szablonu (np. "Wyrzucenie śmieci", "Umycie podłogi").
- Użytkownik może zaznaczyć, które zadania z szablonu chce dodać.
- Dla każdego wybranego zadania z szablonu ustawiona jest domyślna cykliczność, którą użytkownik może od razu edytować.
- Po zatwierdzeniu, wybrane zadania są dodawane do danej przestrzeni.

#### US-009: Tworzenie własnego zadania

**Opis:** Jako użytkownik, chcę móc zdefiniować własne, niestandardowe zadanie cykliczne, aby dostosować aplikację do moich specyficznych potrzeb (np. "Podlewanie kwiatów").

**Kryteria akceptacji:**
- Formularz tworzenia zadania zawiera pola tekstowe na nazwę zadania i liczbowe na cykliczność.
- Użytkownik może wybrać jednostkę cykliczności: "dni" lub "miesiące".
- Użytkownik musi przypisać zadanie do istniejącej przestrzeni.
- Po wypełnieniu i zatwierdzeniu formularza, zadanie jest dodawane do wybranej przestrzeni, a jego pierwszy termin wykonania jest obliczany na podstawie podanej cykliczności.

#### US-010: Usuwanie zadania

**Opis:** Jako użytkownik, chcę mieć możliwość usunięcia zadania, którego już nie potrzebuję śledzić.

**Kryteria akceptacji:**
- W widoku zadania lub poprzez gest (np. swipe) na liście, dostępna jest opcja "Usuń".
- System prosi o potwierdzenie chęci usunięcia zadania.
- Po potwierdzeniu, zadanie jest trwale usuwane z aplikacji.

#### US-011: Edycja cykliczności zadania

**Opis:** Jako użytkownik, chcę mieć możliwość zmiany cykliczności istniejącego zadania, ponieważ moje potrzeby mogły się zmienić.

**Kryteria akceptacji:**
- W szczegółach zadania dostępna jest opcja "Edytuj".
- Po jej wybraniu, użytkownik może zmienić wartość liczbową i jednostkę czasu (dni/miesiące) dla cykliczności.
- Zmiana nazwy zadania nie jest możliwa.
- Po zatwierdzeniu zmian, kolejny termin wykonania zadania jest przeliczany zgodnie z nową cyklicznością.

#### US-012: Przeglądanie zadań na ekranie głównym

**Opis:** Jako użytkownik, chcę widzieć na ekranie głównym listę wszystkich moich zadań posortowaną według terminu, abym mógł szybko zorientować się, co jest najpilniejsze.

**Kryteria akceptacji:**
- Ekran główny zawiera dwie listy: "Przeterminowane" i "Zbliżające się".
- Na liście "Przeterminowane" znajdują się zadania, których termin minął, posortowane od najdłużej zaległego.
- Na liście "Zbliżające się" znajdują się zadania, których termin wkrótce nadejdzie, posortowane od najpilniejszego.
- Każdy element listy zawiera: nazwę zadania, nazwę przestrzeni oraz informację o terminie (np. "Zostały 2 dni", "Po terminie 5 dni").

#### US-013: Przeglądanie zadań w konkretnej przestrzeni

**Opis:** Jako użytkownik, chcę móc wejść do wybranej przestrzeni (np. "Kuchnia"), aby zobaczyć listę zadań przypisanych tylko do niej.

**Kryteria akceptacji:**
- Na ekranie głównym lub w menu nawigacyjnym znajduje się lista stworzonych przeze mnie przestrzeni.
- Kliknięcie na nazwę przestrzeni przenosi mnie do dedykowanego widoku tej przestrzeni.
- Widok przestrzeni wyświetla listę wszystkich zadań do niej przypisanych, posortowaną chronologicznie.
- Z tego widoku mogę zarządzać zadaniami (np. oznaczać jako wykonane).

#### US-014: Oznaczanie zadania jako wykonane

**Opis:** Jako użytkownik, chcę móc łatwo oznaczyć zadanie jako wykonane, aby zaktualizować jego status i poczuć satysfakcję.

**Kryteria akceptacji:**
- Przy każdym zadaniu na liście znajduje się interaktywny element (np. checkbox) do oznaczenia go jako wykonanego.
- Po oznaczeniu zadania, znika ono z listy zadań do wykonania.
- Na ekranie pojawia się krótki komunikat zwrotny (np. "Zrobione!").
- Nowy termin wykonania zadania jest automatycznie obliczany na podstawie jego cykliczności i daty wykonania.

#### US-015: Odkładanie zadania

**Opis:** Jako użytkownik, gdy nie mam czasu wykonać zadania w terminie, chcę mieć możliwość odłożenia go o jeden dzień, aby nie widniało jako przeterminowane.

**Kryteria akceptacji:**
- Przy każdym zadaniu dostępny jest przycisk "Zrobię to jutro".
- Po kliknięciu przycisku, termin wykonania zadania jest przesuwany o 24 godziny.
- Licznik użyć tej opcji dla danego cyklu zadania jest inkrementowany.

#### US-016: Zablokowana opcja odkładania zadania

**Opis:** Jako użytkownik, który już trzykrotnie odłożył zadanie, chcę zobaczyć, że opcja "Zrobię to jutro" jest niedostępna, abym zrozumiał, że muszę podjąć działanie.

**Kryteria akceptacji:**
- Po trzecim z rzędu użyciu przycisku "Zrobię to jutro" dla danego zadania, przycisk ten staje się nieaktywny (np. wyszarzony).
- Po wykonaniu zadania (lub po rozpoczęciu nowego cyklu), licznik użyć jest resetowany, a przycisk znów staje się aktywny.

#### US-017: Otrzymywanie komunikatu motywacyjnego

**Opis:** Jako użytkownik, chcę zobaczyć motywujący komunikat przy zadaniu, którego termin się zbliża lub minął, aby zachęciło mnie to do działania.

**Kryteria akceptacji:**
- Przy zadaniach przeterminowanych i zbliżających się (np. na 2 dni przed terminem) wyświetlany jest dodatkowy tekst.
- Tekst jest generowany przez AI i jest kontekstowo powiązany z nazwą zadania (np. dla "Odkurzanie" może to być "Pokaż kurzowi, kto tu rządzi!").

## 6. Metryki sukcesu

Sukces MVP będzie mierzony za pomocą następujących wskaźników:

### MS-01: Adopcja kluczowej funkcji

**Metryka:** 90% nowo zarejestrowanych użytkowników definiuje co najmniej jedną własną przestrzeń w ciągu pierwszych 7 dni od rejestracji.

**Sposób pomiaru:** Analiza zdarzeń w aplikacji. Stosunek liczby nowych użytkowników, którzy stworzyli co najmniej jedną przestrzeń, do całkowitej liczby nowych użytkowników w danym okresie.

### MS-02: Zaangażowanie i retencja

**Metryka:** 75% aktywnych użytkowników regularnie wykonuje swoje zadania. "Regularne wykonywanie" definiuje się jako oznaczanie zadań jako wykonanych lub używanie opcji "Zrobię to jutro" w ciągu 72 godzin od pierwotnego terminu zadania.

**Sposób pomiaru:** Analiza kohortowa. Dla zadań, które osiągnęły termin wykonania, sprawdzamy, jaki procent został zamknięty (wykonany lub odłożony) w ciągu 3 dni.

### MS-03: Skuteczność szablonów

**Metryka:** 90% użytkowników definiuje swoje przestrzenie, korzystając z kombinacji szablonów i dodawania własnych zadań.

**Sposób pomiaru:** Analiza zdarzeń. Mierzenie, ilu użytkowników tworzących przestrzenie korzysta zarówno z opcji "dodaj z szablonu", jak i "dodaj własne zadanie".