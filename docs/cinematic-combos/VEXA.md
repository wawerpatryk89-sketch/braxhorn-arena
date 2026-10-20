# VEXA — CYCLONE CUT — SKY PIERCER

**SPECYFIKACJA DLA WYKONAWCY. NIE WDROŻONE.** Ta karta uzupełnia obowiązujący `README.md` i `ASSETS.md` z tego folderu; wymaga prawdziwego dopasowania klipów i weryfikacji kontaktów.

## Tożsamość i cel
Akrobatyczna rotacja: krótka bokserska dwójka, stopa na korpus, spin i latający kopniak. 5 kontaktów w 3.0–3.5 s.

## Choreografia — momenty ORIENTACYJNE (nie twierdzimy, że są już zmierzone w FBX)
| # | Oś czasu | Klip źródłowy i ruch | Strefa kontaktu | Osobna reakcja ofiary | VFX/impact/shake |
|---:|---|---|---|---|---|
| 1 | 0.00–0.38 | `Boxing (2)` — pierwszy faktyczny punch | Głowa | odchylenie głowy lekkie | biało-błękitny flash, 1 px shake |
| 2 | 0.38–0.70 | `Boxing (2)` — drugi odmienny punch | Korpus / głowa wg źródła | inny `Hit Reaction`, bardziej po przekątnej | cyjanowa smuga 75 ms, suchy hit |
| 3 | 0.70–1.30 | `Pontera` — szybki kopniak z obrotem biodra | Bok korpusu | krótkie złożenie ofiary na stronę | poświata stopy, cyjanowy pył, 3 px shake |
| 4 | 1.30–2.28 | `Armada` — szeroka rotacja, jedna realna aktywna klatka | Szczęka / bok głowy | odrębne rozchwianie i cofnięcie korzenia | półokrąg turkusowo-srebrnej smugi; audio whoosh; 5 px shake |
| 5 | 2.28–3.45 | `Flying Kick` — krótki mocny napad powietrzny | Środek klatki piersiowej w locie | `Flying Back Death` lub `Falling Back Death` + launch, bez podwójnego udawanego trafienia | silna smuga wzdłuż trajektorii nogi, 110 ms 0.4×, cyjanowy błysk, 13 px shake, podwójny bas |

**Ważne:** w przypadku dwóch ciosów w jednym źródłowym klipie `Boxing`/`Jab Cross` nalicz trafienia wyłącznie dla dwóch faktycznie zaobserwowanych kontaktów. Jeśli po odcięciu klipu pozostała tylko jedna ręka, nie fabrykuj drugiej. We wszystkich etapach pozycję atakującego i ofiary trzeba adaptować pod 8 różnych mas/rigów.

## Finisher
Długi, szybki lot poziomo od widocznej stopy; przeciwnik koziołkuje tylko na zgodnym klipie, ląduje nie przed atakującym. Bez fizycznej ściany i bez bocznych blackbars.

## Po COMBO — atakujący oraz ofiara
- **Cieszynka VEXA:** `Victory`: krótki triumfalny gest dłoni + pozycja bojowa, 0.6–0.8 s.
- **Kiedy VEXA przyjmuje kombo innej postaci:** Jako OFIARA: `Falling Back Death` / DOWN→walenie raz pięścią o ziemię z frustracji→`Shared Kip Up`. Utrzymać stały pivot i dopasować biodra z ziemią.
- **W każdej walce:** odbiorca nielethal DOWN→RAGE→GETUP, realne KO pozostaje na ziemi; atakujący nie blokuje sterowania długim taunt. Dokładna lista dla wszystkich ofiar w `REACTIONS.md`.

## Materiały i ryzyka
Własne reakcje Vexy: `Hit Reaction`, `Receiving An Uppercut`, `Receive Uppercut To The Face`, `Falling Back Death`, `Flying Back Death`, `Shared Kip Up`. Pierwsze dwa kontakty z Boxing (2) policzyć jako dwie różne grupy tylko jeśli rzeczywiste.

## Polecenie dla wykonawcy
1. Przeczytaj globalny MASTER (`README.md`). Zrób skan po wszystkich własnych klipach postaci + zewnętrznym mocap Rokoko + Headspin ZIP, ustal zgodny segment po pozach i skeletonie. Nie modyfikuj już zaakceptowanych modeli/tekstur.
2. Przeprowadź pomiar 60 Hz i wyznacz prawdziwy kontakt dla każdego wiersza. Daj GIF/MP4 z markerami kontaktów, porównaniem od lewej i prawej, odmienną reakcją na każdy hit.
3. Wstaw spec tylko w istniejący specjalny ruch COMBO bez zmiany UI/sterowania. Reakcje, VFX, dźwięk i shake wywołuj wyłącznie po faktycznym trafieniu.
4. Zaimplementuj końcowy FLY/LAND z brakiem krawędzi podczas COMBO, odtwarzaj powalenie i gniew oraz anulowalną cieszynkę, z podziałem HP>0 / KO.
5. Przetestuj wszystkie 8 typów ofiar × 2 kierunki; także AI/multiplayer, blok/pudło/przerwanie, iPhone, powrót sterowania, brak przenikania postaci oraz brak czarnych pasków.
6. Zwróć dowody: logi, identyfikatory oryginalnych FBX, pomiary 60 Hz, video 1× i 0.25×, SHA clipów, screen nagranie real mobile. FAIL otwarte zgłaszać wprost; nie wrzucać 'gotowe' bez wizualnego odbioru.

**Kryterium:** cztery–pięć trafień, każde odmiennie odebrane, bez długiej stop-klatki, dramatyczne zakończenie, dynamiczny VFX ze smugą prawdziwej kończyny, wyraźny krótki wstrząs ekranu, angers+recovery i własna cieszynka. Nie zmieniono żadnej z już zaakceptowanych kart zawodników ani aren.