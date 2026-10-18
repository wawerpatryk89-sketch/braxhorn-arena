# Miś, Azrak i zapętlenie aren

## Wykonane
- Dodano BEAR (nazwa karty: MIŚ) i DEMON (AZRAK), z dostarczonych modeli. Miś: mocne ręce, bark, kolano, podbródkowy, rzuty. Azrak: sierpowy, głowa, kopnięcie MMA i obrotowe. 44 stany na postać. Istniejące sześć zestawów pozostaje bez zmian.
- Osiem postaci w wyborze, CPU, multiplayerze, rankingach oraz turnieju. Pełna drabinka ośmiu osób, siedmiu walk; Arcade ma siedmiu przeciwników.
- Nowe modele, klipy i tekstury w osobnej paczce fighter-media. 12 nowych plików przesłanych do R2; pełny download SHA-256 i odczyt Range PASS. Cała paczka: 48 plików, 255247104 bajty. Główna aplikacja nie zawiera tych payloadów.
- Nowe portrety wygenerowane narzędziem imagegen na podstawie renderów modeli i istniejącej karty Danny: `game/assets/bear-card-pro.webp`, `game/assets/demon-card-pro.webp`; wersje dla turnieju i wyniku w campaign-portraits i result-portraits. Konwersja PNG do WebP bezstratna; wizerunki nie podmieniają modeli podczas walki.
- Bez nowych filmów intro/finału: nowe postacie przechodzą bez błędnego URL do własnej animacji wejścia. Filmów innych zawodników im nie przypisano.
- Areny: dwa dekodery tego samego pobranego filmu, przejście 120 ms, wspólne pauzowanie/wyciszanie/zwalnianie. Oryginalne filmy nie były przekodowane ani pogorszone.
- Po wyjaśnieniu „usuń GIF, film nie” oba dachy MP4 zachowano. `rooftop.gif` już nie występuje w bieżącym kodzie i buildzie. W tym wydaniu nie usunięto żadnego filmu dachu.

Surowe FBX/PNG należy wypakować z dostarczonych ZIP-ów do source-assets/new-fighters-input/{bear,demon,xd,xd1,xg}. Nie są kopiowane do repozytorium z powodu limitu pojedynczego obiektu; ich SHA-256 zapisano w new-fighter-input-manifest.json. Modele i tekstury runtime zachowują oryginalną geometrię i piksele.

## Wybór areny po doprecyzowaniu
Trening i walka 1v1: ręczny wybór. Zwykły multiplayer: gospodarz wybiera arenę podczas tworzenia pokoju; serwer sprawdza katalog i przekazuje identyczną arenę gościowi. Arcade, Survival i turniej lokalny: losowanie przed kolejną walką. Turniej internetowy: losowanie na serwerze raz przy utworzeniu pokoju pary. Testy arena-policy-145.log, roster-145-api.log i roster-145-tournaments.log: PASS.

## Wyniki
- npm test: PASS (poprawiono oczekiwanie pięciu rywali na siedmiu w teście kampanii).
- npm run test:repairs: PASS.
- npm run test:audit: PASS, wraz z nowymi kontrolami aren i obu modeli.
- npm run test:duel-api: PASS, także utworzenie/dołączenie pokoju Miś/Azrak.
- audit-roster-eight: PASS, 128 przypadków wejścia i powrotu do gotowości; 8 pełnych drabinek.
- audit-multiplayer-carousel: PASS, osiem postaci, przewijanie i wybór.
- audit-fighter-asset-package: PASS, 48 identycznych bajtowo plików poza głównym buildem.
- npm run build: PASS.
- SHA-256 48 plików dotychczasowych sześciu zawodników względem wersji 144: wszystkie identyczne. Tabela: verification/roster-145-preserved-assets.json.
- 8145 próbek pozycji nowych modeli: skończone współrzędne; 231 klatek kontaktowych zgodnych z kością, błąd maksymalny 1.4e-12 px. Złączenie pętli IDLE poniżej 0.000503 rad. To nie zastępuje oględzin ruchu.
- Osiem tekstur nowych postaci: piksele RGBA identyczne z przesłanymi PNG, bez zmiany wymiarów.
- Areny: 150 s zegara symulowanego, 21 przejść, 0 pustych/niemych klatek modelu odtwarzacza; 16 filmów z identycznym końcem ścieżek obrazu i audio (różnica 0 ms). Szczegóły w arena-loop-followup.md.

## Czego nie zweryfikowano
Brak dostępnego wspieranego podglądu przeglądarkowego w tej sesji. Nie potwierdzono GPU, wyglądu kart w rzeczywistym ekranie, płynności animacji, balansu nowych zawodników ani braku pauzy dekodera na telefonie. Odzyskiwanie pozycji po kontakcie nowych postaci korzysta z ich własnych klipów; nie deklarujemy idealnego kontaktu dłoni z barkiem drugiej postaci. Nie wykonano nowych pomiarów prawdziwego RAF przy jitterze 46 ms, ani multiplayera na dwóch telefonach. Poprzednie ograniczenia z raportu 143 pozostają aktualne. Nie uruchamiano pełnego test:online lokalnego Workera w tym wydaniu; API sprawdzono na SQLite w pamięci.

## Telefon: lista kontroli
1. iPhone Safari z paskiem adresu rozwiniętym i schowanym, PWA; Android Chrome. Obrót i powrót do aplikacji. Dolny safe area bez czarnego pasa.
2. Każdy film areny przez co najmniej 5 pętli z dźwiękiem; potem mute/unmute, pauza, tło, powrót i zmiana areny. Sprawdzić przycięcie i podwójny dźwięk (iOS może ignorować zmianę volume).
3. Miś i Azrak: wszystkie przyciski, oba kierunki, combo, blok, chwyt, odrzut, powstanie, zwycięstwo i koniec kampanii. Sprawdzić stopy, drżenie i wyrównanie par.
4. Dwa telefony jednocześnie: zamiana host/gość, Wi-Fi i sieć komórkowa. Pięć tapnięć w logo otwiera diagnostykę: zapisać FPS, p95, ping, jitter i opóźnienie wejścia.
5. Konflikty: atak gościa podczas trafienia hosta; chód podczas odpychania/chwytu. Brak teleportacji i cofania klatek tego samego ataku potwierdzić nagraniem i JSON diagnostyki.

## Prompty obrazów (imagegen, tryb wbudowany)
Miś: premium cinematic realistic game portrait; exact identity from actual bear mesh reference, brown fur, black sleeveless gi with lime trim, black belt and fingerless gloves; fighting guard, waist-up, dark arena and lime spotlights; no labels, card frame or statistics.
Azrak: same card style; exact identity from actual demon mesh reference, red muscular skin, curved charcoal horns, pointed ears, orange eyes, sharp teeth, black spiked bracers and skull belt; full horns/fists within portrait frame; no wings, weapons, labels or frame.

Źródła referencyjne: game/assets/portraits/bear.webp, demon.webp oraz istniejąca danny-card-pro.png. Pełne wyniki testów: docs/verification/roster-145-*.log.
