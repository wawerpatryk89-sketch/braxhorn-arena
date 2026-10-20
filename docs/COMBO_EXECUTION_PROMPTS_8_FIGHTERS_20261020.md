# BRAXHORN ARENA FIGHTER — ZLECENIA REALIZACYJNE: 8 KOMBO PREMIUM
Data specyfikacji: 20.10.2026. Adresat: Warwick / wykonawca animacji i logiki walki.
Status: storyboard i kryteria odbioru, NIE ukończone animacje, NIE wydanie produkcyjne.
Uzupełnienie dokumentu: docs/COMBO_MASTER_VFX_REACTIONS_20261020.md.

## 0. CO UZYSKALIŚMY ZE ZDJĘĆ REFERENCYJNYCH PRZEKAZANYCH PRZEZ WŁAŚCICIELA
Wykorzystać: Game Feel (hitstop, subtelny screen shake, hit spark, ribbon/motion trail), Starter → Extender/Launcher → Finisher, air juggle, wyraźny finał, krótki kontrolowany cinematic moment, licznik trafień i damage scaling. Na zdjęciach podano poglądowo hitstop 3–6 klatek (50–100 ms @60Hz) oraz scaling 100% → 80% → 60% — to wartości REFERENCYJNE; dostroić per-kombo na podstawie faktycznego poczucia ciężaru i obecnego balansu. Nie zmieniać usankcjonowanego UI i jego kart.
Odrzucić przykład WALL BOUNCE: gra nie posiada ścian i kombo jest nieograniczone horyzontalnie. Odrzucić sztucznie zamrożone nakładki klatki przy nodze i gwałtowne zbliżenia obrazu. Nie zastępować ruchu modelu smużką graficzną.

