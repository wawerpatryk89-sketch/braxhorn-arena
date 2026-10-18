Korekta po zdjęciach użytkownika: `NAPRAWA_UI_KONTAKT_116.md` — etykiety kart, sens pól treningu i zapis kontaktu w replay. Pełne potwierdzenie obrazu pozostaje otwarte.

Aktualizacja interfejsu i śladów walki po v114: zobacz `ZMIANY_WIZUALNE_20261014.md`. Publikacja tej aktualizacji zatwierdzona w rozmowie. Ograniczenia odbioru urządzeń pozostają otwarte.

# BRAXHORN ARENA FIGHTER — master kandydata testowego po audycie v113

Data: 14.10.2026. Baza: v113, commit `e3f257f237b477a4b4d0bcd01a9ec267199590c0`.
Status: **odbiór całego zlecenia OTWARTY**. v115 opublikowano na późniejsze polecenie użytkownika; kolejne poprawki opisuje NAPRAWA_UI_KONTAKT_116.md. Samo wdrożenie nie oznacza zakończenia odbioru.
Ten dokument opisuje zaimplementowany kandydat, a nie obietnicę ukończenia wszystkich 14 punktów. Późniejsze zatwierdzone zmiany mają pierwszeństwo przed historycznym masterem V2.3. Zasady.txt pozostaje obowiązujący. Oryginalnych załączników nie zmieniono.

## Tożsamość i ruchy

Sześciu zawodników: BRAX, NYXA, VEXA, KROV, NINA, DANNY. Zachowane modele, tekstury, klipy, mapowania ruchów, stroje i kolory. Nina ma osiem podstawowych wejść; pozostali po sześć. Brak własnego rzutu Niny i Danny’ego pozostaje zgodny z ich zestawami. Nie dodano wymyślonych głosów ani zastępczych technik.

`acceptance/current-game-data.json` jest eksportem aktualnych parametrów. Zawiera porównanie 36 plików modeli, animacji i tekstur z bazą oraz sprawdzenie, że w konfiguracjach zmieniono wyłącznie wybrane obrażenia combo Braxa i Krova. Nie jest to wizualny odbiór poprawności sylwetek.

## Silnik i czas

- Stały akumulator 60 kroków na sekundę. Częstotliwość rysowania nie wyznacza liczby kroków fizyki. Długie pojedyncze przerwy są nadal ograniczane do 100 ms, żeby wznowienie aplikacji nie nadrabiało całej walki.
- W jednym kroku zbierane są legalne kontakty obu stron na podstawie wspólnego obrazu obrony i pozycji celu. Reakcje i rozstrzygnięcie KO następują po zebraniu kontaktów; kolejność CPU/gracza nie kasuje drugiego legalnego ciosu.
- Wzajemne trafienia i podwójny KO są dozwolone. Podwójny KO nie przyznaje punktu żadnej stronie. Energia za daną akcję nalicza się raz, skuteczny blok jej nie przyznaje.
- Runda: 60 s. Czas rundy i czas rankingu korzystają z tego samego czasu symulacji. Zwarcie i hit-stop nie zatrzymują zegara. Pauza, ukrycie karty i orientacja pionowa zatrzymują symulację. Timeout rozstrzygany jest także po zebraniu kontaktów oraz podczas zwarcia.
- Slow motion po KO zwalnia czas symulacji; replay zapisuje ten czas, a nie już spowolniony czas ścienny. Testy 30/60/120/144 Hz obejmują jeden identyczny scenariusz, nie każdą możliwą sekwencję wejść.

## Zwarcie i rzut

Po co najmniej 320 ms naporu na kontakt ciał uruchamia się choreografia. Samo stanie blisko ani aktywny cios nie wywołuje automatycznego chwytu. Przy obustronnym naporze obie strony grają CONTACT_PUSH i cofają się; nie ma arbitralnego zwycięzcy. Bez automatycznego rzutu, obrażeń i upadku. Po zakończeniu automatycznego kontaktu zachowane są nadal przytrzymane wejścia.

