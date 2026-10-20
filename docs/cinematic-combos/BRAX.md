# BRAX — BULL BREAKER — TITAN IMPACT

**SPECYFIKACJA DLA WYKONAWCY. NIE WDROŻONE.** Ta karta uzupełnia obowiązujący `README.md` i `ASSETS.md` z tego folderu; wymaga prawdziwego dopasowania klipów i weryfikacji kontaktów.

## Tożsamość i cel
Brutalny siłowy bokser; cztery trafienia zamiast siedmiu przeciągniętych. Sekwencja 2.7–3.2 s; najmocniejszy jest finał, nie mnożenie ciosów.

## Choreografia — momenty ORIENTACYJNE (nie twierdzimy, że są już zmierzone w FBX)
| # | Oś czasu | Klip źródłowy i ruch | Strefa kontaktu | Osobna reakcja ofiary | VFX/impact/shake |
|---:|---|---|---|---|---|
| 1 | 0.00–0.44 | `Jab Cross (1)` — krótki segment pierwszego prawdziwego prostego, ręka ustalona z ruchu FBX | Głowa | krótkie odchylenie szyi (`Head Hit` lub własna lekka reakcja ofiary) | zimny biały flash 25 ms, 1–2 px shake, 30 ms stop |
| 2 | 0.44–1.02 | `Hook` — wybierz pojedynczy realny sierp, obrót bioder i barku | Korpus/bok żeber po prawdziwej korekcie celu | odrębny `Big Kidney Hit` lub własny HIT_BODY | pomarańczowa smuga po pięści 80 ms, krótkie iskry i 4 px shake |
| 3 | 1.02–1.70 | `Uppercut Jab` — wydziel prawdziwy uppercut bez długiego jałowego podskoku | Broda od dołu | `Receiving An Uppercut` z wygięciem tułowia do tyłu, początek utraty podparcia | łuk złotego światła od pięści, wyższy pitch SFX, 5 px shake |
| 4 | 1.70–3.05 | `Brax Side Kick`, opcjonalnie legalny take-off `BRAX_ROKOKO_JUMP` z już zretargetowanego Rokoko | Klatka piersiowa w powietrzu przy faktycznym zasięgu | `Receiving A Big Uppercut` nie pasuje do kopniaka: użyj poprawnej własnej reakcji lub `Flying Back Death` → FLY/LAND | przed kontaktem 100 ms 0.4×, smuga stopy 110 ms, złoty shockwave, **14 px shake 140 ms**, sub-bass, szybki lot 4–6 szerokości ciała |

**Ważne:** w przypadku dwóch ciosów w jednym źródłowym klipie `Boxing`/`Jab Cross` nalicz trafienia wyłącznie dla dwóch faktycznie zaobserwowanych kontaktów. Jeśli po odcięciu klipu pozostała tylko jedna ręka, nie fabrykuj drugiej. We wszystkich etapach pozycję atakującego i ofiary trzeba adaptować pod 8 różnych mas/rigów.

## Finisher
Mocny boczny odrzut z narastającą prędkością, ciągły świat bez ściany, mocny pojedynczy impact podłoża i pył przy lądowaniu. Nie stosuj sztucznego wall-bounce. Uporządkuj pozycję po trzecim uppercucie, by stopa rzeczywiście dotknęła ofiary; bez teleportowania atakującego.

## Po COMBO — atakujący oraz ofiara
- **Cieszynka BRAX:** `Taunt`: Brax zaciska pięści, prostuje korpus i pokazuje siłę; wybrać krótki rzeczywisty segment 0.6–0.8 s, bez zoomu, animacja anulowalna.
- **Kiedy BRAX przyjmuje kombo innej postaci:** Jako OFIARA: z własnej pozycji leżącej unosi prawy bark, 1 mocny cios zaciśniętą pięścią w ziemię, marszczy sylwetkę, szybko wraca poprzez `Kip Up` (jeśli down→kip-up ma prawidłową sekwencję). Nie wkładaj stojącego `PunchingtheGround` bez adaptacji.
- **W każdej walce:** odbiorca nielethal DOWN→RAGE→GETUP, realne KO pozostaje na ziemi; atakujący nie blokuje sterowania długim taunt. Dokładna lista dla wszystkich ofiar w `REACTIONS.md`.

## Materiały i ryzyka
Brax ma własne `Head Hit`, `Big Hit To Head`, `Hit To Body`, `Flying Back Death`, `Kip Up`. Nie zmieniać zwykłego łańcucha P1/P2/K1/GRAB/P2/K2 z istniejącej gałęzi; cel to prawdziwe SPECIAL COMBO. Test kończyn riga oraz poprawna pozycja stopy podczas kicka.

## Polecenie dla wykonawcy
1. Przeczytaj globalny MASTER (`README.md`). Zrób skan po wszystkich własnych klipach postaci + zewnętrznym mocap Rokoko + Headspin ZIP, ustal zgodny segment po pozach i skeletonie. Nie modyfikuj już zaakceptowanych modeli/tekstur.
2. Przeprowadź pomiar 60 Hz i wyznacz prawdziwy kontakt dla każdego wiersza. Daj GIF/MP4 z markerami kontaktów, porównaniem od lewej i prawej, odmienną reakcją na każdy hit.
3. Wstaw spec tylko w istniejący specjalny ruch COMBO bez zmiany UI/sterowania. Reakcje, VFX, dźwięk i shake wywołuj wyłącznie po faktycznym trafieniu.
4. Zaimplementuj końcowy FLY/LAND z brakiem krawędzi podczas COMBO, odtwarzaj powalenie i gniew oraz anulowalną cieszynkę, z podziałem HP>0 / KO.
5. Przetestuj wszystkie 8 typów ofiar × 2 kierunki; także AI/multiplayer, blok/pudło/przerwanie, iPhone, powrót sterowania, brak przenikania postaci oraz brak czarnych pasków.
6. Zwróć dowody: logi, identyfikatory oryginalnych FBX, pomiary 60 Hz, video 1× i 0.25×, SHA clipów, screen nagranie real mobile. FAIL otwarte zgłaszać wprost; nie wrzucać 'gotowe' bez wizualnego odbioru.

**Kryterium:** cztery–pięć trafień, każde odmiennie odebrane, bez długiej stop-klatki, dramatyczne zakończenie, dynamiczny VFX ze smugą prawdziwej kończyny, wyraźny krótki wstrząs ekranu, angers+recovery i własna cieszynka. Nie zmieniono żadnej z już zaakceptowanych kart zawodników ani aren.