## 1. ZASADY KONSTRUKCJI NIEPODLEGAJĄCE NEGOCJACJI
1. Uruchomienie JEDNYM istniejącym wejściem SPECIAL/Q zgodnie z aktualnym systemem energii, limitów, potwierdzania trafień, przerwania, bloku i uniku. Nie podmieniać specjalnego COMBO na osobny 6-klawiszowy ordinary chain istniejący na branch combo-brax-bull-breaker. Reużyć z niego wyłącznie sprawdzone narzędzia hitstop, trail, jump i replikacji.
2. Każdy krok kombo jest parą: ATTACKER MOTION + VICTIM MOTION uruchomioną na jednym deterministycznym zegarze. Konkretny punkt kontaktu przy kości atakującej i kapsule ciała odbiorcy musi uruchomić właściwy klip reakcji. Każda następna reakcja inna w widocznej sylwetce: głowa, tors, ratunkowy krok, odwrót, wybicie, lot, upadek. Same nazwy plików nie dowodzą poprawnego kontaktu.
3. Klatki kontaktowe zmierzyć w rzeczywistych klipach FBX/AnimationClip (sample 60 Hz). Podać numer klatki, bone i capsule, czas, wynik testu. Nie wysyłać obrażeń z timera, bez kolizji, przez gardę lub gdy cios minął. Jeden hitGroup = najwyżej jedne obrażenia.
4. Przejścia retargetować do obecnego szkieletu postaci bez zmian mesh, tekstur, dłoni, skin weights, proporcji czy rigów. Bezwzględnie: brak rozrywanych barków, połamanych nadgarstków, teleportacji, nagłego t-pose, dublowania root motion, niekontrolowanego ślizgu stóp i przecięcia podłoża.
5. Po skutecznym finiszerze ofiara otrzymuje fizyczną trajektorię: daleki szybki wyrzut w bok albo pionowy slam w dół zgodny z realnym ruchem atakującego. Nie wprowadzać fizycznej ściany; kamera podąża płynnie i zachowuje dwóch zawodników. Bez czarnych pasów i cięć widoku; arena wymaga poprawnej kontynuacji tła/filmu, nie widocznego tilingu.
6. Po zakończeniu, jeśli HP > 0: lądowanie → stabilne leżenie → indywidualny gniew (1–2 ciosy pięścią, gest dłoni lub krzyk) → energiczne get-up → garda. Jeśli HP = 0: KO HOLD, bez gniewu i wstawania. Atakujący równolegle: indywidualny krótki gest siły/ryk/taunt i natychmiastowa gotowość.
7. VFX i audio zdarzeniowe: każda smuga wychodzi od rzeczywistej kości dłoni/stopy, każdy spark z punktu trafienia, każdy pył z punktu lądowania. Inny preset dla prostego, korpusu, łokcia, kopnięcia, launchera i finiszera. Nie zasłaniać modeli. Krótkie wstrząsy STAGE, bez przestawiania HUD i położenia walki. Wibracja opcjonalna, bez błędów iPhone Safari.
8. Jedno wiarygodne tempo: szybki starter → odczuwalny wzrost mocy → rytmiczne wybicie → 120–170 ms kontrolowanego zwolnienia w okolicy finału → 85–105 ms hitstop na kontakcie finishera → natychmiastowy szybki wyrzut. Nie spowalniać całego komba. Specyfikacje czasów są hipotezami do inspekcji, nie pomiarem gotowych klipów.
9. Licznik COMBO: 2 HITS!, 3 HITS!, ... — skala i pulse 120–180 ms po kolejnych potwierdzonych trafieniach. Nie pokazywać licznika po bloku/pudle; na finał krótki tytuł ataku. Skalowanie obrażeń po kolejnych trafieniach, np. próbny szereg 1.00/0.90/0.80/0.70/0.60; zbalansować realny HP całej sekwencji i zachować obecne koszty energii. Nie podnosić dodatkowo obrażeń tylko dlatego, że jest duży VFX.
10. Postać w stanie combolock nie może być zablokowana przez dawne brzegi areny. Potwierdzenie i obrażenia liczy host. Klient gościa odtwarza wspólne eventy bez ghost hit, divergent VFX, podwójnego odrzutu lub asynchronii KO.
11. Dla każdej postaci dostarczyć pełne próbki: atakujący i OŚMIU różnych odbiorców w obu kierunkach, zwykły finisher i śmiertelny KO, animacje frustration/get-up/win, dźwięk, telefon poziomo, desktop i multiplayer.

## 2. WSPÓLNY REJESTR RZECZYWIŚCIE DOSTĘPNYCH ZASOBÓW
Repozytorium prywatne: wawerpatryk89-sketch/braxhorn-arena; manifesty osiem postaci znajdują się w game/assets/<fighter>-new/manifest.json; skrypty importujące i retargetujące w scripts/ i scripts/source-import/. Część źródłowych modeli i klipów .gz jest zewnętrznym pakietem fighter-package / LFS: brak pliku w bieżącym checkout NIE oznacza prawa do wymyślania nazwy animacji.
Dodatkowe źródła z paczek użytkownika:
- Rokoko/Combat, Movement — wykazane we wcześniejszym audycie (152 wpisy), w tym Boxing_KnockoutPunch_HUMANIK_WHS_segment, Boxing_GettingKnockedOut_HUMANIK_WHS, PunchingtheGround_HUMANIK_769; Jumping_ROM_HUMANIK_WHS źródłowy dla BRAX_ROKOKO_JUMP istniejącego na branch combo-brax-bull-breaker. Dostępność plików źródłowych na maszynie wykonawcy sprawdzić odrębnie, nie zakładać.
- ChatGPT Library /BRAXHORN_ARENA/SHARED_MOCAP/Headspin Start.zip: Head Hit, Big Kidney Hit, Receiving An Uppercut, Receiving A Big Uppercut (oba warianty), Sweep Fall, Jump Attack, Jumping. To są kandydaci do retargetingu, nie klipy runtime dla wszystkich postaci.
- ChatGPT Library /BRAXHORN_ARENA/SHARED_MOCAP/Zombie Kicking (2026-10-20).zip: Roar, Standing Yell, Shake Fist, Defeat Idle, Getting Up, Zombie Kicking, Female Laying Pose. Dwa dostarczone ZIP-y Zombie Kicking i Zombie Kicking(1) są identyczne (SHA-256: da55d06bd93dabb9208b2465cb1e554ab9fba8b8ad9b3ba8541b45094fb3339c). Do cieszynki wybieramy STANIE I RYK, ucinamy końcowe siadanie na podstawie wysokości Hips i kontaktu stóp. Nie odtwarzać całych 5.38s Roar czy 4.07s Standing Yell.
- Pakiety oryginalne z ChatGPT Library NIE są automatycznie wgrane binarnie do GitHub; udokumentować transfer na maszynę wykonawcy przez uprawniony kanał (Git LFS / biblioteka). Przed komercyjnym użyciem zweryfikować licencje konkretnych źródeł.
- Przyjęte czasy fragmentów po wycięciu zawsze oznaczać od-do po faktycznym audycie klipu. Podane niżej kolejności i czasy to SCENARIUSZ PROJEKTOWY, nie zaimportowany stan gry.

