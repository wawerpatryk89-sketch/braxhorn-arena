# DEMON — ABYSS CRASH — RAGE COLLISION

**SPECYFIKACJA DLA WYKONAWCY. NIE WDROŻONE.** Ta karta uzupełnia obowiązujący `README.md` i `ASSETS.md` z tego folderu; wymaga prawdziwego dopasowania klipów i weryfikacji kontaktów.

## Tożsamość i cel
Agresywny boss, najpierw brutalne realne ciosy, potem szybki niepowstrzymany finisher. 4–5 kontaktów w 2.7–3.4 s; wykorzystać 38 nieprzypisanych klipów.

## Choreografia — momenty ORIENTACYJNE (nie twierdzimy, że są już zmierzone w FBX)
| # | Oś czasu | Klip źródłowy i ruch | Strefa kontaktu | Osobna reakcja ofiary | VFX/impact/shake |
|---:|---|---|---|---|---|
| 1 | 0.00–0.33 | `Punching` — szybki cios | Głowa | krótki `Medium Hit To Head` / własny HEAD | czerwony mikrobłysk 25 ms |
| 2 | 0.33–0.84 | `Hook Punch` — uderzenie pięścią w bok | Korpus lub szczęka po pomiarze | `Hit To Body` lub reakcja bocznego odrzutu | ciemnoczerwona smuga łuku, 4 px shake |
| 3 | 0.84–1.51 | `Headbutt` — bliski rzeczywisty kontakt głowy | Czoło / twarz | osobny odchył ofiary, nie `Receiving Uppercut` | krótki czarny ring, bas, 5 px shake |
| 4 | 1.51–2.20 | `Hurricane Kick` — mocny obrót nogi | Głowa/bark przy prawdziwym zasięgu | wykręcenie tułowia w drugą stronę | krwistoczerwony spiralny trail, nie pełna zasłona obrazu |
| 5 | 2.20–3.35 | `Hell Slammer A` tylko z kompatybilnym partnerem, w przeciwnym razie wybrany realny ostatni impuls z `Roundhouse Kick` | Korpus/rzut (tylko przy faktycznym kontakcie) | `Flying Back Death` + FLY/LAND | akcent 100 ms 0.35×, niski czarno-czerwony shockwave, 13 px shake, grzmot basowy i chmura pyłu |

**Ważne:** w przypadku dwóch ciosów w jednym źródłowym klipie `Boxing`/`Jab Cross` nalicz trafienia wyłącznie dla dwóch faktycznie zaobserwowanych kontaktów. Jeśli po odcięciu klipu pozostała tylko jedna ręka, nie fabrykuj drugiej. We wszystkich etapach pozycję atakującego i ofiary trzeba adaptować pod 8 różnych mas/rigów.

## Finisher
Błyskawiczny odrzut z odwróceniem impetu w dół, jeśli odpowiedni klip naprawdę to umożliwia; nie generować nowego 'magicznego ciosu' bez źródła. Bez ścian i bez nieskończonej pionowej wysokości kadru; przeciwnik musi wylądować w czytelnym planie walki.

## Po COMBO — atakujący oraz ofiara
- **Cieszynka DEMON:** `Yelling Out`: krótki ryk, mocny wyprost i zaciskanie pięści, bez przybliżania kamery.
- **Kiedy DEMON przyjmuje kombo innej postaci:** Jako OFIARA: `Shared Falling Back Death` / `Knocked Out` w niekończącym wariancie down→zaciśnięcie łapy/pięści i jedno gniewne uderzenie w ziemię→`Getting Up`. Przy prawdziwym KO zero GETUP.
- **W każdej walce:** odbiorca nielethal DOWN→RAGE→GETUP, realne KO pozostaje na ziemi; atakujący nie blokuje sterowania długim taunt. Dokładna lista dla wszystkich ofiar w `REACTIONS.md`.

## Materiały i ryzyka
Źródła własne: `Punching`, `Hook Punch`, `Headbutt`, `Hurricane Kick`, `Roundhouse Kick`, `Hell Slammer A`, `Medium Hit To Head`, `Flying Back Death`, `Getting Up`, `Yelling Out`. Nie wprowadzać nieuzasadnionego ognia/fantastycznych rekwizytów; efekty symboliczne, dopasowane do postaci.

## Polecenie dla wykonawcy
1. Przeczytaj globalny MASTER (`README.md`). Zrób skan po wszystkich własnych klipach postaci + zewnętrznym mocap Rokoko + Headspin ZIP, ustal zgodny segment po pozach i skeletonie. Nie modyfikuj już zaakceptowanych modeli/tekstur.
2. Przeprowadź pomiar 60 Hz i wyznacz prawdziwy kontakt dla każdego wiersza. Daj GIF/MP4 z markerami kontaktów, porównaniem od lewej i prawej, odmienną reakcją na każdy hit.
3. Wstaw spec tylko w istniejący specjalny ruch COMBO bez zmiany UI/sterowania. Reakcje, VFX, dźwięk i shake wywołuj wyłącznie po faktycznym trafieniu.
4. Zaimplementuj końcowy FLY/LAND z brakiem krawędzi podczas COMBO, odtwarzaj powalenie i gniew oraz anulowalną cieszynkę, z podziałem HP>0 / KO.
5. Przetestuj wszystkie 8 typów ofiar × 2 kierunki; także AI/multiplayer, blok/pudło/przerwanie, iPhone, powrót sterowania, brak przenikania postaci oraz brak czarnych pasków.
6. Zwróć dowody: logi, identyfikatory oryginalnych FBX, pomiary 60 Hz, video 1× i 0.25×, SHA clipów, screen nagranie real mobile. FAIL otwarte zgłaszać wprost; nie wrzucać 'gotowe' bez wizualnego odbioru.

**Kryterium:** cztery–pięć trafień, każde odmiennie odebrane, bez długiej stop-klatki, dramatyczne zakończenie, dynamiczny VFX ze smugą prawdziwej kończyny, wyraźny krótki wstrząs ekranu, angers+recovery i własna cieszynka. Nie zmieniono żadnej z już zaakceptowanych kart zawodników ani aren.