# Braxhorn — raport zmian i weryfikacji, 18.10.2026

Punktem wyjścia była aktualna wersja hostingu 141, commit `220e7e2298099e798ac7ebc0867fe537bc6a44fc`, a nie cofnięta wersja 138. Ustalone ruchy, konfiguracje i masterowe pliki zawodników pozostały bez zmian. Pakowanie zachowuje dokładne bajty modeli, klipów i tekstur (36 sum SHA-256). Nowe filmy aren wymagają stratnego kodowania przejścia; zachowano rozdzielczość i 30 fps, CRF 14. Nie oznacza to identycznych bajtów obrazu nowych filmów. W istniejących filmach naprawa dźwięku kopiuje strumień obrazu.

## Paczki

19 aren: 16 filmów z niezerową ścieżką audio oraz Metro, Harbor i Nocny Targ z osobnymi podkładami. Siedem nowych: Carrier, Canyon, Reactor, Savanna, Brooklyn, Dragon, Aquarium. Filmy i podkłady są w oddzielnej paczce; pobierana jest wybrana arena. Usunięto zastąpione GIF-y rooftop/jungle/volcano i stary film Beach; unikatowe Snow i Nocny Targ zachowano. Temple miał wyjątkowo cichy dźwięk: zastosowano +30 dB bez zmiany obrazu. Wyciszenie i odciszenie wszystkich 19 wyborów przeszło test DOM. Fizycznego odsłuchu nie wykonano.

Postacie: 36 plików, 165 561 371 B w osobnej paczce. Główna paczka nie zawiera modeli/klipów/tekstur; metadane konfiguracji pozostają lokalnie (6 417 098 B). Poprzednie pakowanie Float32 zajmowało 147 405 671 B; zachowanie oryginalnego kodowania klipów zwiększa paczkę zewnętrzną o 18 155 700 B. Nie przedstawiamy tego jako zmniejszenia całkowitego transferu. Szczegóły: `arena-package-139.md`, `fighter-package-139.md` (nazwy robocze, nie numery wdrożenia).

## Etapy

1. Wspólny helper startu testów przechodzi asynchronicznie przez pseudonim, z oczekiwaniem na zapis. Naprawiono selektor potomny, arrayBuffer, aktualne pliki viewportu, politykę nazw oraz uruchamianie TS przez `node --import tsx`. W faktycznej wersji ACROBATIC_PUNCH ma Danny, nie Brax; test sprawdza jego DÓŁ+P2 i brak kolizji z niską gardą. Nie przeniesiono ruchu do innej postaci. Audyt API uzupełniono o aktualne migracje i transakcje mocka.
2. Seria trafień znika po 600 ms nieprzerwanego rozdzielenia brył ciał o ponad 35% wysokości postaci. Próg bazuje na ciałach, nie samych korzeniach animacji; 600 ms odróżnia wycofanie od krótkiego odrzutu. Okno 3500 ms ciągłego naporu pozostało. Fair-pressure: PASS 2880 przypadków. Zaktualizowano również stare oczekiwanie testu dotyczące lotu po samotnym finisherze — już istniejąca logika pozwalała na lot, nie zmieniano jej.
3. Bufor gościa: 80 ms, interpolacja po simTime, awaryjne przewidywanie ograniczone do 100 ms; lokalna predykcja ruchu i ataku, ograniczona korekta pozycji i ochrona przed cofnięciem klatki potwierdzonego ataku. Obrażenia rozstrzyga host. Stan hosta wysyłany co dwa kroki symulacji; timer pozostaje tylko dla wejścia gościa. Gość respektuje document.hidden. Diagnostyka raportuje opóźnienie wejścia, jitter i p95 klatek.
4. `viewport.js` jest jedynym właścicielem rozmiaru prostokąta gry, używa visualViewport i obsługuje resize, scroll, orientationchange, pageshow. Usunięto konkurencyjne wymiary CSS; tło html/body jest takie jak gry, marginesy safe-area sterowania zachowano. Menu nadal mapuje własną grafikę 16:9 wewnątrz tego prostokąta.
5. Progi wyników wyliczane z aktualnych configów: pełne cykle akcji i ostatni prefiks trafienia, nieskończona energia, bez dojścia/hitstop/KO, margines bezpieczeństwa 20%. Minimum rundy: Brax 4702 ms, Nyxa 5492, Vexa 5213, Krov 4732, Nina 4111, Danny 5724. Fight/Arcade/Tournament wymagają co najmniej dwóch rund, Survival jednej; remisy dodają 60 s, przegrana Survival uwzględnia przenoszone HP. Przykład Brax 2:0: 9404 ms. Wyniki poniżej progu są odrzucane i logowane. To filtr wiarygodności, nie dowód uczciwej gry. Pełna weryfikacja wymagałaby zapisu wejść, wersji configów i ziarna losowości oraz powtórki autorytatywnej symulacji na serwerze; nie wdrożono jej.
6. Nina ma 22 dostępne wyzwania i licznik 22/22. README backendu ostrzega, że nagłówki oai-authenticated-* są zaufane tylko za proxy Sites; na innym hostingu trzeba je blokować na wejściu.

Pełne testy wykryły dodatkowo istniejące pudło Vexy przy dojściu do combo. Zmieniono wyłącznie punkt zatrzymania Vexy o 2 piksele ekranowe bliżej; nie zmieniono klatek, hitboxów, obrażeń ani czasów ruchów. Weryfikacja: 144 przypadki combo gracza i 72 CPU, PASS.

## Pomiary przed i po

Kontrolowany test VM: 48 ms w każdą stronę, opóźniane pakiety, zegar klatki 16 ms. Jedna próbka wejścia na wariant; nie jest to benchmark urządzeń.