## 3. MAPA REAKCJI — OŚMIU ODBIORCÓW
Wykonawca mapuje reakcję ANATOMICZNĄ z tabel kombo do poniższych konkretnych, już dostarczonych klipów (po kontroli fragmentów, próbkowania, synchronizacji, a dla źródeł obcych — retargetingu).

| Odbiorca | Głowa | Korpus / stagger | Launch/flight | Down/get-up |
|---|---|---|---|---|
| BRAX | Head Hit / Big Hit To Head | Hit To Body | Flying Back Death | Sweep Fall / Kip Up |
| NYXA | Head Hit / Head Hit (2) | Zombie Reaction Hit | Flying Back Death | Dying / Getting Up |
| VEXA | Receive Uppercut To The Face / Hit Reaction | Hit Reaction z inną fazą | Receiving An Uppercut / Flying Back Death | Falling Back Death / Shared Kip Up |
| KROV | Medium Hit To Head | Big Kidney Hit | Flying Back Death | Shared Falling Back Death / Getting Up |
| NINA | Shared Hit Head | Shared Hit Body | Shared Flying Back Death | Shared Falling Back Death / Shared Getting Up |
| DANNY | Head Hit | Shared Hit Body | Shared Flying Back Death | Sweep Fall / Shared Getting Up |
| BEAR | Medium Hit To Head | Kidney Hit / Stumble Backwards | Receiving An Uppercut / Flying Back Death | Sweep Fall / Bear Getting Up |
| DEMON | Medium Hit To Head | Hit To Body / Reaction | Receiving An Uppercut / Flying Back Death | Knocked Out / Getting Up |

Uwaga: dla VEXA i NINY repertuar krótkich dedykowanych reakcji jest węższy; nie oszukiwać pięciu identycznych odpaleń. Można użyć kontrolowanej korekty póz kierunkowej z istniejącej animacji (additive torso/head recoil, foot IK) po weryfikacji różnic klatkowych; w razie braku rzeczywiście odmiennego ruchu zgłosić lukę.
Źródło Headspin Start: Head Hit dla głowy, Big Kidney Hit dla korpusu, Receiving An Uppercut i Receiving A Big Uppercut dla launch, Sweep Fall do down. Nie wymuszać każdego tego samego źródłowego klipu na nierównych szkieletach.

## 4. OSIEM INDYWIDUALNYCH PROMPTÓW — ZWERYFIKOWANE NAZWY ŹRÓDEŁ
Każdy prompt traktować jako kompletny brief do implementacji, a wypełnioną przez wykonawcę tabelę finalnych clip ranges / frames / trajectory / contact points jako warunek odbioru.

