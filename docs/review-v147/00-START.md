# Braxhorn — poprawki po niezależnym przeglądzie v147

Stan: lokalna propozycja na bazie UI v148, bez wdrożenia. Commit bazowy: `b6964bdfebc66fa7d3605592e83032a52f2ec092`. Kod walki przed zmianami: v147 `e111aff9c0db723bfeb43d486e3d97efbd86cd5a`. Data: 2026-10-18T12:45:44.238236+00:00.

Adres istniejącego podglądu: https://braxhorn-p0-preview.wawerpatryk89.chatgpt.site/ — nie zawiera tych lokalnych poprawek. Aktualnego stanu hostingu nie odpytywano ponownie: NIEWYKONANE. Produkcyjna baza nie została zmieniona.

PASS oznacza wykonanie konkretnego sprawdzenia w opisanych warunkach. Nie jest potwierdzeniem bezbłędności całej gry.

## Wynik

- Zestaw główny: 131 PASS / 0 FAIL / 0 NIEWYKONANE.
- Osobny zestaw wymagający mediów/historii: 9 PASS / 6 FAIL / 11 NIEWYKONANE. Niepowodzenia zachowano jawnie.
- Modele, klipy, animacje i tekstury: PASS porównania SHA-256, 274 plików bez zmian.
- Warianty A/B: PASS celu DPS i testu 10 s dla BEAR/DEMON. Żaden wariant nie został zapisany do produkcyjnych konfiguracji.
- Wyrzut po 3 mocnych akcjach: PASS, wszystkie 8 postaci; odejście nadal zeruje serię.
- Ranking: progi z 4800 pełnych walk z rzeczywistym AI przeciwnika, 200 na postać/poziom; migracja i moderacja przygotowane lokalnie.

## 1. Warianty balansu

Średnia odniesienia BRAX/NYXA/VEXA/KROV/DANNY: 11.014 DPS i 88.0 obrażeń w 10 s. NINA jest osobno, ponieważ nie ma gardy. Przedział celu: 9.362–12.666 DPS i 74.80–101.20 obrażeń w 10 s.

DPS = obrażenia unikalnych grup trafień podzielone przez pełny czas akcji, następnie średnia po akcjach przycisków. Test 10 s: arena 844×390, przeciwnik BRAX, naturalne podejście i powtarzanie jednej akcji, HP celu uzupełniane po trafieniu; wyrzuty i recovery pozostają aktywne. Jest to jawna, powtarzalna procedura; nie odtwarza nieudokumentowanych szczegółów pomiaru 140/150 podanego w zleceniu. Dlatego wartości przed zmianami mogą się różnić.

A zmienia wyłącznie obrażenia BEAR/DEMON. B zmienia wyłącznie tempo fazy recovery tych postaci; klatki startup/active, geometria i zawartość klipów pozostają identyczne. BEAR SHOULDER ma dodatkowe wydłużenie recovery, konieczne do osiągnięcia celu 10 s. Parametry i wszystkie operacje: `variants/A/parameters.*` oraz `variants/B/parameters.*`.

### Przed zmianami

| Postać | DPS przycisków | Recovery ms | Najlepsze 10 s | Akcja |
|---|---|---|---|---|
| BRAX | 11.59 | 589.0 | 98 | HEAVY_KICK |
| NYXA | 10.16 | 611.9 | 72 | HEAVY_PUNCH |
| VEXA | 11.55 | 590.6 | 98 | SPIN_KICK |
| KROV | 11.16 | 633.1 | 91 | UPPERCUT |
| NINA | 15.38 | 435.6 | 112 | HEAVY_PUNCH |
| DANNY | 10.62 | 542.5 | 88 | HEAVY_PUNCH |
| BEAR | 23.17 | 215.5 | 176 | SHOULDER |
| DEMON | 17.93 | 347.3 | 144 | UPPERCUT |

### A — niższe obrażenia

| Postać | DPS przycisków | Recovery ms | Najlepsze 10 s | Akcja |
|---|---|---|---|---|
| BRAX | 11.59 | 589.0 | 98 | HEAVY_KICK |
| NYXA | 10.16 | 611.9 | 72 | HEAVY_PUNCH |
| VEXA | 11.55 | 590.6 | 91 | FLYING_KICK |
| KROV | 11.16 | 633.1 | 91 | UPPERCUT |
| NINA | 15.38 | 435.6 | 112 | HEAVY_PUNCH |
| DANNY | 10.62 | 542.5 | 88 | HEAVY_PUNCH |
| BEAR | 11.37 | 215.5 | 88 | SHOULDER |
| DEMON | 10.79 | 347.3 | 90 | UPPERCUT |

### B — dłuższy recovery

