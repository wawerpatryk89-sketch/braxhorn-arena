# NINA — CAPOEIRA TEMPEST — FALLING MOON

**SPECYFIKACJA DLA WYKONAWCY. NIE WDROŻONE.** Ta karta uzupełnia obowiązujący `README.md` i `ASSETS.md` z tego folderu; wymaga prawdziwego dopasowania klipów i weryfikacji kontaktów.

## Tożsamość i cel
Cała sekwencja ma wynikać z rytmu capoeiry, bez podmiany jej walki na bokserkę. 4 mocne **odmienne** kontakty w 2.8–3.4 s.

## Choreografia — momenty ORIENTACYJNE (nie twierdzimy, że są już zmierzone w FBX)
| # | Oś czasu | Klip źródłowy i ruch | Strefa kontaktu | Osobna reakcja ofiary | VFX/impact/shake |
|---:|---|---|---|---|---|
| 1 | 0.00–0.58 | `Nina Extra Chapa 2` — szybki frontalny kick | Brzuch | krótkie cofnięcie tułowia | żółto-zielona wąska smuga stopy |
| 2 | 0.58–1.33 | `Meia Lua De Frente` — łuk nogi | Głowa / ramię jeśli rzeczywiście dosięga | lateralny obrót barków i głowy | półokrąg szmaragdowy, subtelny blur 90 ms, 3 px shake |
| 3 | 1.33–2.08 | `Nina Extra Armada` — rytmiczny obrót | Skroń / górna część | gwałtowny skręt tułowia w drugą stronę | wąska okrężna poświata w rytmie muzyki, 5 px shake |
| 4 | 2.08–3.35 | `Martelo Do Chau Sem Mao` albo `Chapa-Giratoria`, wybrany po dopasowaniu pozy do celu | Głowa / klatka po realnym kontakcie | osobna reakcja spadania + krótki bounce i DOWN | półksiężycowa smuga, 110 ms 0.4×, pierścień przy ziemi, **12 px shake** |

**Ważne:** w przypadku dwóch ciosów w jednym źródłowym klipie `Boxing`/`Jab Cross` nalicz trafienia wyłącznie dla dwóch faktycznie zaobserwowanych kontaktów. Jeśli po odcięciu klipu pozostała tylko jedna ręka, nie fabrykuj drugiej. We wszystkich etapach pozycję atakującego i ofiary trzeba adaptować pod 8 różnych mas/rigów.

## Finisher
Obrotowy atak wysyła ofiarę skosem w górę i po łuku bezpośrednio na ziemię. Wylądować na normalnej linii stóp, bez lądowania Niny w ciele przeciwnika.

## Po COMBO — atakujący oraz ofiara
- **Cieszynka NINA:** `Breakdance Ending 2`: krótki autentyczny popis/obrót zakończony powrotem do `Ginga Variation 3`, anulowalny.
- **Kiedy NINA przyjmuje kombo innej postaci:** Jako OFIARA: `Shared Falling Back Death` → krótka negatywna reakcja ramieniem / tupnięcie stopą w ziemię z pozycji down, potem szybki `Shared Getting Up`, powrót do Ginga. Nie doklejać stojących klipów do leżenia.
- **W każdej walce:** odbiorca nielethal DOWN→RAGE→GETUP, realne KO pozostaje na ziemi; atakujący nie blokuje sterowania długim taunt. Dokładna lista dla wszystkich ofiar w `REACTIONS.md`.

## Materiały i ryzyka
Nina ma rytmiczny własny materiał: `Nina Extra Chapa 2`, `Nina Extra Armada`, `Meia Lua De Frente`, `Martelo Do Chau Sem Mao`, `Chapa-Giratoria`, `Ginga Variation 3`. Przyciski P1/P2 w bazie według audytu nie zawsze są pięściami: nie zmieniać ich w ramach kombo bez osobnego zlecenia.

## Polecenie dla wykonawcy
1. Przeczytaj globalny MASTER (`README.md`). Zrób skan po wszystkich własnych klipach postaci + zewnętrznym mocap Rokoko + Headspin ZIP, ustal zgodny segment po pozach i skeletonie. Nie modyfikuj już zaakceptowanych modeli/tekstur.
2. Przeprowadź pomiar 60 Hz i wyznacz prawdziwy kontakt dla każdego wiersza. Daj GIF/MP4 z markerami kontaktów, porównaniem od lewej i prawej, odmienną reakcją na każdy hit.
3. Wstaw spec tylko w istniejący specjalny ruch COMBO bez zmiany UI/sterowania. Reakcje, VFX, dźwięk i shake wywołuj wyłącznie po faktycznym trafieniu.
4. Zaimplementuj końcowy FLY/LAND z brakiem krawędzi podczas COMBO, odtwarzaj powalenie i gniew oraz anulowalną cieszynkę, z podziałem HP>0 / KO.
5. Przetestuj wszystkie 8 typów ofiar × 2 kierunki; także AI/multiplayer, blok/pudło/przerwanie, iPhone, powrót sterowania, brak przenikania postaci oraz brak czarnych pasków.
6. Zwróć dowody: logi, identyfikatory oryginalnych FBX, pomiary 60 Hz, video 1× i 0.25×, SHA clipów, screen nagranie real mobile. FAIL otwarte zgłaszać wprost; nie wrzucać 'gotowe' bez wizualnego odbioru.

**Kryterium:** cztery–pięć trafień, każde odmiennie odebrane, bez długiej stop-klatki, dramatyczne zakończenie, dynamiczny VFX ze smugą prawdziwej kończyny, wyraźny krótki wstrząs ekranu, angers+recovery i własna cieszynka. Nie zmieniono żadnej z już zaakceptowanych kart zawodników ani aren.