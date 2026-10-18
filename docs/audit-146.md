# Audyt 146 — combo i stan gry

## Zmiana combo
Po dwóch RÓŻNYCH skutecznych trafieniach tej samej akcji COMBO garda nie blokuje jej pozostałych ciosów. Pierwsze i drugie trafienie można nadal zablokować. Zablokowane ciosy, chybienia, uniki i wielokrotny odczyt jednej grupy obrażeń nie potwierdzają combo. Stan jest przypisany do napastnika, numeru jego akcji i konkretnego celu; znika przy przerwaniu, nowej akcji i resecie rundy. Host nadal rozstrzyga obrażenia w multiplayerze.

Sama reguła combo wyłącza gardę po potwierdzeniu, nie dodaje automatycznych trafień na odległość. Na późniejsze, wyraźne zlecenie użytkownika zmieniono wyłącznie K2 i COMBO Azraka: K2 to pojedyncze mocne kopnięcie okrężne (15 obrażeń), COMBO „Huragan z wyskoku” łączy wybicie Macaco Side, niepowielony fragment oryginalnego Hurricane Kick i lądowanie Macaco Side. Trzy kontakty mają 8/9/17 obrażeń, łącznie 34 jak poprzednie combo. Nominalny czas silnika bez hitstop: 1,6723 s. Mastery, model i tekstury Azraka zachowane. Pozostałych siedmiu zawodników nie zmieniono. Porównanie SHA-256: 63 z 64 plików identycznych względem wersji 145; jedyna zmiana to demon-new/config.json (verification/audit-146-preserved-assets.json).

## Nazwy zawodników
Jedno mapowanie prezentacyjne fighter-names.js: BEAR → MIŚ, DEMON → AZRAK. Używane przez wybór postaci, HUD lokalny/online, wynik wygranej i przegranej, pomoc, trening, kampanię, drabinkę, turnieje online, ranking lokalny/online, rekordy i wyzwania. Identyfikatory zapisów, API i ścieżki plików pozostają BEAR/DEMON. Pseudonimy graczy nie są podmieniane. Test regresji: 44 kontrole PASS. Dodatkowo licznik wyzwań Niny pokazuje 22/22 również w nagłówku ekranu wyzwań (test interfejsu).

## Kontrola ruchów Azraka
Numeryczny test kontaktów i ciągłości: PASS. K2 zadaje 15, combo 34 obrażenia w obu kierunkach; dalekie ataki chybiają, akcje wracają do gardy. Rozbieżność kontaktu z kością <0,001 px; nieciągłość dokładnie na granicy segmentów <0,0018 px. Maksymalny krok kości przy próbkowaniu źródła 60 Hz to 69,03 px podczas szybkiego obrotu — nie jest to skok pozycji po arenie ani pomiar płynności na ekranie. Szczegóły: verification/audit-146-azrak-combo.json. Nie wykonano oceny wizualnej na telefonie.

## Wynik audytu: jest otwarty FAIL
Rozszerzony test ośmiu zawodników wykrył 40 chybień w 1600 próbach przy dystansie wyliczanym przez attackDistance. Dotyczy kombinacji BRAX/Azrak, NYXA/Azrak i NINA/Miś, obu ról i kierunków. Wersja 145 daje dokładnie ten sam wynik: problem istniał przed zmianą combo. Testy dalekich chybień, powrotu do gotowości, gardy i KO w tym audycie przeszły.

To problem zgodności wyliczonego zasięgu z rzeczywistymi strefami kontaktu nowych modeli; nie dowodzi, że te ciosy nigdy nie trafiają z bliższego dystansu. Wymaga osobnego dopasowania obliczeń dystansu i sprawdzenia wszystkich par, z zachowaniem masterów. Nie zamaskowano błędu zwiększaniem obrażeń lub rozciąganiem animacji.