| Postać | DPS przycisków | Recovery ms | Najlepsze 10 s | Akcja |
|---|---|---|---|---|
| BRAX | 11.59 | 589.0 | 98 | HEAVY_KICK |
| NYXA | 10.16 | 611.9 | 72 | HEAVY_PUNCH |
| VEXA | 11.55 | 590.6 | 91 | FLYING_KICK |
| KROV | 11.16 | 633.1 | 91 | UPPERCUT |
| NINA | 15.38 | 435.6 | 112 | HEAVY_PUNCH |
| DANNY | 10.62 | 542.5 | 88 | HEAVY_PUNCH |
| BEAR | 9.83 | 1001.2 | 80 | SHOULDER |
| DEMON | 11.01 | 768.3 | 80 | UPPERCUT |

Uwaga: spełnienie celu DPS nie oznacza wyrównania wszystkich starć. BEAR nadal wygrywa zdecydowaną większość części par w obu wariantach; sam spadek obrażeń lub wydłużenie recovery nie usuwa całej przewagi w tym pomiarze. Nie rekomenduję wdrożenia żadnego wariantu jako potwierdzonego pełnego wyrównania bez oceny tych wyników.

Macierze CPU vs CPU: `variants/A/matrix.md` i `variants/B/matrix.md`; każda 8×8, 100 walk na komórkę, normal, łącznie 12 800 walk. Zawodnik wiersza gra 50 razy po każdej stronie. CSV `matchups.csv` zawiera czas, HP zwycięzcy, remisy i wyniki obu stron. PASS pomiaru nie oznacza równej szansy zwycięstwa każdego zawodnika. Surowe wyniki mają seed i przebieg rund. Czasy oznaczają aktywny zegar symulacji walki, bez filmu wejściowego i celebracji.

## 2. Serie i wyrzuty

Czas oddalenia nie narasta podczas pushTime, stun, reakcji HIT, akcji ataku ani ruchu atakującego do przodu. Seria nadal ma ograniczony czas życia i zeruje się po rzeczywistym odejściu. Mocne akcje są liczone odrębnie od wielokrotnych kontaktów tego samego ciosu; trzy mocne akcje działają również przy obrażeniach 11 i przy wariancie obniżonych obrażeń.

| Postać | Trafienia przed / 20 s | Resety przed | Mocne akcje do wyrzutu po | Odejście zeruje |
|---|---|---|---|---|
| BRAX | 10 | 1 | 3 | PASS |
| NYXA | 13 | 4 | 3 | PASS |
| VEXA | 26 | 4 | 3 | PASS |
| KROV | 12 | 4 | 3 | PASS |
| NINA | 19 | 7 | 3 | PASS |
| DANNY | 16 | 2 | 3 | PASS |
| BEAR | 26 | 6 | 3 | PASS |
| DEMON | 15 | 0 | 3 | PASS |

Pełny CSV: `wyrzut-przed-po.csv`. Liczymy akcje, a nie surowe kontakty: np. dwuczęściowy cios może dać 4 kontakty przy trzeciej mocnej akcji. Testy combo-finisher, impact-frequency i two-launches zachowują kontrole bloku, cooldownu, finishera i KO zależnego od HP.

## 3. AI

Easy: reaction 650 ms, cooldown 8500 ms, approach 0.65. Normal: 180/280/0.9. Hard: 100/0/1.15. Hard ogranicza odwrót, równoważy repertuar przy biernym przeciwniku, natomiast pod naciskiem dobiera kontrę według obrażeń i czasu pierwszego kontaktu; po bloku może od razu odpowiedzieć. Nie zmieniono ciosów ani animacji.

| Postać | Poziom | Ataki przed→po / 30 s | Różne akcje przed→po | KO biernego po (ms) |
|---|---|---|---|---|
| BRAX | easy | 13 → 3 | 5 → 2 | brak KO w 60 s |
| BRAX | normal | 15 → 13 | 6 → 5 | 17040 |
| BRAX | hard | 17 → 13 | 4 → 7 | 17712 |
| NYXA | easy | 13 → 3 | 5 → 2 | brak KO w 60 s |
| NYXA | normal | 14 → 12 | 6 → 6 | 23360 |
| NYXA | hard | 15 → 13 | 5 → 7 | 16320 |
| VEXA | easy | 14 → 3 | 5 → 2 | brak KO w 60 s |
| VEXA | normal | 13 → 10 | 6 → 5 | 18816 |
| VEXA | hard | 13 → 11 | 3 → 7 | 17696 |
| KROV | easy | 10 → 3 | 6 → 2 | brak KO w 60 s |
| KROV | normal | 10 → 9 | 7 → 6 | 19856 |
| KROV | hard | 12 → 9 | 7 → 7 | 20144 |
| NINA | easy | 15 → 3 | 6 → 3 | brak KO w 60 s |
| NINA | normal | 18 → 14 | 7 → 5 | 14576 |
| NINA | hard | 20 → 15 | 4 → 9 | 14176 |
| DANNY | easy | 14 → 3 | 5 → 3 | brak KO w 60 s |
| DANNY | normal | 14 → 10 | 6 → 6 | 18528 |
| DANNY | hard | 14 → 12 | 6 → 7 | 17664 |
| BEAR | easy | 15 → 3 | 6 → 2 | brak KO w 60 s |
| BEAR | normal | 16 → 14 | 6 → 6 | 13472 |
| BEAR | hard | 18 → 14 | 6 → 7 | 12576 |
| DEMON | easy | 15 → 3 | 4 → 2 | brak KO w 60 s |
| DEMON | normal | 16 → 14 | 5 → 5 | 16656 |
| DEMON | hard | 20 → 17 | 6 → 7 | 12464 |

