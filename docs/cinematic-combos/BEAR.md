# BEAR — EARTHSHATTER — URSUS SLAM

**SPECYFIKACJA DLA WYKONAWCY. NIE WDROŻONE.** Ta karta uzupełnia obowiązujący `README.md` i `ASSETS.md` z tego folderu; wymaga prawdziwego dopasowania klipów i weryfikacji kontaktów.

## Tożsamość i cel
Miś jest ciężki i powolniejszy w sylwetce, ale trafienia bez zwłoki. 4 kontakty w 2.6–3.2 s; podłoże aż drży. Użyć istniejących 45 niewykorzystanych klipów przed nowym mocap.

## Choreografia — momenty ORIENTACYJNE (nie twierdzimy, że są już zmierzone w FBX)
| # | Oś czasu | Klip źródłowy i ruch | Strefa kontaktu | Osobna reakcja ofiary | VFX/impact/shake |
|---:|---|---|---|---|---|
| 1 | 0.00–0.36 | `Jab Cross` — jedna szybka pięść (prawdziwy kontakt) | Głowa | lekkie trafienie | drobny pył, 2 px shake |
| 2 | 0.36–0.73 | `Jab Cross` — drugi odmienny cios | Korpus | mocny `Kidney Hit` / własny HIT_BODY | cięższy bas i 3 px shake |
| 3 | 0.73–1.48 | `Smash` — pojedyncze silne uderzenie ręką | Ramię / bark / głowa zgodnie z klipem | `Medium Hit To Head` lub mocna pozycja obronna | pomarańczowy pył od łap, 5 px shake |
| 4 | 1.48–3.18 | `Hell Slammer A` (niewykorzystany: dopuścić dopiero po sprawdzeniu riga i zgodności chwytu z ofiarą); bez kompatybilnej pary użyć `Surprise Uppercut` jako prawdziwego finishera | Podrzut lub klatka zależnie od faktycznego ruchu | `Receiving An Uppercut`→FLY/LAND, albo sparowany zweryfikowany slam | ogromny niski shockwave, ciemny kurz, 0.35× 100 ms, **14 px shake 150 ms**, podwójny bas przy uderzeniu i upadku |

**Ważne:** w przypadku dwóch ciosów w jednym źródłowym klipie `Boxing`/`Jab Cross` nalicz trafienia wyłącznie dla dwóch faktycznie zaobserwowanych kontaktów. Jeśli po odcięciu klipu pozostała tylko jedna ręka, nie fabrykuj drugiej. We wszystkich etapach pozycję atakującego i ofiary trzeba adaptować pod 8 różnych mas/rigów.

## Finisher
Jeśli da się sparować `Hell Slammer A` z rzeczywistą ofiarą, brutalny rzut z góry w ziemię. W przeciwnym razie nie pozorować chwytu: uppercut + daleki lot i mocne lądowanie. Grunt nie pęka stale — ślad znika po 0.8 s.

## Po COMBO — atakujący oraz ofiara
- **Cieszynka BEAR:** `Cheering` lub `Rallying`: Miś rozkłada ramiona, uderza się w klatkę, staje ciężko na dwóch nogach; maks. 0.8 s.
- **Kiedy BEAR przyjmuje kombo innej postaci:** Jako OFIARA: `Sweep Fall`→jeden masywny łapą cios o podłoże, potrząśnięcie głową→`Bear Getting Up` albo `Getting Up`, bez lewitacji.
- **W każdej walce:** odbiorca nielethal DOWN→RAGE→GETUP, realne KO pozostaje na ziemi; atakujący nie blokuje sterowania długim taunt. Dokładna lista dla wszystkich ofiar w `REACTIONS.md`.

## Materiały i ryzyka
Własne nieprzypisane: `Hell Slammer A`, `Roundhouse Kick`, `Rallying`, `Receiving An Uppercut`, `Kidney Hit`, `Medium Hit To Head`, `Sweep Fall`, `Getting Up`. Nie stosować ludzkiego przekombinowanego kopnięcia, jeśli sylwetka misia nie wykonuje go wiarygodnie.

## Polecenie dla wykonawcy
1. Przeczytaj globalny MASTER (`README.md`). Zrób skan po wszystkich własnych klipach postaci + zewnętrznym mocap Rokoko + Headspin ZIP, ustal zgodny segment po pozach i skeletonie. Nie modyfikuj już zaakceptowanych modeli/tekstur.
2. Przeprowadź pomiar 60 Hz i wyznacz prawdziwy kontakt dla każdego wiersza. Daj GIF/MP4 z markerami kontaktów, porównaniem od lewej i prawej, odmienną reakcją na każdy hit.
3. Wstaw spec tylko w istniejący specjalny ruch COMBO bez zmiany UI/sterowania. Reakcje, VFX, dźwięk i shake wywołuj wyłącznie po faktycznym trafieniu.
4. Zaimplementuj końcowy FLY/LAND z brakiem krawędzi podczas COMBO, odtwarzaj powalenie i gniew oraz anulowalną cieszynkę, z podziałem HP>0 / KO.
5. Przetestuj wszystkie 8 typów ofiar × 2 kierunki; także AI/multiplayer, blok/pudło/przerwanie, iPhone, powrót sterowania, brak przenikania postaci oraz brak czarnych pasków.
6. Zwróć dowody: logi, identyfikatory oryginalnych FBX, pomiary 60 Hz, video 1× i 0.25×, SHA clipów, screen nagranie real mobile. FAIL otwarte zgłaszać wprost; nie wrzucać 'gotowe' bez wizualnego odbioru.

**Kryterium:** cztery–pięć trafień, każde odmiennie odebrane, bez długiej stop-klatki, dramatyczne zakończenie, dynamiczny VFX ze smugą prawdziwej kończyny, wyraźny krótki wstrząs ekranu, angers+recovery i własna cieszynka. Nie zmieniono żadnej z już zaakceptowanych kart zawodników ani aren.