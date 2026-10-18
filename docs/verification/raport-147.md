# Braxhorn Arena Fighter — naprawy i weryfikacja v147

Punkt odniesienia: opublikowana wersja 146, commit `5b06526f1c7b5da801097b6687306fbe7edd8d31`. Raport dotyczy wykonanych zmian i granic testów; nie stanowi potwierdzenia testu na fizycznych telefonach.

## Nazwy: MIŚ i AZRAK

Przyczyna zgłoszenia była konkretna: `endRound()` przekazywało wewnętrzny identyfikator do komunikatu zwycięzcy. Ekran końcowy miał poprawne nazwy, ale komunikat po rundzie i jego kopia u gościa pokazywały BEAR/DEMON. Formatowanie jest teraz stosowane przy wyświetlaniu obu komunikatów, także przy odebraniu starego identyfikatora od hosta. Porównanie tekstu przed animacją również używa nazwy widocznej, aby nie restartować animacji komunikatu co klatkę.

Sprawdzono HUD, wygraną i przegraną, komunikat po rundzie, pomoc, rekordy, ranking, wyzwania, drabinki, zwycięzcę turnieju, lobby oraz etykiety dostępności. Poprawiono dodatkowo etykietę przycisku wyboru zawodnika online. Identyfikatory w zapisach, API i ścieżkach zasobów pozostają zgodne z istniejącymi danymi. Pseudonim gracza „DEMON” nie jest nazwą zawodnika i nie jest automatycznie zmieniany.

Ujednolicono opisy stylów w kartach, pomocy i etykietach: MIŚ — SIŁA · WALKA W ZWARCIU; AZRAK — AKROBATYKA · KOPNIĘCIA. Karty obu zawodników uwzględniają ich rzuty zamiast błędnego zera. Komunikat treningu chwytu uwzględnia obu zawodników.

## Nowy wybór aren

Zamiast trzech dużych kart w poziomej karuzeli: duży podgląd wybranej areny po lewej, przewijana siatka miniatur po prawej, pięć filtrów (wszystkie oraz cztery kategorie), wyszukiwanie, losowanie wśród widocznych aren i wyraźne „WALCZ TUTAJ”. Dotknięcie miniatury zmienia podgląd; walka zaczyna się dopiero po zatwierdzeniu. Wybrana arena ma obramowanie i znacznik. Zachowano 19 aren i ich grafiki. Podgląd używa pełnego obrazu z katalogu, bez pobierania wszystkich filmów.

Uwzględniono pusty wynik wyszukiwania, obsługę klawiatury, bezpieczne marginesy ekranu, pionowe przewijanie dotykiem oraz powrót do areny ukrytej wcześniej filtrem. Fight i trening zachowują ręczny wybór; Arcade/turniej/Survival nadal losują arenę. Host multiplayer nadal wybiera arenę w lobby i przekazuje ją gościowi. Nowy katalog dotyczy osobnego ekranu wyboru areny.

## Naprawy online i rankingu

- Przyciski, opisy ataków, garda, chwyt i pomoc gościa używają jego postaci, a nie postaci hosta. Nina nie dostaje gardy ani rzutu; Danny nie dostaje rzutu.
- Zegar renderowania bufora nie cofa się po nadejściu opóźnionego pakietu. Host nadal rozstrzyga walkę.
- Jitter jest liczony z odstępów zegara wysyłania, a nie ze spowolnionego czasu symulacji. Starsze pakiety bez znacznika czasu nie produkują pozornego pomiaru.
- Dowolna korekta pozycji nie zalicza już reakcji na naciśnięcie gardy. Pomiar czeka na odpowiadającą wejściu akcję lub ruch.
- Krew i dźwięki hosta są odtwarzane ze snapshotu odpowiadającego buforowanemu obrazowi.
- Niepoprawne wejścia i podstawowe niepoprawne struktury snapshotu są odrzucane przed zmianą stanu; dodano limit wielkości tekstowego pakietu.
- Host podejmuje do trzech prób ponownej negocjacji ICE po utracie połączenia; gość przyjmuje nową ofertę. HTTPS pozostaje transportem zapasowym. Fizyczna zmiana Wi-Fi/LTE nie była testowana.
- Wskaźnik aktywności rozmowy może uruchomić się ponownie w następnym meczu.
- Jednoczesne rozpoczęcia tworzą jeden run i jeden otwarty mecz. Rozliczenie używa jednorazowego identyfikatora w transakcji; sprzeczna druga odpowiedź nie nadpisuje pierwszej.
- Nowy Arcade wymaga 7 zwycięstw. Historyczne wyniki zachowują swój cel, także 5/5; lokalne nowe rekordy zapisują cel kampanii.
- Duel sprawdza aktorów, rundy i minimalny czas ścienny. Minimum to suma minimalnych czasów postaci wygrywających rundy oraz 60000 ms za każdą rundę remisową. 2:0 po 1600 ms jest odrzucane. Poprawne 1:0 po trzech rundach jest nadal legalne, z doliczonym czasem dwóch remisów.
- Dodano tylko nullable `matches.settlement_key`; migracja nie usuwa rekordów ani historycznych duplikatów.

## Pozostałe naprawy i zachowanie zasobów