Różnorodność w tabeli uwzględnia COMBO; test wymaga dodatkowo co najmniej 5 podstawowych ciosów hard. `ai-przed-po.csv` zawiera obrażenia i czasy przed/po. Test aktywnego nacisku zachowuje wymaganie skuteczniejszej kontry hard niż normal. Oddzielna macierz strategii gracza obejmuje 1920 przypadków.

## 4. Multiplayer i cache

Trafienie przesyła pozycję, siłę, region, kierunek, ziarno losowe oraz metadane obrażeń powierzchni ciała. Gość odtwarza cząstki i plamy lokalnie. Zdarzenia mają identyfikator, powtórki są ignorowane; pełny stan kluczowy naprawia utracone efekty. Usunięto powielony zewnętrzny timestamp, wewnętrzny czas stanu ma dokładność 1 ms.

Porównanie kontrolowane: stary i nowy serializer działają na tym samym stanie walki, z włączoną prawdziwą krwią. 8 postaci × heavy/COMBO/stress, po 30 s; duży numer sekwencji i czas sesji użyty w kopercie. Tabela pokazuje najgorszy wynik spośród 3 scenariuszy danej postaci. Są to bajty danych protokołu, bez nagłówków UDP/DTLS/HTTP i bez głosu.

| Postać | Mediana przed B | Mediana po B | Maks. zwykły B | Maks. kluczowy B | Wynik |
|---|---|---|---|---|---|
| BRAX | 13622 | 755 | 994 | 13024 | PASS |
| NYXA | 13588 | 754 | 988 | 12985 | PASS |
| VEXA | 14251 | 757 | 1190 | 15094 | PASS |
| KROV | 13904 | 740 | 974 | 16200 | PASS |
| NINA | 14242 | 757 | 988 | 16350 | PASS |
| DANNY | 14193 | 744 | 978 | 15835 | PASS |
| BEAR | 14298 | 751 | 969 | 17831 | PASS |
| DEMON | 14186 | 749 | 972 | 15985 | PASS |

Pełny stan kluczowy jest wyjątkiem od limitu 1200 B; wysyłany okresowo co około 2 s. Test zgodności krwi sprawdza cząstki, plamy, rany, duplikaty oraz odtworzenie po stanie kluczowym przy wspólnym zegarze. Pomiar działania na dwóch fizycznych telefonach i przy rzeczywistej utracie pakietów: NIEWYKONANE.

Handshake zawiera wersję protokołu, SHA-256 kodu klienta i SHA-256 konfiguracji 8 postaci. API create/join/sync oraz kanał peer odrzucają niezgodność komunikatem „Odśwież grę — inna wersja u przeciwnika”. Manifest generuje `scripts/build-compatibility.mjs`; konfiguracje dostają ten sam hash w URL. `fighter-source.js` ma jeden kanoniczny URL `/assets/fighter-source.js?v=review-147` — PASS 7 referencji.

## 5. Ranking

200 pełnych walk dla każdej postaci na każdym poziomie, 25 przeciw każdemu z 8 przeciwników. Gracz podchodzi i wykonuje legalne akcje przycisków; strategie obejmują powtarzanie jednej akcji i cykl repertuaru. Przeciwnikiem steruje produkcyjne AI danego poziomu. Najkrótszy czas spośród zwycięstw i porażek × 0.8, zaokrąglony w dół, tworzy próg pełnego meczu. Survival korzysta z najkrótszej rundy od pełnego HP; przegrana z przeniesionym HP nie ma dodatniego minimum. Rundy remisowe nadal wymagają czasu 60 s.

