# Dopytanie o wersję 143 — progi, korekty i diagnostyka

Źródło audytu 143: `90f65b34d3b0a01566d24b51c6de32accd227d10`. Aktualizacja zmienia wyłącznie obsługę konfliktów predykcji, diagnostykę i testy. Ruchy, konfiguracje, mastery i grafika nie są edytowane.

## 1. Reset hitSeries

`abs(bodyA.x-bodyB.x) > radiusA+radiusB+0.35*sourceHeight()` przez co najmniej **600 ms naliczanego czasu symulacji**. Jest to odstęp między obwiedniami ciał większy niż 35% wysokości źródłowej postaci, a nie stała odległość korzeni w procentach areny. Powrót do progu lub poniżej zeruje licznik oddalenia. Normalne wygaśnięcie to **3500 ms**; trafienia nie wydłużają tego stałego okna. Hitstop/pauza zatrzymują naliczanie, więc 600 ms nie oznacza gwarantowanych 600 ms zegara ściennego. Krok symulacji to 1000/60 ms, stąd kwantyzacja progu do kroku. Dodatkowe resety zachodzą m.in. przy bloku, powaleniu i nowej rundzie.

| Widok | Wysokość źródłowa | Wymagana przerwa między ciałami | Odstęp środków w przykładowym IDLE |
|---|---:|---:|---:|
| 844×390 | 217.60 px | >76.16 px (9.024% szerokości) | >130.76 px |
| 932×430 | 239.96 px | >83.99 px (9.011% szerokości) | >144.20 px |
| 390×844 | 140.25 px | >49.09 px (12.587% szerokości) | >84.28 px |

Przykładowe promienie dotyczą bieżącej pozycji IDLE w harnessie, nie każdej klatki każdego zawodnika. Pionowy widok podano wyłącznie jako obliczenie geometrii; gra wtedy wstrzymuje walkę.

## 1b. Ranking: progi i wyliczenie

**Progi są identyczne na poziomach easy, normal i hard.** Serwer nie używa poziomu trudności w funkcji minimumMatchTime. Tryby różnią się liczbą rund i uwzględnianiem przenoszonego HP w Survival. Nie ma osobnych mnożników progów dla kolejnych etapów Survival.

| Zawodnik | Obliczony idealny KO (ms) | Minimum wygranej rundy (ms) | Fight / Arcade / Tournament 2:0 (ms) | Survival 1:0 (ms) |
|---|---:|---:|---:|---:|
| BRAX | 5878.246713 | 4702 | 9404 | 4702 |
| NYXA | 6865.829777 | 5492 | 10984 | 5492 |
| VEXA | 6517.160200 | 5213 | 10426 | 5213 |
| KROV | 5915.949796 | 4732 | 9464 | 4732 |
| NINA | 5139.938696 | 4111 | 8222 | 4111 |
| DANNY | 7155.276903 | 5724 | 11448 | 5724 |

Wszystkie cztery kolumny obowiązują dla ŁATWEGO, ŚREDNIEGO i TRUDNEGO. Trening nie przyjmuje wyniku do rankingu. Globalna dolna granica wygranej rundy to 4111 ms (Nina), zwycięskiego meczu dwurundowego 8222 ms, a zwycięstwa Survival 4111 ms. Dla wybranego zawodnika serwer używa jego własnego, zwykle wyższego progu.

`minimumMeczu = wygraneRundy*minimumZawodnika + przegraneRundy*4111 + remisy*60000`.

W Survival składnik przegranej rundy wynosi **0 ms**, bo zdrowie przechodzi z poprzedniej walki; taka porażka nie jest zwycięstwem rankingowym. Przykład Brax 2:1: `2*4702+4111=13515 ms`; 2:0: `9404 ms`. **Serwer sprawdza łączny elapsed, nie oddzielne czasy rund** — nie otrzymuje osobnych czasów każdej rundy. Nie wolno interpretować tabeli jako wdrożonej per-rundowej walidacji.