Pełne przypadki: verification/audit-146-eight-reach.json. Porównanie sprzed zmiany: verification/audit-145-eight-reach-baseline.json. Oba raporty identyczne. Uruchomienie scripts/audit-eight-fighter-reach.cjs kończy się kodem 1, dopóki ten problem pozostaje.

## Testy
| Zakres | Wynik | Dowód |
|---|---|---|
| Nazwy Miś/Azrak | PASS, 44 kontrole | audit-fighter-names.cjs |
| K2 i COMBO Azraka | PASS, kontakty, przejścia, powrót do gardy | audit-146-azrak-combo.json |
| Reguła potwierdzenia combo, 8 zawodników, garda wysoka/niska, gracz/CPU/aktor gościa na hoście | PASS, 2688 przypadków | combo-146.log |
| Fair-pressure, 64 pary, kierunki, ściany, obie role | PASS, 5120 przypadków | audit-146-test.log |
| npm test: standardowe regresje walki, kampanie, ranking, dotyk, replay, krew, KO | PASS | audit-146-test.log |
| npm run test:repairs | PASS | audit-146-repairs.log |
| npm run test:audit: silnik, zasoby, nowe modele, 8 zawodników, pętle | PASS | audit-146-audit.log |
| Viewport: 9 rozmiarów/orientacji, offsety, pauza | PASS | audit-146-viewport.log |
| Multiplayer API | PASS | audit-146-api.log |
| Turnieje internetowe 4–10 graczy | PASS | audit-146-tournaments.log |
| Audio 19 aren i wybór filmów | PASS | audit-146-audio.log, audit-146-arenas.log |
| Online: prawdziwy lokalny Worker i D1 | PASS, 20 kontroli | audit-146-online.log |
| npm run build | PASS | audit-146-build.log |
| Rozszerzony kontakt na wyliczonym zasięgu, 8 zawodników | **FAIL, 40/1600 prób** | audit-146-eight-reach.json |

Logi są w docs/verification. Test online początkowo wykazał brak tabel pustej lokalnej D1; załadowano sześć istniejących migracji wyłącznie lokalnie i test powtórzono. Zdalna baza nie była zmieniana.

## Czego nie potwierdzono
Nie wykonano oględzin GPU na telefonie ani testu na dwóch fizycznych telefonach. Brak nowego pomiaru prawdziwego RAF/jitteru 46 ms i opóźnienia wejścia. Testy gardy gościa sprawdzają tę samą autorytatywną ścieżkę obrażeń hosta, nie transmisję między telefonami. Nie deklarujemy, że cała gra jest wolna od błędów lub że nowe postacie są w pełni zbalansowane. Szersza macierz AI nie została w tym wydaniu uruchomiona.

## Propozycja premium wyboru areny — bez zmiany interfejsu w tym wydaniu
Na przesłanym zdjęciu obecna karuzela pokazuje trzy z 19 aren i wymaga długiego przewijania. Bogate tło konkuruje z samymi miniaturami. Proponowany ekran:
- Lewa część: duży podgląd zaznaczonej areny, jej nazwa i krótki opis. Film pobierany dopiero dla zaznaczonej areny, pozostałe pozycje mają lekkie miniatury.
- Prawa część: siatka 3 × 3 miniaturek, przewijana pionowo. Wyraźna limonkowa ramka zaznaczenia.
- Górny pasek: Wszystkie / Miasto / Natura / Fantastyka / Przemysł, licznik pozycji.
- Dolny pasek: Wstecz, Losuj, WALCZ NA TEJ ARENIE. Dotknięcie miniatury zmienia podgląd, przycisk zatwierdza wybór.
- Zachować czarno-limonkową identyfikację, ograniczyć dekoracyjne światła za treścią i zapewnić co najmniej 44 px pola dotyku; układ pionowy podgląd nad siatką.

To propozycja do następnej zmiany ekranu; w tym wydaniu nie przeprojektowano wyboru aren.
