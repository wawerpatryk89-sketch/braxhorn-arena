# BRAxHORN ARENA FIGHTER — CINEMATIC COMBO MASTER (8 zawodników)

**Status: SPECYFIKACJA DLA WYKONAWCY, nie deklaracja implementacji ani wdrożenia.** Podstawą jest main 934acf4 (19.10.2026) oraz porównawczo istniejąca gałąź combo-brax-bull-breaker (80189b8); gałąź z dokumentacją nie zmienia działania gry. Tylko pierwszy kombo prototyp Braxa przed roll-outem reszty, ale projekt i instrukcje dla wszystkich 8 są poniżej.

## Cele i zasady niepodlegające negocjacji
1. Tworzyć filmowe, wyraźne KOMBO postaci po jednym **istniejącym wejściu COMBO** (specjalna akcja), a nie zastępować go sześcioma zwykłymi kliknięciami. Gałąź `combo-brax-bull-breaker` ma osobny łańcuch P1/P2/K1/GRAB/P2/K2: to **nie jest automatycznie** poszukiwane specjalne COMBO. Nie usuwać obecnego sterowania, AI, network, aren, postaci ani UI.
2. W każdym kombie 4–5 **rzeczywistych** uderzeń, czytelnie innych, 2.6–3.6 s części atakującej (wyjątek przy przydatnym rzeczywistym ruchu). 100% trafień musi pochodzić z realnych kontaktów hitboxów, nie z zegara ani grafiki. **Każdy HIT ma inną reakcję ofiary**, zależną od strefy i siły. Zastosować najpierw własne reakcje ofiary; dopiero potem 10 unikatowych klipów z nowego ZIP oraz istniejące Rokoko.
3. Zaprojektować stopniowanie: 2 pierwsze uderzenia szybkie, środkowe cięższe, przed finisherem krótki 'anticipation' 90–160 ms w animacji wizualnej (nie długie zatrzymanie całej gry), ostatni cios z eksplozją i realnym dalekim odrzutem albo wysokim podrzutem i twardym lądowaniem. Nie powtarzać bez sensu tej samej animacji kończyn.
4. HITSTOP: lekki 25–38 ms, średni 36–55 ms, decydujący 55–85 ms. Są to CELE, do oceny przy 60 fps; nie robić długiej stop-klatki. Finisher może mieć 0.30–0.45× na 80–140 ms **bez zamrożenia** pozostałych systemów, potem krótki 1.4–1.9× odrzut. W sieci animacyjna warstwa slow-motion lokalna, fizyka i damage pozostają deterministyczne/autorytatywne.
5. **VFX:** mały flash przy kontakcie, dopasowany do strefy; smuga po rzeczywistej dłoni/stopie o żywotności 65–120 ms, ring uderzenia, iskry/pył proporcjonalne do siły, finisher: radialny ring, krótki chromatyczny akcent (tylko jeśli czytelny), dwa uderzenia basowe (kontakt i lądowanie), kurz i shockwave z podłoża; nie zasłaniać postaci i HUD. Brak automatycznej krwi/sprzętu/ognia w każdym ruchu.
6. **SCREEN SHAKE:** lekkie 1–2 px / 45–65 ms; średnie 3–5 px / 65–90 ms; finisher 9–14 px / 110–160 ms w referencyjnym 844×390, wygaszenie wykładnicze. Potrząsać warstwą renderingu świata z overscanem, bez czarnych pasków; NIE robić cięć kamery, zoomów, obracania areny ani ruchu kamery w animacji tła. Drganie nie może dezorganizować sterowania/HUD. Zmniejszenie efektów w ustawieniach ułatwień dostępu.
7. **Brak ścian / granic dla COMBO.** Uderzenie i lot można prowadzić przez kolejne bezszwowe fragmenty tej samej areny. Nie zatrzymywać ofiary niewidzialną krawędzią, nie cofać jej, nie teleportować, nie dodawać wall-bounce. Na czas special COMBO osobny ciągły worldX i camera-follow poziomy, world asset tła rozszerzony/tiling bez szwów, a po lądowaniu łagodne przejście do zwykłego trybu. Sprawdzić filmowe areny: powtarzający się klip nie gwarantuje bezszwowego przewijania X.
8. **Po finisherze:** ofiara leży 200–400 ms, następnie **jedna wiarygodna złość** (pięść w ziemię / agresywne poruszenie barkami i głową / napięcie dłoni, 300–550 ms) i szybko wstaje do gardy (450–700 ms), o ile HP>0. Złość nie może wywołać kolizji z podłożem ani teleporować korzenia. Równolegle atakujący uruchamia osobisty taunt/cieszynkę o długości do 0.6–0.9 s; przy zwykłej walce animacja anulowalna kierunkiem, gardą lub atakiem. Przy rzeczywistym KO ofiara nie wstaje i nie udaje złości, stosować końcowy KO/WIN zgodnie z logiką rundy.
9. Klip `PunchingtheGround_HUMANIK_769` z Rokoko **NIE JEST** automatyczną złością na ziemi: źródło zaczyna stojąc, przechodzi do klęku i dopiero wali w podłogę. Wymaga wycięcia, adaptacji do upadku poszczególnego riga i dowodu ciągłości stóp/bioder. W razie braku zgodnej animacji wykonać ostrożny addytywny gest górnej części ciała z prawdziwej pozycji DOWN; nie zgłaszać ukończenia bez skinned-mesh video.
10. **Etyka danych i licencja:** 152 FBX z wcześniejszego audytu i nowy ZIP z 11 FBX to pula kandydatów, NIE zweryfikowana produkcyjna biblioteka wszystkich ruchów. Oficjalny darmowy pakiet 263 Rokoko dopuszcza komercyjny użytek, ale dla każdego źródła trzeba ustalić pochodzenie i warunki. Nie kopiować wizerunków ani znaków postaci filmowych z nazw plików.

