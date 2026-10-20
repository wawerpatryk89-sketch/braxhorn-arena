# DANNY — FLASH STRIKE — BACKFLIP BREAKER

**SPECYFIKACJA DLA WYKONAWCY. NIE WDROŻONE.** Ta karta uzupełnia obowiązujący `README.md` i `ASSETS.md` z tego folderu; wymaga prawdziwego dopasowania klipów i weryfikacji kontaktów.

## Tożsamość i cel
Mobilny kickboxer, prosto i ostro; krótka sekwencja bokserska przełamana nogą i akrobatycznym finiszem; 4–5 kontaktów w 3.0–3.6 s.

## Choreografia — momenty ORIENTACYJNE (nie twierdzimy, że są już zmierzone w FBX)
| # | Oś czasu | Klip źródłowy i ruch | Strefa kontaktu | Osobna reakcja ofiary | VFX/impact/shake |
|---:|---|---|---|---|---|
| 1 | 0.00–0.36 | `Lead Jab` — pojedyncza pierwsza pięść | Głowa | krótki ruch szyi | biały impact; 1 px shake |
| 2 | 0.36–0.72 | `Punching` — mocniejszy prosty | Korpus | `Shared Hit Body` z innym skrętem | niebieska smuga pięści 70 ms |
| 3 | 0.72–1.40 | `Hook` — pojedynczy sierp | Szczęka | `Head Hit` mocniejsze niż pierwszy | elektryczny błękitny łuk, 4 px shake |
| 4 | 1.40–2.22 | `Side Kick` — dynamiczny kopniak w klatkę | Klatka | odchylenie tułowia i krok obronny | długa niebieska smuga stopy, 5 px shake |
| 5 | 2.22–3.60 | `Back Flip To Uppercut` — tylko jeśli skrócony segment zawiera prawdziwy kontakt i bezpieczne lądowanie; w przeciwnym razie końcowy `Side Kick` w nowym oknie i backflip wyłącznie jako bezobrażeniowy flourish | Broda na poprawnym kontakcie albo korpus przy backup kicku | `Receiving A Big Uppercut` dla uppercuta lub FLY przy kicku | przygotowanie 100 ms 0.35×, jasnoniebieski trail, biały shock ring, **12 px shake** i daleki odrzut |

**Ważne:** w przypadku dwóch ciosów w jednym źródłowym klipie `Boxing`/`Jab Cross` nalicz trafienia wyłącznie dla dwóch faktycznie zaobserwowanych kontaktów. Jeśli po odcięciu klipu pozostała tylko jedna ręka, nie fabrykuj drugiej. We wszystkich etapach pozycję atakującego i ofiary trzeba adaptować pod 8 różnych mas/rigów.

## Finisher
Podbródkowy ma wystrzelić cel pionowo, backup side-kick — ostro poziomo. Nie wolno emitować efektu uppercuta, kiedy realnie działa tylko noga; każda wersja rozpoznawalna po kontakcie.

## Po COMBO — atakujący oraz ofiara
- **Cieszynka DANNY:** `Taunt` — krótkie gesty dłoni, wyprostowana postawa, szybki powrót do gardy.
- **Kiedy DANNY przyjmuje kombo innej postaci:** Jako OFIARA: `Sweep Fall`→żwawy ruch ramieniem i jedno silne uderzenie pięścią w ziemię→`Shared Getting Up`. Bez 'szarpnięcia' modelu przy wstawaniu.
- **W każdej walce:** odbiorca nielethal DOWN→RAGE→GETUP, realne KO pozostaje na ziemi; atakujący nie blokuje sterowania długim taunt. Dokładna lista dla wszystkich ofiar w `REACTIONS.md`.

## Materiały i ryzyka
Baza Danny'ego: `Lead Jab`, `Punching`, `Hook`, `Side Kick`, `Back Flip To Uppercut`, `Sweep Fall`, `Shared Flying Back Death`, `Shared Getting Up`. Obecny backflip ma w audycie późny kontakt — silnie rozważyć segment/bezpieczniejszą alternatywę.

## Polecenie dla wykonawcy
1. Przeczytaj globalny MASTER (`README.md`). Zrób skan po wszystkich własnych klipach postaci + zewnętrznym mocap Rokoko + Headspin ZIP, ustal zgodny segment po pozach i skeletonie. Nie modyfikuj już zaakceptowanych modeli/tekstur.
2. Przeprowadź pomiar 60 Hz i wyznacz prawdziwy kontakt dla każdego wiersza. Daj GIF/MP4 z markerami kontaktów, porównaniem od lewej i prawej, odmienną reakcją na każdy hit.
3. Wstaw spec tylko w istniejący specjalny ruch COMBO bez zmiany UI/sterowania. Reakcje, VFX, dźwięk i shake wywołuj wyłącznie po faktycznym trafieniu.
4. Zaimplementuj końcowy FLY/LAND z brakiem krawędzi podczas COMBO, odtwarzaj powalenie i gniew oraz anulowalną cieszynkę, z podziałem HP>0 / KO.
5. Przetestuj wszystkie 8 typów ofiar × 2 kierunki; także AI/multiplayer, blok/pudło/przerwanie, iPhone, powrót sterowania, brak przenikania postaci oraz brak czarnych pasków.
6. Zwróć dowody: logi, identyfikatory oryginalnych FBX, pomiary 60 Hz, video 1× i 0.25×, SHA clipów, screen nagranie real mobile. FAIL otwarte zgłaszać wprost; nie wrzucać 'gotowe' bez wizualnego odbioru.

**Kryterium:** cztery–pięć trafień, każde odmiennie odebrane, bez długiej stop-klatki, dramatyczne zakończenie, dynamiczny VFX ze smugą prawdziwej kończyny, wyraźny krótki wstrząs ekranu, angers+recovery i własna cieszynka. Nie zmieniono żadnej z już zaakceptowanych kart zawodników ani aren.