Powrót z BFCache zachowuje film areny i wznawia go tylko wtedy, gdy wcześniej grał. Naprawiono nieaktualne założenia testów treningu i narastającej presji. Test wyrzutu obejmuje czas potrzebny na całe podejście, combo i lądowanie.

Audyt 1600 kontaktów wykrył błędne dystanse podejścia dla części par z Azrakiem oraz Niny przeciw Misiowi. Kalibracja wykorzystuje rzeczywistą symulację obu kierunków i zmienia wyłącznie estymator dystansu używany przez AI. Nie zmienia hitboxów, obrażeń, ruchów ani klatek masterów. Wyniki kalibracji są w `attack-distances-147.json`.

SHA-256: wszystkie 64 pliki z zestawu kontrolnego konfiguracji, klipów, modeli, tekstur i manifestów są identyczne z v146. Tabela: `audit-147-preserved-assets.json`. Pakiet 48 zewnętrznych plików zawodników zachowuje 255247104 bajty oryginalnych danych. W tej wersji nie usuwano plików aren.

## Wyniki

| Zestaw | Wynik |
|---|---|
| npm test | PASS |
| npm run test:repairs | PASS |
| npm run test:audit | PASS |
| npm run test:147 | PASS |
| Nazwy — test końcowy | PASS, 49 sprawdzeń |
| Klient online — dodatkowe regresje | PASS, 38 liczonych sprawdzeń i odrzucenie niepoprawnego stanu |
| Kontakt wszystkich ośmiu postaci | PASS, 1600 kontaktów, 50 prób poza zasięgiem, 16 powrotów kontroli |
| Wyrzut i lądowanie po combo | PASS, 72 scenariusze |
| Konflikty predykcji | PASS, 36 scenariuszy |
| Bufor renderowania | PASS |
| Peer link / format binarny | PASS |
| Duel API / minimalny czas / remisy | PASS |
| Atomowe rozliczenia i Arcade | PASS |
| Turnieje 4–10 uczestników | PASS |
| npm run test:online — Worker i lokalne D1 | PASS, 20 sprawdzeń, w tym rollback po wymuszonym błędzie |
| npm run build — końcowy pakiet | PASS |
| Nazwy w zbudowanym kodzie | PASS |
| npm run test:viewport | PASS — obliczenia, nie urządzenie |
| Pętla filmu i BFCache | PASS — model odtwarzaczy, nie odsłuch Safari |

Logi są w `deep-147/`. Pełna lista zmienionych plików jest w `deep-147/changed-files.txt`.

## Pomiary i granice potwierdzenia

| Próba na kontrolowanym zegarze | Przed | Po |
|---|---:|---:|
| Cofnięcie pozycji po pakiecie przy ruchu hosta w jednym kierunku | −0,61334% szerokości areny | 0% |
| Pozorny jitter przy równych odstępach pakietów i spowolnionej symulacji | około 25 ms | około 0 ms |
| Fałszywa reakcja na gardę, gdy wystąpiła tylko korekta pozycji | 32 ms | brak zaliczonej próbki |

W 36 konfliktach predykcji maksymalne przesunięcie między próbkami wyniosło 2% szerokości areny, a liczba cofniętych klatek tego samego ataku — 0. To wynik symulowanego zegara, nie pomiar płynności telefonu. Nie zmierzono tutaj prawdziwego RAF, p95 czasu klatek ani rozrzutu przesunięć przy jitterze 46 ms na fizycznych urządzeniach. Nie wykonano wizualnej oceny nowego układu w Safari ani odsłuchu pętli audio.

## Do sprawdzenia na dwóch telefonach

1. Safari iPhone z paskiem adresu, po jego schowaniu i w PWA: cały katalog, dolny przycisk, wskaźnik Home, wyszukiwanie i obrót ekranu. To samo na Androidzie.
2. Wybór MIŚ/AZRAK, wygrana i porażka, koniec rundy i meczu, pomoc, ranking oraz drabinka — jedna nazwa na każdej powierzchni.
3. Dwa telefony: zamiana host/gość, Nina kontra Brax, Danny kontra Miś; poprawne przyciski własnej postaci.
4. Atak gościa jednocześnie z trafieniem hosta, ruch podczas odepchnięcia i chwytu; brak cofania tej samej animacji i gwałtownych korekt.
5. Nakładka diagnostyczna po pięciu dotknięciach logo: zanotować FPS, p95, ping, jitter, opóźnienie wejścia i rolę, osobno na obu telefonach.
6. Przejście Wi-Fi/LTE, chwilowa utrata sieci, schowanie aplikacji i powrót; sprawdzić synchronizację, wynik i rozmowę.
7. Każda filmowa arena przez kilka pełnych pętli: brak czarnej klatki i słyszalnej przerwy; ponowić po powrocie z innej aplikacji i historii przeglądarki.
8. Pełne Arcade, turniej i jednoczesne raportowanie końcowego wyniku.

Pełne przeładowanie karty podczas rozpoczętej walki turniejowej nadal nie odtwarza autorytatywnej symulacji hosta; istniejąca ścieżka wymaga decyzji organizatora o powtórce. Weryfikacja czasu i zgodności dwóch raportów nie dowodzi uczciwości hosta. Pełna weryfikacja wymagałaby zapisu wejść i odtworzenia deterministycznej symulacji na serwerze; tego nie wdrażano.