Wyliczenie: klatki pełnych akcji sumują `duration/rate`; rate uwzględnia istniejące 1.10, 0.93 Niny, playbackRate i phaseTempo (contactRecovery ma rate=1). Obrażenia liczone raz na grupę trafień. Programowanie dynamiczne wybiera pełne cykle, a ostatni cios kończy na prefiksie dochodzącym do KO. Zakładamy wszystkie trafienia, brak dojścia i hitstop, nieskończoną energię; wynik mnożony przez 0.8 i zaokrąglany w dół. To konserwatywny filtr z 20% marginesem, nie dowód najszybszego osiągalnego KO w pełnej symulacji.

| Zawodnik | Świadek obliczenia: pełne akcje, następnie prefiks końcowy |
|---|---|
| BRAX | 2×CAPOEIRA (1030.303 ms, 14 HP) + 3×UPPERCUT (811.688 ms, 12 HP) + prefiks COMBO (1382.576 ms, 36 HP) |
| NYXA | 10×LIGHT_PUNCH (522.947 ms, 7 HP) + prefiks COMBO (1636.364 ms, 32 HP) |
| VEXA | 7×SPIN_KICK (899.908 ms, 14 HP) + prefiks HEAVY_PUNCH (217.803 ms, 5 HP) |
| KROV | 7×UPPERCUT (808.081 ms, 13 HP) + prefiks UPPERCUT (259.384 ms, 13 HP) |
| NINA | 6×MEIA_LUA (735.825 ms, 13 HP) + prefiks COMBO (724.987 ms, 23 HP) |
| DANNY | 8×HEAVY_PUNCH (850.000 ms, 11 HP) + prefiks COMBO (355.277 ms, 12 HP) |

Dokładne wartości, kolejność i pełna macierz 6×4×3: `ranking-derivation-143.json`; odtworzenie: `node scripts/audit-ranking-derivation.cjs`. Nie zmieniono progów wersji 143.

## 2. Sporne korekty — testy deterministyczne

36 przypadków: host Brax/gość Nyxa, cztery scenariusze × 30/60/120 Hz × opóźnienie dostarczenia 0/48/96 ms. Host wykonuje trafienie przed odebraniem/obsłużeniem ataku gościa, wymusza odpychanie, rozpoczyna źródłowy chwyt lub potwierdza atak. Testy porównują kolejne pozycje oraz klatki przy tym samym actionId. Nie jest to pomiar urządzenia ani wszystkich par zawodników.

| Zegar testowy | Max Δx przed | Max Δx po | Cofnięte klatki ataku przed/po | Błędnie pozostawione klatki predykcji po trafieniu przed/po |
|---|---:|---:|---:|---:|
| 30 Hz | 2.000% | 2.000% | 0 / 0 | 3 / 0 |
| 60 Hz | 1.000% | 1.000% | 0 / 0 | 3 / 0 |
| 120 Hz | 0.500% | 0.500% | 0 / 0 | 6 / 0 |

W 143 predykcja ataku mogła przykryć reakcję na trafienie do otrzymania ack; teraz spadek HP lub autorytatywne controlBlocked przerywa ją natychmiast po odbiorze snapshotu. Host wysyła blokadę sterowania wynikającą z już istniejącego stun/pushTime/downState/chwytu. Gość nie przewiduje wtedy własnego chodzenia. Przy odpychaniu test wymaga zgodnego kierunku pierwszej korekty. Sam limit poziomej korekty pozostaje bez zmian: `0.06*min(dt,50)` punktu procentowego szerokości areny na klatkę, maksymalnie 3%. Po ustanowieniu pierwszego stanu nie ma jednorazowego przestawienia x na pozycję hosta. To ograniczenie liczbowe, nie gwarancja niezauważalności na każdym telefonie. Przełączenie atak → trafienie jest prawidłowym przerwaniem akcji, nie cofnięciem klatek tego samego ataku.

Wyniki jednostkowe: `verification/network-conflicts-v143.json` i `verification/network-conflicts.json`. Skrypt: `audit-network-conflicts.cjs`.

## 3. Jitter 46 ms i prawdziwy RAF

**NIEWYKONANE: pomiar p95/max przemieszczeń przed i po buforze na prawdziwym RAF.** W środowisku nie ma wspieranego control-browser; Sites zabrania zastępczej instalacji/uruchomienia przeglądarki do QA. Nie podmieniono tego wymogu na zegar VM i nie przedstawiamy poprzednich 16 ms jako wyniku RAF. Wartość 46.67 ms była p95 sztucznego strumienia pakietów w starym teście, nie dowodem jakości renderowania.