Rzut uruchamiany świadomie nadal korzysta z oryginalnych par klipów. Korekta dystansu jest rozłożona funkcją smoothstep na 180 ms zamiast jednorazowej zmiany pozycji. Wspólny czas obu animacji, okno zerwania 200 ms, jedno naliczenie obrażeń przy źródłowym czasie 1,2 s i ograniczenie maksymalnego czasu pary do 2 s pozostają. Ten mechanizm wymaga nagrania dłoni, barków, podpór i narożników; test logiczny nie dowodzi braku przenikania.

## AI i balans

AI obserwuje rozpoczęte ataki także podczas własnej reakcji, lecz nie może ominąć animacji odzyskiwania kontroli. Nie zaczyna spóźnionego bloku po ostatniej aktywnej klatce przeciwnika. Przy powtarzalnym naporze na poziomie trudnym częściej utrzymuje odpowiedni blok i wybiera najszybszą legalną kontrę w zasięgu. Nie rozpoczyna ataków na postać w stanie leżenia lub z aktywną ochroną wstawania. Nie dodano mnożnika obrażeń, rozszerzania hitboxów ani przyciągania celu.

Wersja testowa koryguje potencjalne pełne obrażenia combo:

| Zawodnik | Obrażenia | Czas klipu w grze bez podejścia i hit-stopu | Grupy trafień |
|---|---:|---:|---:|
| Brax | 48 (wcześniej 56) | 3,333 s | 7 |
| Nyxa | 44 | 3,652 s | 7 |
| Vexa | 44 | 4,608 s | 5 |
| Krov | 44 (wcześniej 28) | 5,335 s | 5 |
| Nina | 39 | 2,316 s | 4 |
| Danny | 45 | 4,681 s | 5 |

Koszt: 100 energii, maksymalnie dwa combo na rundę. Nie skrócono oryginalnych klipów ani nie zmieniono ich zasięgu. To korekta testowa, nie stwierdzenie pełnej równowagi postaci: różnice czasu pozostają i wymagają testów z graczami. Po zgłoszeniu regresji usunięto automatyczne urywanie combo po pudle lub bloku: odtwarzana jest pełna przypisana sekwencja, w tym końcowe kopnięcie Braxa. Rzeczywisty cios przeciwnika nadal przerywa atak. Zablokowane i chybione trafienia nie zadają obrażeń.

Macierz AI: 36 par × 3 poziomy × 5 strategii × 2 ziarna = 1080 rund. Każda zakończona bez zawieszenia. Strategie: przód + P1, rotacja czterech ataków z naporem, wycofywanie, blok, próby chwytu. Osobne 20 rund: Brax przód + P1 przeciw trudnej Vexie/Krovowi, po 10 ziaren. Na bazie v113 Vexa wygrała 4/10, a Krov 0/10 tych samych prób. W kandydacie Vexa wygrała 10/10; Krov 9/10. Krov przegrał z ziarnem 99991, przy 10 HP Braxa. Pierwotny scenariusz audytu z ziarnem 175 jest naprawiony dla obu. **Nie uznajemy zagadnienia odporności AI na spam za całkowicie zamknięte.**

## Kontakt, KO, replay, krew i dźwięk