### PROMPT 01 — BRAX: BULL BREAKER V2 / RYK BYKA
**Cel:** maksymalnie ciężka, narastająca, 5-kontaktowa sekwencja trwająca projektowo 2.5–3.1 s bez pobocznych sztucznych ciosów. Reużyj obecną bazę Brax: Jab Cross (1), Hook, Kicking lub Mma Kick (1), Uppercut Jab, Brax Side Kick i BRAX_ROKOKO_JUMP z istniejącej gałęzi. Nie modyfikuj wyglądu modelu ani dłoni.
1. 0.00–0.36: cięty prosty w głowę wycięty z Jab Cross (1). Ofiara: widoczny obrót głowy i barku, minimalny prawdziwy odskok; kandydat Head Hit. FX: mały bursztynowy spark, 35–45 ms hitstop.
2. 0.36–0.78: ciężki Hook w żebra. Ofiara: zgina tors i jedną nogę, łapie równowagę; kandydat Big Kidney Hit / Hit To Body. FX: głęboki bass thud, krótkie rozszerzenie radial w miejscu kontaktu, 45–55 ms hitstop.
3. 0.78–1.30: mocny kopniak z Kicking / Mma Kick (1); zaakceptuj tylko, jeśli rzeczywista noga trafia w anatomicznie odpowiadający obszar. Ofiara: obraca się i cofa krok (INNA reakcja niż 1 i 2). FX: cienki złoty foot trail z 6–8 próbek kości, lifetime <200ms i pył ze stopy podporowej; 50–65 ms hitstop.
4. 1.30–1.79: Uppercut Jab, trafienie w podbródek. Ofiara: Receiving An Uppercut lub Receiving A Big Uppercut, wyrzut w pionowy tor; zachować spójność punktu podparcia i zanik kontaktu stóp. FX: smuga wznosząca za pięścią, 60–75 ms hitstop.
5. 1.79–2.50: BRAX_ROKOKO_JUMP jako przygotowanie, Brax Side Kick w klatkę piersiową zawodnika w powietrzu. Zwolnij bardzo krótko przed stykiem do 0.35–0.45×, zamroź synchronicznie około 90ms na styku, natychmiast przywróć pełne tempo. Ofiara: błyskawiczny długi lot w BOK przez około 0.8–1.4 szerokości widoku w współrzędnych świata (przedział pilotowy), następnie fizyczne lądowanie bez kolizji ze ścianą. FX: złoto-bursztynowe rogi jako krótkie dwa łuki przy kontakcie, 1 shockwave, lekki distorsion, 6–10px shake po normalizacji do 844px (180–250ms), pojedynczy najcięższy SFX. Bez nieruchomej czarnej klatki i bez przypadkowego pęknięcia przy bucie.
6. Po locie: pył zależny od podłoża, DOWN, jeden lub dwa gwałtowne ciosy pięścią w ziemię (dopuszczalne proceduralne na istniejącym rig + IK podłoża; źródłowy Rokoko PunchingtheGround wymaga wycięcia fazy), krótka złość, Kip Up/Get Up ofiary, garda. BRAx w tym samym czasie napina się, wykonuje krótkie ROAR ze źródła Zombie Kicking ZIP lub istniejący Taunt — tylko faza stojąca i ryk, bez siadania. Jeśli KO — bez get-up.
**Dostarcz:** 8 targetów × 2 strony, 5 różnych fizycznych reakcji na każdej ofierze, pełny film z ryknięciem Braxa i rzutem poza pierwszą szerokość areny; oryginalny specjalny przycisk Q/SPECIAL, a nie ordinary chain P1-P2-K1-GRAB-P2-K2.

