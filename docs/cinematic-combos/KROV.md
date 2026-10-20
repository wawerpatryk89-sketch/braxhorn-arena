# KROV — IRON JUDGMENT — UPPERCUT EXECUTION

**SPECYFIKACJA DLA WYKONAWCY. NIE WDROŻONE.** Ta karta uzupełnia obowiązujący `README.md` i `ASSETS.md` z tego folderu; wymaga prawdziwego dopasowania klipów i weryfikacji kontaktów.

## Tożsamość i cel
Ciężki pięściarz z łokciami, nie taniec: 2 szybkie ciosy, brutalny łokieć, krótki sierp/uppercut; 5 kontaktów w 2.7–3.4 s.

## Choreografia — momenty ORIENTACYJNE (nie twierdzimy, że są już zmierzone w FBX)
| # | Oś czasu | Klip źródłowy i ruch | Strefa kontaktu | Osobna reakcja ofiary | VFX/impact/shake |
|---:|---|---|---|---|---|
| 1 | 0.00–0.35 | `Jab Cross` — pierwszy jab | Głowa | krótkie szarpnięcie brody | mały stalowy błysk, 1 px shake |
| 2 | 0.35–0.70 | `Jab Cross` — drugi cross | Korpus (jeśli geometria pozwala) | odrębny `Big Kidney Hit` / własny HIT_BODY | miedziane iskry, 2 px shake |
| 3 | 0.70–1.34 | `Illegal Elbow Punch` — prawdziwy kontakt łokcia | Głowa z boku | boczne wytrącenie głowy | krótki łuk żelaznych iskier, 5 px shake |
| 4 | 1.34–2.15 | `Elbow Uppercut Combo` / `Elbow Punching` — wyciąć jedno najsilniejsze łokciowe uderzenie | Korpus / broda zgodnie z kończyną | inna reakcja szyi i pleców, nie dubel poprzedniej | pionowy miedziany trail, audio niskie THUD |
| 5 | 2.15–3.35 | `Uppercut` — skrócony kontakt z wyraźnym założeniem do wyrzutu | Broda | `Receiving A Big Uppercut` + bezszwowe FLY→spadanie / LAND | wąski rozbłysk srebrny, short slow 100 ms, shockwave, **13 px shake**, start pionowego lotu |

**Ważne:** w przypadku dwóch ciosów w jednym źródłowym klipie `Boxing`/`Jab Cross` nalicz trafienia wyłącznie dla dwóch faktycznie zaobserwowanych kontaktów. Jeśli po odcięciu klipu pozostała tylko jedna ręka, nie fabrykuj drugiej. We wszystkich etapach pozycję atakującego i ofiary trzeba adaptować pod 8 różnych mas/rigów.

## Finisher
Wysoki, pionowy wyrzut 1–1.5 wysokości ciała, potem twardy kontrolowany upadek; kamera bez przybliżeń, ground ring/kurz i drugi głuchy impact. Jeśli kamera nie nadąża, skaluj lot w obrębie czytelności bez zmiany rozmiaru postaci.

## Po COMBO — atakujący oraz ofiara
- **Cieszynka KROV:** `Yelling Out` — krótki okrzyk z uderzeniem pięści o dłoń, 0.6–0.9 s; bez sztucznego zoomu.
- **Kiedy KROV przyjmuje kombo innej postaci:** Jako OFIARA: `Shared Falling Back Death` / DOWN→gniewne dociśnięcie pięści do ziemi i szybki `Getting Up`; nie wstaje po KO.
- **W każdej walce:** odbiorca nielethal DOWN→RAGE→GETUP, realne KO pozostaje na ziemi; atakujący nie blokuje sterowania długim taunt. Dokładna lista dla wszystkich ofiar w `REACTIONS.md`.

## Materiały i ryzyka
Własne `Big Kidney Hit`, `Medium Hit To Head`, `Shared Falling Back Death`, `Flying Back Death`, `Getting Up`. Obecne combo 5.33 s — usunąć nieaktywne fragmenty, ale nie przesuwać hitboxów. Utrzymać autorytatywność.

## Polecenie dla wykonawcy
1. Przeczytaj globalny MASTER (`README.md`). Zrób skan po wszystkich własnych klipach postaci + zewnętrznym mocap Rokoko + Headspin ZIP, ustal zgodny segment po pozach i skeletonie. Nie modyfikuj już zaakceptowanych modeli/tekstur.
2. Przeprowadź pomiar 60 Hz i wyznacz prawdziwy kontakt dla każdego wiersza. Daj GIF/MP4 z markerami kontaktów, porównaniem od lewej i prawej, odmienną reakcją na każdy hit.
3. Wstaw spec tylko w istniejący specjalny ruch COMBO bez zmiany UI/sterowania. Reakcje, VFX, dźwięk i shake wywołuj wyłącznie po faktycznym trafieniu.
4. Zaimplementuj końcowy FLY/LAND z brakiem krawędzi podczas COMBO, odtwarzaj powalenie i gniew oraz anulowalną cieszynkę, z podziałem HP>0 / KO.
5. Przetestuj wszystkie 8 typów ofiar × 2 kierunki; także AI/multiplayer, blok/pudło/przerwanie, iPhone, powrót sterowania, brak przenikania postaci oraz brak czarnych pasków.
6. Zwróć dowody: logi, identyfikatory oryginalnych FBX, pomiary 60 Hz, video 1× i 0.25×, SHA clipów, screen nagranie real mobile. FAIL otwarte zgłaszać wprost; nie wrzucać 'gotowe' bez wizualnego odbioru.

**Kryterium:** cztery–pięć trafień, każde odmiennie odebrane, bez długiej stop-klatki, dramatyczne zakończenie, dynamiczny VFX ze smugą prawdziwej kończyny, wyraźny krótki wstrząs ekranu, angers+recovery i własna cieszynka. Nie zmieniono żadnej z już zaakceptowanych kart zawodników ani aren.