- Punkt rozprysku i iskier pochodzi z potwierdzonego kontaktu z kapsułą celu. Efekty nie powstają po pudle i skutecznym bloku.
- Pozostaje istniejący system siły reakcji i ochrony przed ciągłym powalaniem. **Brakuje zatwierdzonych osobnych reakcji nóg** w aktualnych zestawach; nie zastąpiono ich losowymi animacjami. Rozróżnienie reakcji głowa/korpus/nogi jest nadal niekompletne.
- Hit-stop śmiertelnego ciosu nie jest zerowany przy końcu rundy. Rzut z KO ma hit-stop i slow motion; para nie przesuwa się podczas samego hit-stopu. Oryginalne reakcje i upadki pozostają.
- Replay zachowuje stały kadr, bez przybliżeń po rundzie, KO i zwycięstwie. Bufor do 240 próbek / 3600 ms czasu symulacji, wycinek od 850 ms przed do 1200 ms po oznaczeniu KO. Tempo replay schodzi do 0,28× i wraca do 1×. Brak podwójnego spowalniania nagranego czasu ściennego.
- Replay odtwarza zapisane pozycje cząstek, poziomy ran i zdarzenia dźwiękowe. Nie uruchamia fizyki, obrażeń, energii ani ponownego zapisu wyniku. Odgłosy są odtwarzane raz również przy ograniczaniu częstotliwości zapisu próbek. Tło animowane nadal pochodzi z bieżącej areny, nie z nagrania historycznej klatki.
- Cząstki krwi korzystają z czasu symulacji. Po korekcie nadmiaru krwi: maksymalnie 48 cząstek łącznie, zwykle pięć przy trafieniu głowy za 12 obrażeń, bez rozprysku na korpus/nogi. Trwałe ślady dopiero od trzeciego trafienia w dany obszar; maksymalnie trzy ślady głowy i trzy miejsca obicia. Ślady są konserwatywnie ukrywane podczas bloku, kontaktu i pary rzutu. **Nie ma pełnej okluzji skóry/rękawic ani przyklejenia śladów do siatki 3D**; pozostałe zasłonięcia wymagają pracy i odbioru.
- Świsty są obsługiwane dla gracza i CPU; typ wynika z rzeczywistej kończyny w metadanych trafienia, zamiast progu numeru klatki combo. Wyciszenie i pauza nadal obowiązują.
- Dostępne zatwierdzone głosy: Brax i Nyxa. Brak osobnych plików Vexy, Krova, Niny i Danny’ego. Ich uzupełnienie pozostaje otwarte.

## Ekrany, tryby, zapis i odporność

Zachowany kierunek wizualny i wszystkie ekrany. Przeszły automatyczne testy przepływów menu, instrukcji, ekranów wyboru, pauzy, błędów ładowania, filmów, wyników i rewanżu; nie zastępują oglądania układu na urządzeniu. Weryfikowane mapowania 38 wejść i zachowanie multi-touch. Trening, wyzwania, Arcade, Turniej, Survival i Walka nadal używają istniejących reguł nagród i jednorazowego zapisu; testy obejmują remisy i przenoszenie zdrowia.

Początkowo pobierane są tylko metadane Braxa i Nyxy potrzebne do inicjalizacji. Pozostałe ładowane przy wyborze pary. Dokładny rozmiar gzip wymaganych początkowo konfiguracji: 2 690 900 B zamiast 6 339 268 B (liczby z aktualnych konfiguracji; nie pomiar czasu sieci).

Żądania przygotowania par są kolejkowane; modele w parze ładowane kolejno, żeby uniknąć równoczesnej alokacji i wyścigu zwalniania. Niepotrzebne modele są zwalniane. Porażka części ładowania tekstur zwalnia już otrzymane tekstury i geometrię; możliwe ponowienie. Wyłączono zachowywanie bufora WebGL, ponieważ kopia do 2D następuje bezpośrednio po renderowaniu — obraz tej optymalizacji wymaga odbioru w Safari.

Utrata kontekstu WebGL pauzuje walkę i wejścia. Po przywróceniu odtwarzane są zasoby oświetlenia i resetowany stan przejść. Wznowienie wymaga przycisku pauzy. Testy zasobów używają atrap WebGL; rzeczywiste przywrócenie na GPU nie jest potwierdzone.

Diagnostyka na prawdziwym urządzeniu: `window.__BRAX_DIAGNOSTICS__.reset()` przed walką, potem `.report()`. Raport: maks. 3600 próbek, p50/p95/p99 czasu klatki, p95 pracy CPU, czasy zasobów, opcjonalna pamięć sterty JS. Sterta JS nie jest pamięcią GPU ani całej aplikacji. **Brak pomiarów fizycznego iPhone’a.** Tekstury zachowano w oryginalnej jakości.