### PROMPT 02 — NYXA: VIOLET EXECUTION / ŁOKIEĆ I KOLANO
**Cel:** brutalna techniczna elegancja, 4–5 kontaktów, około 2.3–2.9 s, bez przeciągania animacji.
1. Nyxa Head Jab → ofiara szybki recoil głowy; mały fioletowy spark, 35–45ms.
2. Illegal Elbow Punch → ofiara obrót tułowia, szarpnięcie karku, ratunkowy krok, a nie skopiowane HEAD; wąski fioletowy trail z łokcia, 55–65ms.
3. Illegal Knee → ofiara zgina brzuch i barki, unosi jedno kolano w reakcji; niski gęsty impact, 50–65ms.
4. Martelo Do Chau lub Mma Kick (1), wybierz po rzeczywistej geometrii kontaktu → ofiara spiralny stagger i utrata stabilnego podparcia; fot-trail/splinter.
5. Krótki kończący segment prawidłowego istniejącego kopnięcia albo Punch To Elbow Combo, tylko jeśli możliwy dalszy kontakt i logiczny tor ofiary — finisher duży obrót i szybki LOT boczny, bez wymyślonego klipu. Efekt: fioletowo-srebrny pierścień od kontaktu, lekki speedline, krótkie slow motion.
Po: techniczne przerwanie tańca Breakdance Freezes jako gest triumfu maks. ~0.8 s, nie cała wielosekundowa animacja; przeciwnik gest złości ręką, szybkie Getting Up (KO HOLD jeśli śmiertelne). Wykonawca ma pokazać wszystkie 4–5 oddzielnych reakcji ofiary w 60fps preview.

### PROMPT 03 — VEXA: SKYLINE RAZOR / SPIRALNY LOT
**Cel:** akrobatyczne, szybkie 4 trafienia, projektowo 2.2–2.8 s.
1. Boxing (2): starter trafia głowę; ofiara krótki naprzemienny head snap, FX turkusowy spark.
2. Roundhouse Kick (1): cios po łuku; ofiara zgięcie korpusu i ratunkowy krok, FX krótka smuga z kostki.
3. Armada: obrót; ofiara przeciwskręt torsu i odrywanie pięty podporowej, FX poszerzający się półokrąg ruchu stopy (nie pełny pierścień na ekran).
4. Flying Kick: rzeczywiste trafienie stopą w tors/podbródek → dynamiczne wybicie i długi lot ukośny. Ostatni hit 85–105ms, krótki srebrny bright flash tylko punktowo, po nim turkusowa fala uderzenia.
Po: VEXA krótki fragment Victory; ofiara frustracja, jeden cios pięścią o ziemię, dynamiczny get-up (gdy nie KO). Nie doklejać wall bounce.

### PROMPT 04 — KROV: IRON SENTENCE / ŁOKCIE I PODBRÓDKOWY
**Cel:** ciężka agresja bokserska, 4–5 ciosów, 2.5–3.0 s.
1. Jab Cross: podziel na zgodne z faktycznymi uderzeniami kontakty, ofiara najpierw głowa w bok, potem przeciwskręt barku; dwie różne reakcje na osobne grupy.
2. Hook Punch: mocny body shot; ofiara zgina tors w bok i robi krok, niski czerwono-bursztynowy spark.
3. Illegal Elbow Punch: ofiara gwałtowna rotacja głowy i zachwianie, pionowy krótki ember trail łokcia.
4. Uppercut lub wybrana faza Elbow Uppercut Combo: launch na klatce rzeczywistego kontaktu, reakcja Receiving A Big Uppercut (po dopasowaniu riga), FX pionowa smuga z pięści i podniesiony pył.
5. Jeśli kontakt z istniejącymi plikami daje płynny finisher: wybrany fragment z Rokoko Boxing_KnockoutPunch_HUMANIK_WHS_segment; nie używać bez uprawnionego dostępu/licencji/retargetingu. W przeciwnym razie zaakceptowany mocny istniejący cios wykona końcowe poziome wybicie; żadnego dopisanego pseudo-uderzenia.
Po: istniejące Yelling Out, skrócony ryk stojąc, ofiara 1 cios w podłoże, get-up. Brak identycznych reakcji na dwa kontakty Jab Cross.