## Rzeczywista struktura projektu
- `game/assets/{brax,nyxa,vexa,krov,nina,danny,bear,demon}-new/manifest.json` — aktualne nazwy 299 wpisów klipów; 85 pozycji bez aktywnego odniesienia według audytu; nie mylić ze 299 różnymi plikami.
- `game/assets/{...}-new/config.json` — aktualne sloty, hitboxy i dotychczasowe COMBO. Zmieniaj tylko właściwe sloty z jednoznaczną zgodą, zachowaj migawkę SHA-256.
- `game/assets/combat.js` — logika ataku, hitstop, downState/FLY, sieć i synchronizacja; `fighter-source-core.js`, `fighter-source.js` — źródłowe pozy i loader; `arena-effects.js`, `blood-effects.js`, `ko-replay.js`, `victory.js` — istniejące efekty, KO i zwycięstwa. Najpierw użyć/reużyć, a nie dublować architekturę.
- `source-assets/bull-breaker/provenance.json` na istniejącej gałęzi `combo-brax-bull-breaker` dokumentuje jeden już zretargetowany ruch `Jumping_ROM_HUMANIK_WHS.fbx` z paczki Rokoko. Surowe paczki nie znajdują się obecnie na `main` — patrz `ASSETS.md`.

## Format realizacji dla wykonawcy — każda postać
1. Zmapuj ruchy wejściowe i ofiary na rzeczywiste klipy źródłowe; zachowaj oryginały. Zewnętrzne FBX → parse → segmenty z fazą START/ACTIVE/RECOVERY → retarget bind pose → korekta osi i stóp → próbkowanie 60Hz → jeden klip runtime z opisem SHA-256 i pochodzenia.
2. Dla każdej pozycji tabeli zawodnika zmierz klatkę kontaktu ręki/stopy, rysunek sylwetki i reakcję. Wymagany prawdziwy hitbox na tej kończynie w tej klatce, a nie duży zasięg sztuczny. Samo naciśnięcie przycisku nie tworzy szkody, VFX ani reakcji.
3. Emisja jednego `confirmedComboHit` (id serii, hit index, bone, strefa, siła, world point, seed FX, timestamp). Unikać dubli grup obrażeń, nadpisywania bloków/uników i ingerowania w damage CPU; wielkość obrażeń ocenić po skuteczności, nie po liczbie iskier.
4. Reaction router: priorytet unikalnej animacji danej postaci, prawidłowe stopy i biodra, łagodne 70–120 ms blend do następnego uderzenia; rzeczywisty odrzut po fizycznym kontakcie, zero losowych obrotów, zsynchronizować zakończenie z nowym ciosem.
5. Intensywność efektów rośnie z hit index, ale nie powtarza identycznego flasza. Efekty i audio oparte o kontakt. VFX niższa jakość na wolnym GPU, bez filtrowania całego ekranu. Lekka haptics wyłącznie tam, gdzie API pozwala (iOS Safari nie obiecywać navigator.vibrate).
6. Po finałowym trafieniu zastosuj fizycznie czytelną trajektorię FLY→LAND→DOWN, nie dwie niezależne animacje z teleportem. Odrzut docelowo 3–6 szerokości ciała w 0.4–0.8 s lub wysokość 0.8–1.5 × wysokości ciała + opadanie; dostosuj do riga, areny i czytelności widoku. Przestrzeń po stronie odrzutu musi być nieskończona w COMBO.
7. `AFTER_COMBO`: przy HP>0 down→rage→GETUP i attacker→short personal TAUNT, z anulowaniem tauntu i przywróceniem walki; przy HP=0 KO bez GETUP. Reakcje na własne otrzymane COMBO są opisane w sekcji każdego zawodnika poniżej i wywoływane przez typ OFIARY, nie napastnika.
8. Bez edycji sylwetek, proporcji, kości, materiałów, tekstur, logotypów, wyboru postaci, UI i zwykłych 10 ataków. Brak zmiany sterowania: istniejący special COMBO. Jeśli reużywasz branch `combo-brax-bull-breaker`, nie nazywaj jego zwykłego łańcucha specjalnym COMBO.
9. Po każdym etapie: obustronne kierunki, 8×8 pojedynków, AI easy/normal/hard, gracz+CPU+host+gość multiplayer, hit/block/miss/evade, środek i skraj ekranu, różne areny, tryb normal/training/tournament, KO vs knockdown, obrót, animacja 30→60 Hz, brak stopy pod ziemią i brak paska na iPhone.
10. Oddaj: klipy źródłowe i fragmenty z hashami, JSON mapowania, skrypt retarget/test, raport 60Hz hit contact, krótki proof wideo 16:9 dla każdej postaci (także slow 0.25× i normal 1×), nagranie iPhone/Android i raport wydajności. **Nie wdrażaj na produkcję bez potwierdzenia wizualnego**, nie deklaruj QA na prawdziwym iPhone jeśli go nie wykonałeś.