## Otwarte warunki odbioru

1. Nagrania wszystkich sześciu postaci, obu stron, kontaktów, chwytów, recovery i KO; ocena stóp, dłoni, barków, przenikania, drżenia i zgodności widocznej kończyny z kolizją.
2. Oryginalne referencje Braxa i Nyxy w porównaniu z renderem; bez zmiany ich tożsamości.
3. Osobne zatwierdzone reakcje nóg i cztery brakujące zestawy głosów.
4. Pełna okluzja śladów twarzy i wizualna zgodność krwi/replay.
5. Dalsza kalibracja AI i combo z graczami, w tym pozostałe zwycięstwo spamu przeciw Krovowi.
6. Fizyczny iPhone: 3-minutowe walki każdej pary wymagającej największej pamięci, 20 zmian par, orientacja, tło aplikacji, wyciszenie, przerwanie sieci i przywrócenie WebGL. Zapis modelu telefonu, iOS, przeglądarki, pomiarów i filmu; żadnego domyślnego statusu PASS.
7. Oględziny wszystkich ekranów w małym/dużym widoku poziomym oraz komunikatu pionowego. Cel 60 FPS/p95 ≤ 20 ms dopiero po uzgodnieniu telefonu; obecnie niepotwierdzony.

Środowisko nie udostępnia fizycznego telefonu ani wymaganej przez procedurę Sites obsługi control-browser. Ta procedura zabrania zastępowania jej improwizowanym uruchomieniem przeglądarki. Z tego powodu nie ma filmów, zrzutów renderu ani wyniku odbioru wizualnego; są wyłącznie uczciwie opisane dowody kodu i symulacji.

## Odtwarzanie dowodów

`npm test`, `npm run test:repairs`, `npm run test:audit`, `npm run test:ai-matrix`, `node scripts/export-audit-master.cjs`, `npm run build`.
Wyniki danych: `docs/acceptance/`. Dodatkowe szczegóły dostawy: `DOSTAWA_TESTOWA.md`.


## Dodatkowa weryfikacja po zgłoszeniach 14.10 wieczorem
`audit-source-alignment.mjs` porównuje środki hitboxów z kośćmi oryginalnych animacji sześciu zawodników. Maksymalna różnica poniżej 0,001 piksela przestrzeni źródłowej. To potwierdza metadane względem riga, NIE kontakt powierzchni skóry w renderze ani okluzję.
`audit-new-model.mjs`: zachowanie wag wszystkich grup kości i skończone współrzędne skóry w próbkach animacji sześciu modeli, bez eksplozji siatki.
Historyczny `audit-source-motion.mjs` NIE PRZESZEDŁ progu ruchu stóp gardy < 6 px. Aktualna garda Braxa ma ruch stóp większy od tego progu. Nie podmieniono zatwierdzonej animacji ani nie obniżono progu, by uzyskać PASS. Konieczne oględziny rozróżniające zamierzony krok od ślizgania; wynik zapisano w acceptance/116-source-motion-failure.log.

Testy samego mechanizmu ukończenia wyzwań uzupełniono o rzeczywiste akcje uniku i odepchnięcia. Naprawiono brak zaliczenia geometrycznego uniku. Próba sterownika kontry pozostaje częściowo nieudana; nie jest uznana za dowód grywalności wszystkich sześciu postaci. Szczegóły i surowe wyniki: NAPRAWA_UI_KONTAKT_116.md.


### Aktualizacja 15 października, kandydat 117
Sprawdzone w przeglądarce: start/profil/menu, Survival, Wyzwania, karty i trening. Naprawiono nakładanie przycisków menu, alias Three.js w podglądzie i obsługę już rozpakowanych odpowiedzi gzip. Przeglądarka nie tworzy kontekstu WebGL, więc walka 3D, KO i chwyt nie mają odbioru wizualnego. Szczegóły i dowody w NAPRAWA_UI_KONTAKT_116.md. Pełny odbiór nadal OTWARTY.