Nowa nakładka używa timestampów prawdziwego requestAnimationFrame na urządzeniu. Raportuje p95/max `abs(x[n]-x[n-1])` oraz p95/max zmiany tego przesunięcia (`stepChangeArenaPercent`), osobno dla obu postaci. Rejestruje maksymalnie 3600 próbek aktywnej walki, pomija pauzę/tło i zapisuje trace timestampów i pozycji. Test jednostkowy sprawdza arytmetykę na nierównych timestampach; nadal nie jest pomiarem rzeczywistego RAF.

## 4–5. Pliki i SHA-256

Pełne 98 wierszy SHA-256 wersji 138 i 143 obok siebie: `asset-evidence-143.md`, `hashes143-v138.tsv`, `hashes143-v138.json`. Wszystkie są IDENTICAL. Ten dowód dotyczy bajtów Git, nie całej logiki rendererów.

Każdy z 15 usuniętych lokalnych plików areny, klasyfikacja (7 przeniesień bez zmiany bajtów, 8 zastąpionych wariantów), polecenie rg, wyniki kod/build/dist oraz test 19 dynamicznych ścieżek są w `asset-evidence-143.md`. Sam grep nie jest dowodem wszystkich możliwych dynamicznych adresów; dodatkowy test wykonuje rzeczywiste ścieżki wyboru i startu aren w mock DOM. Stary cache telefonu nie został skontrolowany.

## 6. Nakładka na telefonie

Pięć tapnięć w ciągu 2.5 s w napis BRAXHORN w nagłówku wyboru postaci albo w środkowym HUD walki. Można też tapnąć pięć razy w grafikę tytułową poza przyciskiem START. Nakładka pokazuje FPS, p95 klatki, ping, jitter p95, opóźnienie wejścia p95 wraz z liczbą próbek oraz rolę host/guest/offline. Dodatkowo Δx p95/max i liczbę cofniętych klatek ataku. RESET czyści próbki, JSON pobiera raport i ślad, ZAMKNIJ wyłącza jej RAF.

Ping WebRTC to istniejący RTT ping/pong; fallback HTTP to czas żądania, oznaczony jako http (to nie identyczna miara). Brak danych wyświetlany jest jako —, nigdy jako zero. Opóźnienie wejścia oraz jitter snapshotów są obecnie mierzone u gościa; u hosta bez próbek pozostają —. Nakładka nie wysyła dodatkowych pakietów i nie zmienia symulacji.

Na obu telefonach otworzyć nakładkę, rozpocząć walkę, RESET, mierzyć co najmniej 30 s, pobrać JSON. Powtórzyć po zamianie hosta oraz przy Wi-Fi/sieci komórkowej. Porównać jitter rzeczywiście zapisany w tych sesjach; nie zakładać, że wynosi 46 ms. Wizualna obsługa pięciu tapnięć i eksport na iOS/Androidzie pozostają do fizycznego sprawdzenia.


## Wyniki końcowe

PASS: npm test, npm run test:repairs, npm run test:audit, npm run test:duel-api; audit-network-conflicts (36), audit-network-render, audit-duel-engine, audit-duel-controls (49), audit-peer-wire, audit-peer-link, audit-diagnostics, audit-ranking-derivation, audit-asset-evidence, audit-deleted-arena-paths, audit-fighter-asset-package oraz npm run build. 98 plików źródłowych również w bieżącym checkout jest identycznych z 143. Logi: docs/verification/followup-*.log.

NIEWYKONANE: pomiar prawdziwego RAF przed/po buforze przy jitterze 46 ms, fizyczny iPhone/Android i wizualny test nakładki. Nie uruchamiano ponownie pełnego test:online z lokalną D1; API duelu i transport przeszły wymienione testy, a backend nie był zmieniany. Skan build/dist dotyczy bieżącego builda z diagnostyką i niezmienionym katalogiem aren; nie pobrano ponownie historycznego archiwum wdrożenia 143.