| Postać | Easy ms | Normal ms | Hard ms |
|---|---|---|---|
| BRAX | 20889 | 19955 | 15219 |
| NYXA | 25267 | 19622 | 17369 |
| VEXA | 23820 | 19264 | 14016 |
| KROV | 15360 | 16640 | 15577 |
| NINA | 15283 | 16064 | 14528 |
| DANNY | 23116 | 20787 | 15718 |
| BEAR | 11289 | 8729 | 9036 |
| DEMON | 12979 | 13235 | 14489 |

PvP nie ma poziomu CPU: jego dotychczasowe fizyczne minimum zachowano oddzielnie w `backend/lib/duel-times.json`, z testem pochodzenia z konfiguracji. Progi AI nie są używane do walidacji pojedynków między ludźmi.

Próg jest wspólny dla pojedynczego meczu fight/arcade/tournament, nie całego turnieju. Wszystkie 96 kombinacji postać×tryb×poziom: `after/ranking-thresholds.csv`. To empiryczny próg, nie matematyczny dowód najkrótszego KO człowieka. Niewybrany wariant balansu A/B wymaga ponownego wyliczenia progów przed wdrożeniem.

Wynik poniżej minimum pozostaje odrzucony przez istniejącą walidację. Przyjęty wynik krótszy niż 1.5×próg otrzymuje review_status=1 i nie trafia do TOP100. Statusy: 0 zwykły, 1 oczekujący, 2 zatwierdzony, 3 odrzucony. Owner-only GET reviewResults i POST reviewResult zapisują autora oraz czas decyzji. Migracja kolejkuje także istniejące zbyt szybkie wyniki, nie nadpisując wcześniejszej decyzji właściciela. Produkcyjna migracja: NIEWYKONANE — brak wdrożenia; nie zaakceptowano żadnych realnych wyników.

## 6. Testy, narzędzie audytu i ograniczenia

Build lokalny: PASS, `npm run build`, 38.73 s. Eksport danych audytu: PASS, `node scripts/review/extract-audit.cjs`, 3.21 s. Pełne logi: `tests/build.stdout`, `tests/build.stderr`, `tests/extract-audit.cjs.stdout`, `tests/extract-audit.cjs.stderr`. Próbę automatycznego wyszukania migracji przez Wrangler przerwał brak katalogu migrations; następnie cały schemat zastosowano lokalnie przez jawny plik SQL. Logi obu kroków są zachowane; nie użyto bazy zdalnej.

Pełne polecenia, czasy, statusy i stdout/stderr: `tests/final.csv` oraz pliki obok. Decyzje dla wszystkich wcześniejszych 39 FAIL: `39-fail-decyzje.md` i CSV. Zestaw główny uruchamia `npm run test:review-main`; osobny zestaw `npm run test:requires-media`. Nie usunięto asercji testów mediów, które nadal zawodzą.

HP eksportowane po resecie, przed pomiarami walki: PASS 100 dla wszystkich 8 w `extracted/03-postacie/zawodnicy.csv`.

Znane ograniczenia: sześć zachowanych FAIL w testach klipów/animacji; brakujące historyczne pliki i zależności dla jedenastu testów; brak fizycznych urządzeń i pomiarów 60 fps; brak wdrożenia i produkcyjnej migracji. Czy wszystkie niepowodzenia animacji są błędami obrazu czy dawnymi kontraktami testów: nie wiem. Nie zmieniano mediów, żeby uzyskać zielony wynik.

Pierwszy adapter CPU po stronie gracza miał błędy obsługi zasięgu i zakończenia akcji; jego pomiary odrzucono (`simulation/rejected-controller-v1`). Część partii przerwał limit pamięci oraz polecenie STOP użytkownika. Wyniki końcowe zawierają wyłącznie kompletne pliki wymaganej liczebności. Normal/easy porównano krok po kroku z zamrożonym silnikiem macierzy; hard ponownie zmierzono po poprawce kontrataków. Diagnostyczne walki dwóch łagodnych CPU nie służą do wyliczenia progów rankingu.

## Zawartość i zmiany

`variants/`: dwie propozycje parametrów, tabele, macierze i surowe walki. `before/`, `after/`: pomiary. `tests/`: logi. `media-sha256.csv`: rozmiary i SHA-256 wszystkich chronionych zasobów. `zmienione-pliki.md/csv`, `zmiany.diff`, `diff-stat.txt`: przegląd zmian. Kod pomocniczy: `scripts/review/`. Brak binarnych mediów w pakiecie.

Kod zmienionych i nowych plików jest w ZIP w katalogu `zmiany-kodu/`, z zachowaniem ścieżek względem repozytorium. Raporty i surowe wyniki są w katalogu głównym ZIP. To pakiet do przeglądu, nie gotowy build do publikacji.