## Referencje techniczne (nie kopiować cudzych grafik)
- Capcom — hitstop i po stronie trafiającej i otrzymującej: https://game.capcom.com/cfn/sfv/column/131545?lang=en
- Capcom — VFX Street Fighter 6 i fala efektu kontaktu: https://www.streetfighter.com/6/es-es/column/detail/effects01
- Bandai Namco — reakcje Heat Dash / Heat Smash: https://en.bandainamcoent.eu/tekken/news/tekken-8-new-info-about-gameplay-mechanics-rage-and-heat-systems-new-control-schemes
- Epic — parametry i ograniczenia camera shake: https://dev.epicgames.com/documentation/unreal-engine/camera-shakes-in-unreal-engine
- Three.js — retargetClip: https://threejs.org/docs/pages/module-SkeletonUtils
- Rokoko — oficjalne darmowe zasoby i warunki tej kolekcji: https://www.rokoko.com/resources/download-263-rokoko-motion-capture-assets
- Badanie 'impact feel' — stopklatka, spójność dźwięku i kamera: https://arxiv.org/abs/2208.06155

## Odbiór (wykonawca musi zwrócić PASS/FAIL z dowodami)
- Każde z 4–5 uderzeń wygląda inaczej; każda reakcja ofiary wygląda inaczej i logicznie odpowiada strefie kontaktu; źródła podane dokładnie; każdy event obrażeń jest unikalny.
- Finał zawiera realny wyrzut / slam, ruch rozciąga się ponad dotychczasowy viewport, bez krawędzi ani teleportu, obraz naprawdę krótko drży, smugi są przypięte do kończyny i czuć basowy impact.
- Ofiara nielethal leży→wyraża złość→szybko wstaje; atakujący ma indywidualną cieszynkę; KO nie wstaje.
- Każdy wariant działa przeciw pozostałym siedmiu postaciom i mirror, z lewej i prawej oraz bez przycięć na iPhone. Brak regresji w CPU, sieci, wynikach, zwykłych atakach i wyjściu z gry.

## Kolejność
1. BRAX: jedna arena, zestaw pełnych uderzeń i reakcji przeciw wszystkim ośmiu zawodnikom, odpalenie przez istniejący SPECIAL COMBO, nie zwykły łańcuch. Video capture 1×, 0.25×, QA.
2. Dopiero potem NYXA, VEXA, KROV, NINA, DANNY, BEAR, DEMON na tej samej architekturze i wspólnym routerze reakcji, ale z innymi animacjami i efektami. Po walidacji na wszystkich arenach.

**Pliki szczegółowe:** BRAX.md, NYXA.md, VEXA.md, KROV.md, NINA.md, DANNY.md, BEAR.md, DEMON.md; ASSETS.md.