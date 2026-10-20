# NYXA — BLACK THUNDER — ELBOW STORM

**SPECYFIKACJA DLA WYKONAWCY. NIE WDROŻONE.** Ta karta uzupełnia obowiązujący `README.md` i `ASSETS.md` z tego folderu; wymaga prawdziwego dopasowania klipów i weryfikacji kontaktów.

## Tożsamość i cel
Szybkie, techniczne, agresywne ciosy w zwarciu: pięści→łokieć→kolano→obrotowy finisher; 5 prawdziwych kontaktów w 2.7–3.3 s.

## Choreografia — momenty ORIENTACYJNE (nie twierdzimy, że są już zmierzone w FBX)
| # | Oś czasu | Klip źródłowy i ruch | Strefa kontaktu | Osobna reakcja ofiary | VFX/impact/shake |
|---:|---|---|---|---|---|
| 1 | 0.00–0.40 | `Body Jab Cross` — pierwszy jab (pierwszy kontakt z oryginalnej sekwencji) | Korpus | lekki HIT_BODY z cofnięciem lewego barku | jasnofioletowy krótki flash i 1 px shake |
| 2 | 0.40–0.75 | `Body Jab Cross` — drugi cross, nie kolejna odtworzona kopia | Głowa lub korpus zależnie od źródła | inny HEAD reakcja na przeciwny kierunek niż poprzednia | cienka fioletowa smuga pięści, suchy 'crack' |
| 3 | 0.75–1.40 | `Illegal Elbow Punch` — odciąć idle, realny kontakt łokcia | Boczna część głowy | `Head Hit`/`Head Hit (2)` według rigów, boczne zachwianie | turkusowa ukośna smuga, 4 px shake, krótki różowy spark |
| 4 | 1.40–2.05 | `Illegal Knee` — kontrolowany krok do przodu i jedno kolano | Splot słoneczny, nie głowa jeśli kończyna niżej | `Big Kidney Hit`/HIT_BODY z pochyleniem wprzód | fioletowy puls 50 ms, oddech przeciwnika, 5 px shake |
| 5 | 2.05–3.25 | `Martelo Do Chau` lub końcowy element `Punch To Elbow Combo` wybrany po realnej inspekcji rotacji | Głowa w locie | odrębne wytrącenie z równowagi + lot, po czym FLOOR impact | krótki 0.35× przed kontaktem, smuga pełnego łuku, shockwave fioletowo-zielony, 12 px shake i bas |

**Ważne:** w przypadku dwóch ciosów w jednym źródłowym klipie `Boxing`/`Jab Cross` nalicz trafienia wyłącznie dla dwóch faktycznie zaobserwowanych kontaktów. Jeśli po odcięciu klipu pozostała tylko jedna ręka, nie fabrykuj drugiej. We wszystkich etapach pozycję atakującego i ofiary trzeba adaptować pod 8 różnych mas/rigów.

## Finisher
Ostatni rotacyjny cios ma wysłać ofiarę gwałtownie diagonalnie na ziemię: jeden mocny bounce od podłogi, nie powtarzany trampolinowy bounce. Przepływ z `Martelo` musi pasować do startowej pozy riga, w przeciwnym razie użyj kompatybilnego kontaktu z `Punch To Elbow Combo`.

## Po COMBO — atakujący oraz ofiara
- **Cieszynka NYXA:** `Breakdance Freezes`: krótki efektowny freeze/gest dominacji, ale **nie długi stop-frame ani zamrożenie gry**; cieszynka 0.6–0.8 s, bez kamery bliżej.
- **Kiedy NYXA przyjmuje kombo innej postaci:** Jako OFIARA: szybki przewrót z `Dying`/upadku, zirytowane energiczne pchnięcie podłoża dłonią + napięcie ramion, `Getting Up` do gardy. Upewnić się, że łokcie się nie zapadają.
- **W każdej walce:** odbiorca nielethal DOWN→RAGE→GETUP, realne KO pozostaje na ziemi; atakujący nie blokuje sterowania długim taunt. Dokładna lista dla wszystkich ofiar w `REACTIONS.md`.

## Materiały i ryzyka
Priorytet własne `Zombie Reaction Hit`, `Head Hit`, `Head Hit (2)`, `Flying Back Death`, `Dying`, `Getting Up`. W obecnym config teoretyczne 82 damage — kontrolować scaling i nie mnożyć kolejnych obrażeń automatycznie.

## Polecenie dla wykonawcy
1. Przeczytaj globalny MASTER (`README.md`). Zrób skan po wszystkich własnych klipach postaci + zewnętrznym mocap Rokoko + Headspin ZIP, ustal zgodny segment po pozach i skeletonie. Nie modyfikuj już zaakceptowanych modeli/tekstur.
2. Przeprowadź pomiar 60 Hz i wyznacz prawdziwy kontakt dla każdego wiersza. Daj GIF/MP4 z markerami kontaktów, porównaniem od lewej i prawej, odmienną reakcją na każdy hit.
3. Wstaw spec tylko w istniejący specjalny ruch COMBO bez zmiany UI/sterowania. Reakcje, VFX, dźwięk i shake wywołuj wyłącznie po faktycznym trafieniu.
4. Zaimplementuj końcowy FLY/LAND z brakiem krawędzi podczas COMBO, odtwarzaj powalenie i gniew oraz anulowalną cieszynkę, z podziałem HP>0 / KO.
5. Przetestuj wszystkie 8 typów ofiar × 2 kierunki; także AI/multiplayer, blok/pudło/przerwanie, iPhone, powrót sterowania, brak przenikania postaci oraz brak czarnych pasków.
6. Zwróć dowody: logi, identyfikatory oryginalnych FBX, pomiary 60 Hz, video 1× i 0.25×, SHA clipów, screen nagranie real mobile. FAIL otwarte zgłaszać wprost; nie wrzucać 'gotowe' bez wizualnego odbioru.

**Kryterium:** cztery–pięć trafień, każde odmiennie odebrane, bez długiej stop-klatki, dramatyczne zakończenie, dynamiczny VFX ze smugą prawdziwej kończyny, wyraźny krótki wstrząs ekranu, angers+recovery i własna cieszynka. Nie zmieniono żadnej z już zaakceptowanych kart zawodników ani aren.