| Pomiar | Przed | Po |
|---|---:|---:|
| Naciśnięcie → pierwsza widoczna reakcja | 112 ms | 16 ms |
| Jitter pakietów p95, ten sam zewnętrzny pomiar | 46,67 ms | 46,67 ms |
| Klatka p95, kontrolowany zegar | 16 ms | 16 ms |

Jitter sieci nie został zmniejszony; bufor ogranicza jego wpływ na renderowanie. Wewnętrzny raport diagnostyczny zawiera dodatkowo rozgrzewkę i dlatego ma p95 jitteru 63,33 ms. Dane i odtwarzalny skrypt: `guest-before-after.json`, `scripts/measure-guest-latency.cjs`. Nie zmierzono realnego FPS, GPU, opóźnień telefonów ani subiektywnego drżenia.

## Testy

| Zestaw | Wynik |
|---|---|
| npm test (balance, expansion, regressions) | PASS |
| npm run test:repairs | PASS |
| npm run test:audit | PASS |
| npm run test:duel-api | PASS |
| npm run test:online — rzeczywisty lokalny Worker + D1, 20 kontroli | PASS |
| audit-network-render, audit-duel-engine | PASS |
| audit-phone-viewport: 9 rozmiarów, offsety, orientacja, pageshow, pauza | PASS |
| audit-ranking-time-policy, audit-ranking-api: wszystkie 4 tryby | PASS |
| audit-arena-pack: 16 wideo i 5 zasobów pomocniczych | PASS |
| audit-existing-arena-video: identyczne zakodowane obrazy 7 starych filmów | PASS |
| npm run build i kontrola braku zewnętrznych mediów w wyniku | PASS |
| audit-arena-selection, audit-arena-video-loader, audit-arena-media | PASS |
| audit-arena-audio: wszystkie 19 aren, mute/unmute | PASS |
| audit-fighter-media, audit-fighter-asset-package | PASS |

Logi głównych zestawów są w `docs/verification/`. Błędy sieci drukowane przez testy recovery są celowo wstrzykiwane; o wyniku decydują asercje i kod wyjścia. Nie wykonano wszystkich historycznych/alternatywnych skryptów npm (np. test:ai-matrix); tabela dotyczy wykonanych zestawów.

## Ręczna kontrola na dwóch telefonach

- iPhone Safari: uruchomić w pionie i poziomie, z rozwiniętym i schowanym paskiem adresu. Sprawdzić dół ekranu, wskaźnik Home, klawisze, menu i walkę. Obrócić podczas walki i po powrocie z tła. Powtórzyć w PWA z ekranu głównego oraz po cofnięciu do strony (pageshow).
- Android Chrome: pion/poziom, pasek adresu, nawigacja gestami, blokada ekranu i powrót, przytrzymanie kierunku podczas obrotu. Sterowanie nie może pozostać wciśnięte.
- Na każdym urządzeniu wybrać kolejno wszystkie areny, uruchomić po dotknięciu ekranu, odtworzyć co najmniej trzy pętle. Sprawdzić dźwięk, klik na łączeniu, skok obrazu, podwójny podkład, mute/unmute, pauzę i powrót z tła. Szczególnie Temple oraz wcześniej nieme stare filmy.
- Jednocześnie iPhone + Android: raz iPhone jako host, raz Android. Wspólne Wi-Fi i oddzielne sieci komórkowe. Ruch, szybkie zmiany kierunku, serie ataków, gardy, skoki, KO i rewanż. Nie może być cofania klatek tego samego ataku, teleportów ani lokalnie przyznanych obrażeń.
- U gościa powtórzyć z chwilowym brakiem pakietów i powrotem z tła. Z obu telefonów zebrać __BRAX_DIAGNOSTICS__.report() po tej samej długości walki; porównać inputToVisibleMs, jitter oraz frameMs.p95.
- Zimny i ciepły wybór wszystkich sześciu postaci, przerwany transfer i ponowienie, zmiana pary. Sprawdzić detale tekstur i płynność masterów. SHA-256 potwierdza pliki, ale nie zastępuje oceny renderowania.

Te kontrole urządzeń pozostają NIEWYKONANE. Nie było dostępnego wspieranego sterowania przeglądarką do wizualnego QA.

## Lista plików i build

Pełna lista dodanych, zmienionych i usuniętych plików: `changed-files-20261018.txt`. Główne pliki funkcjonalne: `game/assets/combat.js`, `multiplayer.js`, `peer-link.js`, `viewport.js`, `screen-layout.js`, `arena-features.js`, `arena-catalog.js`, `game/index.html`; `backend/lib/arena-api.ts`, `ranking-time-policy.ts`, `ranking-times.json`, `arena-media.ts`, `fighter-media.ts` i trasy API; skrypty budowania, pakowania, audytów i przesyłania oraz README backendu. Dodatkowa kontrola usuwa przeniesione media ze wszystkich warstw wyniku builda, także przy ponownym użyciu katalogu po starszej wersji.

## Weryfikacja paczek na hostingu

21/21 plików aren i 36/36 plików postaci: upload HTTP 201, pobranie zakresu HTTP 206 z porównaniem bajtów oraz pełne pobranie HTTP 200 i SHA-256 — PASS. Użyto wersji przejściowej 142 ze starym klientem, aby najpierw udostępnić komplet zasobów. Tymczasowe klucze uploadu usunięto z konfiguracji przed publikacją końcowego klienta. Główna paczka dist po usunięciu zewnętrznych mediów: 102 650 361 B (pliki wyniku przed opakowaniem archiwum).