### PROMPT 05 — NINA: CAPOEIRA CYCLONE / WIR KOPNIĘĆ
**Cel:** rozpoznawalna capoeira, tempo i rotacja wynikające z istniejącego rig; około 2.6–3.3 s.
1. Meia Lua De Frente: sweep stopą, ofiara ugięcie nogi i krótki balans ramion, FX cienki turkusowy arc.
2. Nina Extra Chapa 2 lub Chapa-Giratoria: rzeczywisty kontakt w tułów, ofiara wyraźny ruch żeber/ramion na bok; ripple.
3. Nina Extra Armada: końcowa faza obrotu w głowę, ofiara odrębny recoil szyi, obrotowe speedline przy stopie.
4. Martelo Do Chau Sem Mao, jeśli jego rzeczywista trajektoria trafia przeciwnika. W przeciwnym razie wybrać sprawdzoną Nina Extra Chapa 2 w innym dopuszczalnym fragmencie, bez duplikowania identycznego ruchu. Ofiara: uniesienie i dynamiczny odrzut lub ciężki upadek bez sztucznego chwytu. FX jasnozłoty ring na końcu łuku.
Po: skrócony Breakdance Ending 2; ofiara frustracja i szybkie Shared Getting Up, o ile walka trwa. Nie zastępować ruchów capoeira zwykłym boksowaniem.

### PROMPT 06 — DANNY: BACKFLIP DEVASTATOR / CIOS W LOCIE
**Cel:** 4–5 ciosów, rosnąca akrobatyka, 2.3–3.1 s.
1. Lead Jab: odchylenie głowy ofiary + 35–45ms freeze, spark.
2. Hook: złożenie torsu + ratunkowy krok, dźwięk body thud.
3. Mma Kick: reakcja odrzutu w bok, wąski foot trail 140–190ms.
4. Back Flip To Uppercut: wymaga autentycznego momentu trafienia przy wyjściu z przewrotu, ofiara reaguje podbródkiem i pionowym lotem; krótki pionowy luminescent streak.
5. Side Kick wyłącznie jeśli Danny ma fizyczny czas i pozycję na follow-up bez teleportu → mocny ukośny wyrzut, krótki finisher slow + screen shake. Jeśli niedostępne, punkt 4 przeprojektować jako sam pełny finisher; NIE dokładać fałszywego piątego ciosu.
Po: krótki istniejący Taunt (zamiast tańca), ofiara złość/leżenie/get-up albo KO HOLD. Utrzymać kontrolę podparcia stóp przy backflip.

### PROMPT 07 — BEAR: GRIZZLY GROUNDQUAKE / CIĘŻKIE UDERZENIE O ZIEMIĘ
**Cel:** 4 potężne impakty, ~2.8–3.4 s, większa masa = mocniejsza reakcja ziemi, nie sztucznie dłuższe pauzy.
1. Headbutt: prawdziwy kontakt głowy w tors/twarz, ofiara odchyla górny tors; mocny suchy impuls.
2. Smash: ofiara ugina kolana i cofa się ciężko, pył z podłoża przy stopach.
3. Surprise Uppercut: pionowe wybicie, ofiara Receiving An Uppercut; wyraźny występ pięści spod brody, shock streak ku górze.
4. Hell Slammer A (tylko po potwierdzeniu autentycznego oburęcznego kontaktu i zbudowaniu zsynchronizowanej trajektorii ofiary na wspólnym zegarze): finał PIONOWY — przeciwnik z dużej wysokości wbity w grunt, 1 ciężki ground shockwave, krótkie odpryski i niska amplituda drżenia. Jeśli brak poprawnej pary, zastąpić to prawdziwym końcowym Smash i lotem, ZGŁOSIĆ ODSTĘPSTWO, nie udawać slam.
Po: Bear wykonuje krótki Cheering/Rallying lub Roar po sprawdzeniu retargetingu, ofiara uderza dłonią w ziemię z frustracji i dynamicznie wstaje. Nie dodawać uniwersalnych pęknięć na metalowym lotniskowcu / wodzie / piasku.

### PROMPT 08 — DEMON: ABYSS IMPACT / RYK I ODRZUT
**Cel:** drapieżne 4 kontakty, 2.4–3.0 s, styl siły i kontrolowanego chaosu.
1. Headbutt: głowa ofiary odrzucona w tył, bordo spark, ciężki rezonans.
2. Hook Punch: odbiorca skręca dolne żebra i robi ratunkowy krok, 50–60ms hitstop.
3. Hurricane Kick: wyrzut obracający tułów ofiary; krótki bordowo-fioletowy spiral trail za stopą, ale bez zasłaniania postaci.
4. Smash albo Macaco Side według rzeczywistego kontaktu: finał mocny odrzut z gwałtownym przyspieszeniem lub pionowy slam tylko przy poprawnym przebiegu biomechanicznym; czerwona smuga impaktu, fala, krótki stage shake i niski potężny dźwięk. Żadnych eksplozji rodem z innej gry, jeżeli przeczą fizyce ciosu.
Po: istniejący Yelling Out lub nowy Roar po wycięciu stojącego odcinka, ofiara frustracja + zły szybki get-up lub pozostaje na ziemi przy KO.

## 5. ZESTAW EMOCJI PO KOMBO — NIE TYLKO ATAK
Dla każdego fightera dostarczyć osobno dwa stany:
- LOSER_ANGRY: 300–600ms realnej reakcji na podłożu (Brax: pięść+szarpnięcie barku; Nyxa: otwarta dłoń+obrót głowy; Vexa: napięcie+uderzenie pięścią; Krov: mocny cios w ziemię; Nina: rytmiczny krótki gest dłoni; Danny: dwa szybkie gesty przy podporze; Bear: ciężkie uderzenie dłonią; Demon: ziemny ryk i cios pięścią), potem odpowiedni istniejący GETUP. Nie wymyślać nowych wzorów dłoni / rigów.
- ATTACKER_TAUNT: 600–1100ms mocna ale szybka cieszynka stojąc. BRAX = niski zwierzęcy ryk, naprężenie korpusu, krótkie spojrzenie w stronę przeciwnika. Pozostali zgodnie ze stylem i realnym klipem: Nyxa Breakdance Freezes; Vexa Victory; Krov Yelling Out; Nina Breakdance Ending 2; Danny Taunt; Bear Cheering/Rallying; Demon Yelling Out. Nowy Roar/Standing Yell/Shake Fist wykorzystać tylko po retargetingu i PRZYCINANIU do stabilnego fragmentu BEZ siadania na końcu. Animacja triumfu nie może przypadkiem przerywać lotu ofiary ani blokować kontroli dłużej niż istniejące recovery.

## 6. DOKŁADNY KONTRAKT VFX/SFX/CAMERA DLA WARWICK
- Starter: 1–3 małe sparks, krótki suchy SFX, 35–45ms hitstop.
- Korpus: mniejsza ekspozycja, ciężki basowy thud, 45–55ms hitstop, małe radial compression.
- Łokieć/kolano: wyraźny specyficzny trail konkretnej kości (nie przez wszystkie 360° jeśli ruch jest krótszy), 50–70ms.
- Launcher: smuga pionowa według normalnej uderzenia, spadek podparcia stóp i spójny start rzeczywistego lotu, ~60–75ms.
- Finisher: punktowy bright hit, dwufazowy bass transient, ułamkowe slow precontact, ~85–105ms synchroniczny hitstop, screen shake maks. 6–10px/844px, wygaszenie 180–250ms, radial shockwave 160–220ms. W powietrzu ribbon za stopą/ramieniem, do 6–8 ostatnich próbek, zanikanie 110–200ms. Brak fullscreen białych błysków i masywnych overlays.
- Landing: pojedyncze wydarzenie przy ziemi, arena-dependent: metal = krótki pył/iskry w miejscu kontaktu; piasek = rozprysk ziaren; woda = splash; beton = lokalny kurz i opcjonalne pęknięcie dokładnie przy ciele; brak przypadkowych czarnych „blach” przy nodze.
- UI licznika: rosnący tekst w bezpiecznej strefie ekranu, nie nad twarzami, nie nakłada się na pasek HP, nie zmienia layoutu kart i menu; default 60fps timeline; brak podwójnej inkrementacji w sieci.
- Efekt screen shake tylko na stage, nie na HUD, menu, pasku urządzenia. Haptic: optional navigator.vibrate tylko gdzie wspierane; brak fail w iOS Safari. Reduce Motion i obniżona jakość VFX dla słabszych GPU.
- Odmawiamy oceny jako „działa” na podstawie samego PASS w symulatorze logiki — wymagane prawdziwe klipy ruchu w WebGL plus fizyczne testy iPhone/Android.

## 7. DANE I ACCEPTANCE GATE
Wykonawca dostarcza dla KAŻDEGO kombo:
- Rejestr HitEvent: fighterId, comboId, moveId, sourceArchive, sourceClip, sourceFrameFrom/to, attackerBone, targetRegion, contactFrame, victimClip, victimFrameFrom/to, impulse vector, hurtboxProof, hitstopMs, VFX/SFX presetId, planned duration, recovery state, hitGroupId.
- Rejestr materiałów z licencją dla każdego archiwum oraz SHA-256 oryginału, wynik retargetingu, bone mappings; pliki oryginalne zachowane bez zmian.
- Co najmniej 16 sekwencji na postać (8 przeciwników × oba kierunki) plus BLOCK/MISS/EVADE/CANCEL/KO/STUN/AIRBORNE, dynamiczna kamera poza obszarem początkowym, host/guest, trening i realna walka.
- 1× real-time fullscreen nagranie sceny ze słyszalnymi VFX/SFX i 0.5× debugging clip z pozycjami kontaktu (wideo inspekcyjne nie jest automatycznie gameplay slow); osobno losowe powtórzenie oraz oryginalny film z wejściem i wyjściem z areny.
- Raport jakości: widoczna odrębna reakcja na KAŻDE trafienie, brak ślizgania stóp, brak przenikania, brak sufitowego lotu poza kadrem, brak końca areny, brak zatrzymania kombo przez historyczne brzegi, brak czarnej krawędzi na iPhone. Pomiar FPS/memory na rzeczywistych urządzeniach, nie emulowany dowód.
- Zachować branch/snapshot bazowy i osobny PR. Najpierw BRAx na 1 arenie pilotowej (np. Lotniskowiec w burzy), otrzymać akceptację ruchu i kontaktów, potem Nyxa→Vexa→Krov→Nina→Danny→Bear→Demon. Dopiero po dowodzie i zgodnym QA można rozważać wydanie.
- Materiał źródłowy z chatowej biblioteki musi być faktycznie przekazany wykonawcy; samo wymienienie nazw w GitHub nie jest transferem FBX.

## 8. ZAKOŃCZENIE ZLECENIA — DEFINICJA GOTOWOŚCI
Każdy zawodnik ma własny podwójny taniec walki: 4–5 efektownych trafień bez nadmiaru, 4–5 różnych uzasadnionych reakcji ofiary, wiarygodny finisher, fizykę odrzutu, stadium wściekłości u przegranego, krótki triumf atakującego i rozróżnienie KO od zwykłego powalenia. Efekty wspierają kontakt, a nie go przykrywają. Nie raportować wdrożenia ani ukończenia na podstawie samego dokumentu.
