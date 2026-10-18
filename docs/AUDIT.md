## Strzałki i wybór kliknięciem BRAX-a — 2026-10-07

Na podstawie zrzutu ekranu wyboru zawodnika usunięto przycisk WALCZ pod imieniem. Dodano po lewej i prawej małe przyciski 44×44 px: neonowozielony okrągły obrys i strzałka (#64ff35), delikatna poświata oraz przezroczyste wnętrze. Przełączają cztery dotychczasowe miejsca w pętli. Kliknięcie sylwetki BRAX-a przechodzi do istniejącego wyboru areny. START na ekranie tytułowym oraz WALCZ po wyborze areny nie są przedmiotem tej korekty.

Przezroczysty obszar dotknięcia dopasowano do sumy granic postaci w oryginalnym GIF-ie (51,29)–(432,518), z uwzględnieniem skali i aktualnej kotwicy. Nie obejmuje całej planszy. Przesuwanie palcem pozostaje dostępne również na postaci; flaga gestu blokuje kliknięcie powstające po przesunięciu. Puste miejsca chowają i wyłączają cel wyboru. Imię zachowuje wysokość sprzed usunięcia przycisku.

Weryfikacja: testy istniejącego przepływu, animacji i audio oraz nowy test strzałek, blokady pustych miejsc i braku wyboru po przesunięciu. Nie wykonano podglądu przeglądarkowego na fizycznym telefonie; ograniczenie control-browser pozostaje aktualne.

## Nowy chód i nagrane audio — 2026-10-07

Usunięto poprzednie bajty chodu przód i tył z ASSET_B64; zastąpiły je oryginalne pliki autora: 4C4F9671-0BAA-4F31-BB57-F7B00B871E73.gif (przód, 10 klatek) i 52679482-BFC2-457A-908E-7D61A048FD55.gif (tył, 11 klatek). Obydwa 672×544, 90 ms/klatkę, stopa na y=517 w każdej klatce. Nie przerysowano ani nie zmieniono bajtów GIF-ów; skala dopasowana do pozostałych ruchów. IDLE/BLOCK korzystają z pierwszej klatki nowego chodu przód. Inne animacje zachowane.

Zastąpiono syntetyczną muzykę i tłum nagraniami: Prepare to fight oraz Stadium joy shouting crowd. Dodano nagranego lektora 3–2–1–FIGHT, zmieniono tekst GO na FIGHT. Efekty świstu i uderzenia uruchamiają się w klatkach aktywnych, raz na grupę ciosu; dodano akcenty kroków i lądowania. Poziomy głośności przygotowano z zapasem przed przesterowaniem. Źródła i licencje: AUDIO-SOURCES.md.

Jeden AudioContext odblokowywany przez interakcję użytkownika, próbki dekodowane wcześniej. Brak wsparcia audio lub błąd odczytu nie blokuje gry. Wyciszenie działa na menu i grę; dotychczasowy przycisk jest również dostępny w treningu. Pauza zatrzymuje efekty, ukrycie strony zatrzymuje menu oraz kontekst. Głos poprzedniej liczby nie nakłada się na następną. Autoplay nadal zależy od przeglądarki.

Weryfikacja: npm test przeszedł, 88 przebiegów ataków w czterech rozmiarach okna, 106 różnych klatek porównanych z Pillow. Testuje wszystkie 10 i 11 klatek nowego chodu, kontakt stóp z gruntem oraz zgodność SHA wszystkich 17 obecnych zasobów. Symulowany AudioContext potwierdza gotowość 10 próbek, kolejność three/two/one/fight, efekty ataku i brak nowych dźwięków po wyciszeniu/pauzie. Każdy MP3 dekodowany FFmpeg i sprawdzony pod kątem ciszy oraz szczytów poziomu. Nie wykonano rzeczywistego odsłuchu ani testu przeglądarkowego na iPhonie; wymagany control-browser pozostaje niedostępny. Testy nie gwarantują subiektywnej oceny jakości premium.

## Okrągły START ponad imionami — 2026-10-07

Po zrzucie autora usunięto duży prostokąt zasłaniający BRAX/KROV. Zastąpiono go okrągłym, ciemnozielonym START z cienką jasną ramką, średnica 56–76 px, pośrodku nad imionami. Oryginalny PRESS START pozostaje częścią nietkniętej grafiki. Położenie liczone względem skalowania cover, z dolnym wyrównaniem tła.

Przed publikacją obejrzano oryginalną grafikę 1536×864 i zrzut autora; zweryfikowano geometrię nakładki w 6 wymiarach okna: 1324×608, 1536×608, 844×390, 568×320, 1920×1080, 1363×936. Przycisk mieści się w oknie, a jego dolna krawędź jest 12,7–42,9 px ponad górną krawędzią obszaru imion (y=786 źródła). Zmiana wyłącznie HTML/CSS; obsługa START bez zmian. Nie wykonano zrzutu gotowej strony w przeglądarce: wymagany control-browser jest niedostępny. Nie przedstawiać obliczeń jako testu wizualnego na telefonie.

## Większy START GAME — 2026-10-07

Na polecenie autora przezroczyste pole startowe zastąpiono widocznym przyciskiem START GAME, nałożonym na dolny napis oryginalnej grafiki. Szerokość 34% okna, wysokość 12% i minimum 56 px, zielone tło oraz jasna ramka. Zachowano dotychczasową obsługę kliknięcia. Jest to korekta wyglądu, bez zmian logiki względem przeprowadzonych testów pełnego okna.

## Wypełnienie całego okna — korekta po zrzucie autora, 2026-10-07

Najnowsze polecenie zastępuje poprzednie sztywne 16:9. Usunięto ograniczenie sceny: od pierwszego CSS i po każdej zmianie viewportu gra zajmuje całą dostępną szerokość oraz wysokość. Tytuł, wybór zawodnika, podgląd planszy i trening używają cover, bez pasów generowanych przez grę. Grafiki zachowują proporcje, nadmiar kadru jest przycinany. Tytuł wyrównano do dołu, aby napis PRESS START pozostawał widoczny. Miniaturki nadal pokazują pełne obrazy. Kotwica wyboru BRAX-a oraz linia podłoża treningu uwzględniają kadrowanie cover. Nie edytowano bajtów grafik ani GIF-ów.

Górny pasek przeglądarki nie jest częścią strony. Pełny ekran nadal żądany po START; obsługa i zgoda zależą od przeglądarki. Nie obiecuje się usunięcia jej interfejsu przez CSS ani automatycznie po otwarciu.

Weryfikacja: testy logiki i geometrii sceny obejmują pełną szerokość/wysokość przed START, wybór czterech aren i regresje treningu. Brak dostępnego control-browser; nie wykonano testu wizualnego na telefonie. Nowe animacje chodu nadal oczekują na dostarczenie przez autora.

## Pełny kadr 16:9 i wybór planszy — 2026-10-07

Kontynuacja istniejącego projektu od c74eedeeacdd6bfb4c3be83676da4ecf053f8511, bez zastępowania implementacji. Przeczytano zasady autora i uruchomiono audyt istniejącej gry przed zmianami.

Cała scena od pierwszego renderowania CSS, oba menu, wybór areny i trening korzystają z maksymalnego kadru 16:9 mieszczącego się w oknie. Obrazy są pełne, bez kadrowania i rozciągania. Ekran o innych proporcjach zachowuje obszar poza sceną; 16:9 nie może jednocześnie wypełniać dowolnego ekranu bez przycinania. Pełny ekran wywoływany na dokumencie po interakcji, niezależnie od proporcji sceny.

WALCZ przy BRAX-ie prowadzi do wyboru planszy. Na najnowsze polecenie autora usunięto pierwotną arenę z wyboru oraz plików gry. Dostępne są wyłącznie cztery oryginalne załączniki JPEG 960×540: dach, metro, port i wulkan. Miniaturki w ramkach przewijają się w lewo, pokazując następne. Kliknięcie zaznacza zieloną ramkę, zmienia duży podgląd i tło treningu. WALCZ na wyborze areny uruchamia dotychczasowe intro i odliczanie. Powrót zachowuje wybraną planszę. Brak dodatkowych widocznych tytułów czy instrukcji.

Grunt jest normalizowaną współrzędną sceny, niezależną od rozmiaru dekoracji: dach/wulkan .80, metro/port .81. Kotwice stóp oryginalnych animacji zachowane.

Weryfikacja: npm test przeszedł, 88 przebiegów ataków w czterech rozmiarach okna, 86 klatek porównanych z Pillow, 17/17 oryginalnych animacji z niezmienionymi SHA-256. Dodatkowo sprawdzono proporcje sceny przed START, wybór każdej z czterech aren, podgląd i faktyczne tło treningu, zachowanie wyboru po powrocie, przesunięcie w lewo oraz kontakt stóp z gruntem. Wszystkie cztery nowe JPEG zachowały oryginalne bajty.

Ograniczenie: brak dostępnej umiejętności control-browser wymaganej przez Sites do podglądu w tym środowisku; nie wykonano nowego testu wizualnego ani testu na fizycznym telefonie. Istniejący test logiki wykazuje różne klatki chodu, ale nie rozstrzyga zgłoszenia autora o pracy nóg. Zgodnie z najnowszym poleceniem autora animacje chodu nie zostały zmienione — oczekują na zapowiedziane nowe GIF-y szybkiego chodu przód/tył.

## Wybór palcem — cztery miejsca

Usunięto nagłówek WYBÓR ZAWODNIKA. Przesunięcie poziome przełącza cztery miejsca w pętli: BRAX i trzy puste miejsca bez postaci, nazwy ani WALCZ. Puste miejsce nie uruchomi walki. Test gestu w obie strony i blokady pustego miejsca przeszedł; podgląd końcowy w brax-final-menu.jpg.

## Animowany wybór BRAX-a i dźwięk menu

Znalezione i podłączone pliki użytkownika: Braxhorn-Arena-Fighter-wybor-zawodnika.gif (1280×720, 64 klatki) oraz Braxhorn-wybor-polaczony.gif (672×544, 28 klatek). GIF-y zachowane w całości bez edycji; BRAX jest osobną przezroczystą warstwą z kotwicą stóp na 72% wysokości obrazu podestu. GIF postaci zastępuje puste miejsce z poprzedniej wersji. Zdjęcie tytułowe pozostaje oryginalnym JPEG.

Muzyka ekranu tytułowego: oryginalna proceduralna pętla instrumentalna 16 s / 120 BPM, niskie bębny i bas. START: krótki efekt uderzenia, zatrzymanie muzyki i pętla syntetycznej atmosfery tłumu. To wygenerowana synteza, nie nagranie prawdziwych kibiców. WALCZ zatrzymuje dźwięki menu. Przycisk głośnika wycisza wszystkie ścieżki. Powrót do tytułu przełącza tłum na muzykę. Ukrycie karty zatrzymuje odtwarzanie.

Ustawiono autoplay i próbę play() przy otwarciu. Automatyczne odtwarzanie z dźwiękiem nadal zależy od zgody przeglądarki; po odmowie pierwsze dotknięcie ponawia odtwarzanie bez komunikatu. W przeglądarce testowej potwierdzono odtwarzanie tłumu po START, zatrzymaną muzykę tytułową i wyciszenie wszystkich ścieżek. Nie odsłuchiwano na fizycznym telefonie. Regresje sterowania i nowego przepływu menu przeszły.

## Nowe ekrany przed grą — dwie grafiki użytkownika

Pierwsza dostarczona grafika jest ekranem otwarcia. Przezroczysty przycisk START pokrywa napis PRESS START z obrazu i ma minimalną wysokość dotykową 44 px. START otwiera drugi obraz: wybór BRAX-a. WALCZ rozpoczyna istniejącą cieszynkę, odliczanie i trening. Wróć prowadzi z wyboru do ekranu otwarcia. Stara plansza startowa i logo tekstowe zostały usunięte, arena i postać walki są niewidoczne w menu.

Obie grafiki zachowane bez zmiany bajtów; proporcje 16:9 i pełny kadr, bez rozciągania. Miejsce na animowanego BRAX-a na podeście przygotowane w selectionFighter; oczekuje na zapowiedziany GIF wyboru. Nie dodano zastępczej animacji ani pozostałych niegotowych zawodników. Testy potwierdzają, że START nie uruchamia walki, powrót działa, a WALCZ rozpoczyna intro. Podgląd obu ekranów i przejście do gry sprawdzone w przeglądarce.

## Cztery dostarczone animacje BRAX-a

Podłączono bez zmiany bajtów GIF: chód do przodu (8 klatek), cofanie (8), skok pionowy (15), powitanie cwaniak (14). Razem 17 oryginalnych zasobów z kontrolą SHA-256. Skala nowych animacji ustalona względem wysokości sylwetki istniejących ciosów; przezroczyste marginesy nie wpływają na wielkość postaci.

Sekwencja startowa: INTRO 3580 ms → boczna pozycja bojowa z pierwszej klatki chodu → 3/2/1 po sekundzie → GO i odblokowanie wejścia. Pauza zatrzymuje zarówno cieszynkę, jak odliczanie. Poprzednie gesty zachowane w zasobach, ale nie są odtwarzane dodatkowo. Idle i blok korzystają z pierwszej klatki nowego chodu; brak osobnej animacji bloku nadal pozostaje.

Ruch do przodu/cofanie zapętlają osobne pliki. Kierunek ruchu nie obraca już sylwetki automatycznie; trening solo zachowuje ustawienie w prawo. Skok trwa 1330 ms, zawiera przygotowanie, oderwanie, lot i lądowanie. Ruch pionowy z klatek odwzorowano w pozycji fizycznej raz, bez nakładania drugiej paraboli. Cios w powietrzu jest możliwy po oderwaniu, nie podczas przygotowania do skoku. Po lądowaniu root wraca dokładnie na groundY.

Testy w czterech viewportach: blokada ataków przed GO, wszystkie 4 komunikaty odliczania, odrębne klatki chodu i cofania, fazy skoku i powrót do y=0, wcześniejsze serie i pasek combo. Podgląd przeglądarkowy 844×390 sprawdzony; fizyczny telefon nie był testowany.

## Usunięcie niezamówionych informacji z gry

Na polecenie użytkownika usunięto okno pełnego ekranu, instrukcję ?, podpowiedzi startowe i informację o kolejce ciosów. Pasek combo i podstawowy HUD pozostają. Pojedyncze krótkie stuknięcie w arenę wysyła requestFullscreen, bez ciosu i bez okna informacji. Powtórne stuknięcie jest bezpieczne. Odmowa API nie zatrzymuje gry ani nie wyświetla komunikatu. START i przycisk pełnego ekranu nadal wywołują API.

Nie usunięto ograniczenia przeglądarki: jeśli nie udostępnia element Fullscreen API, pasek może pozostać. Testy potwierdzają wywołanie przy pierwszym stuknięciu, brak dodatkowego żądania po wejściu w fullscreen oraz brak pauzy przy niedostępnym API.

## Sterowanie seriami i czytelność

Jedno naciśnięcie uruchamia jeden atak. Dwa szybkie P: LIGHT_PUNCH → HEAVY_PUNCH, dwa szybkie K: LIGHT_KICK → HEAVY_KICK. Wariant zmienia się przy powtórzeniu do 650 ms. To rozróżnienie akcji lekkiej/mocnej, nie potwierdzona animacja lewej/prawej kończyny — do tego brakuje klatek.

Kolejka FIFO zachowuje do dwóch kolejnych poleceń od początku animacji. Trzy szybkie polecenia dają serię bieżący+2; dalsze przy zapełnionej kolejce są ignorowane. Serie mieszane PPK/PKP/KPK zachowują kolejność. Przytrzymanie nie powtarza podstawowego ciosu. Specjalna animacja COMBO nie przyjmuje dalszych ataków podczas wykonywania. Pauza/blur/zmiana orientacji czyszczą kolejkę. Specjalne combo nadal wymaga pełnego paska, również po wywołaniu z kolejki.

Instrukcja pod ? zawiera sterowanie dotykowe, serie, modyfikatory, klawiaturę i ograniczenia materiałów. Panel przewijany dotykiem. Wskaźnik kolejki pod paskiem zdrowia. Sylwetka dostała niewielką korektę jasności i kontrastu oraz cień konturu; rozdzielczość i oryginalne piksele animacji nie zostały sztucznie zwiększone.

Dodatkowe testy na 4 viewportach: dwa szybkie uderzenia, dwa kopnięcia, kolejność serii mieszanej, limit kolejki, anulowanie na pauzie, brak automatycznych ataków przy trzymaniu przycisku. Podgląd 844×390 i panel instrukcji sprawdzone w przeglądarce.

## Dwukrotne stuknięcie — pełny ekran

Dwa krótkie stuknięcia w wolny obszar areny (do 320 ms, odległość do 48 px) wywołują requestFullscreen bezpośrednio w zdarzeniu użytkownika. Dotyk przycisków walki nie wyzwala tej funkcji. Pojedynczy cios z dotknięcia areny jest opóźniony o 320 ms, aby podwójny gest nie wykonywał przypadkowego ciosu; przycisk P nadal reaguje od razu. Pauza i utrata widoczności anulują oczekujące stuknięcie. Odrzucenie API pokazuje instrukcję zamiast udawać usunięcie paska.

Nie gwarantuje pełnego ekranu w Safari na iPhonie: ograniczenie element Fullscreen API opisane w WebKit 206854/310661. Uruchomienie jako aplikacja z ekranu początkowego pozostaje alternatywą. Test VM potwierdza jedno żądanie fullscreen na podwójny gest i brak przypadkowego ataku; nie wykonano testu fizycznego iPhone'a.

## Kontrakt gruntu dla kolejnych aren

Każda arena musi mieć rekord w ARENAS: wymiary źródła, groundY w pikselach obrazu i positionY zgodne z kadrowaniem tła. Obecna gym: 1536×864, groundY 642.816, positionY 0.52. Render tła i przeliczenie gruntu muszą używać tego samego kadrowania cover. Linia gruntu jest niezależna od klatek zawodnika; każdy przyszły zawodnik potrzebuje swoich kotwic stóp. Dodanie obrazu nie oznacza automatycznego wykrycia podłoża — trzeba ustawić i sprawdzić jego groundY.

## Korekta walki i combo — 2026-10-07

Przyczyna brakujących nóg: same źródłowe GIF-y LIGHT_KICK i HEAVY_KICK zawierają ostre ucięcia na wysokości y=470, mimo przezroczystego marginesu do 512. Poprzedni test krawędzi obrazu tego nie wykrywał. Nie był to dowód poprawności sylwetki. Nie odtwarzamy brakujących pikseli kodem.

Dwa kopnięcia korzystają tymczasowo z pełnej animacji ROUNDHOUSE: lekkie 560 ms, mocne 960 ms. Zachowane oryginalne bajty wszystkich 13 plików. Specjalna sekwencja korzysta z pełnych klatek LIGHT_PUNCH → CLINCH_KNEE → ROUNDHOUSE zamiast uciętego źródłowego combo. Szczegóły i oryginalna konfiguracja: animation-fallbacks.json. Powrót do odrębnych animacji po dostarczeniu poprawnych materiałów przez autora.

Stały poziom podłoża jest oddzielony od rozmiaru płótna animacji. Każda klatka ma kotwicę footY; renderer ustawia ją na podłodze. Test sprawdza zgodność widocznego dołu sylwetki z podłogą dla każdego kroku wszystkich ataków naziemnych w czterech viewportach. Skoki mają osobną wysokość fizyki. Brak maski obcinającej nogi na poziomie podłoża.

Pasek combo startuje od 0, ładuje 5 punktów/s aktywnego treningu (20 s), pauza/przywitanie/combo nie ładują go. Każde udane uruchomienie pobiera całe 100 punktów. Kontrola znajduje się w beginAction, więc obejmuje dotyk, gesty, klawiaturę i bufor wejścia. H+S nadal uruchamia zwykłe kopnięcie obrotowe. Lista ciosów dostępna pod ?. Tryb solo; zasady zdobywania energii przez trafienia można dodać dopiero wraz z przeciwnikiem.

Testy: 88 przebiegów akcji, 70 używanych unikalnych klatek porównanych z Pillow, 13/13 oryginalnych plików zgodnych SHA, blokada pustego combo, zużycie całego paska, brak ponownego użycia i zatrzymanie ładowania podczas pauzy. Nie wykonywano testów na fizycznym telefonie.

## Aktualizacja 2026-10-07 — dopasowanie telefonu

Wdrożono dynamiczny viewport, bez wewnętrznych pasów i przewijania; arena wypełnia ekran, postać zachowuje proporcje. Poziom stóp mapowany na podłogę obrazu areny, ograniczenie skali i położenia przy krawędziach. Minimalny przycisk dotykowy 44 px, bezpieczne marginesy telefonu. Przycisk pełnego ekranu, manifest aplikacji, ikony z istniejącego BRAX-a i instrukcja uruchomienia z ekranu początkowego. Gra nie może usunąć interfejsu otaczającej aplikacji ChatGPT.

Sterowanie: bufor następnego ciosu w ostatnich 180 ms animacji, mniejsze kroki fizyki, kierowanie w powietrzu, zatrzymanie w pionie i zwolnienie wejścia przy zmianie orientacji. Automatyczne dwa gesty wstępne zachowane.

Weryfikacja: 13 plików animacji bez zmian SHA-256, 100 klatek dekodera porównanych z Pillow, 88 przebiegów akcji na czterech viewportach, test bufora ciosu, pauzy i anulowania dotyku. Podgląd przeglądarkowy 844×390 potwierdza widoczne przyciski i proporcje. Brak testu na fizycznym iPhonie.

Nadal potrzebne od autora: bojowy idle, chód/cofanie, fazy skoku i blok; pełne nieucięte klatki combo. Dopasowanie renderera nie odtworzy fragmentów brakujących w pliku źródłowym. To nadal trening solo — walka z nowymi zawodnikami będzie kolejnym etapem.

Poniżej historyczny audyt przed tą aktualizacją.

# BRAXHORN — audyt P0 i BRAX-a

Data: 7 października 2026. Zakres: usunięcie niezatwierdzonej przeciwniczki, analiza kodu, osadzonych animacji i działania treningu solo. Wygląd BRAX-a i arena pozostają bez zmian.

## Ocena

BRAX nadaje się jako baza wizualna bijatyki 2D: ma rozpoznawalną sylwetkę, czytelne rogi, dłonie i jaskrawe akcenty butów. Obecny pakiet ruchów nie jest jednak kompletnym, dopracowanym zawodnikiem do finalnej gry. Problemów z animacją nie rozwiąże samo zwiększenie rozdzielczości ani częstotliwości renderowania.

## Wykonane zmiany

- Usunięto obraz przeciwniczki z HTML, jej obiekt, ruch AI, pasek zdrowia i obsługę trafień. Nie ma niewidzialnego celu ani zastępczej postaci.
- Uruchomiono trening solo bez limitu czasu, automatycznego zwycięstwa i ograniczenia energii. Można sprawdzać każdy dostarczony atak.
- BRAX obraca się w kierunku ruchu. Pauza i utrata aktywności okna zwalniają trzymane klawisze; przyciski przechwytują wskaźnik, a anulowanie dotyku nie wykonuje ciężkiego ciosu.
- Obsłużono odrzucenie żądania pełnego ekranu. Brak zgody przeglądarki nie powoduje nieobsłużonego odrzucenia obietnicy.
- Zachowano bajty wszystkich 13 zatwierdzonych GIF-ów. Nie retuszowano ani nie generowano nowego wyglądu.

## Wyniki audytu — pozostają do poprawy

| Priorytet | Ustalenie i dowód | Potrzebna poprawka |
|---|---|---|
| Wysoki | Chodzenie, zwykły skok, blok oraz idle wyświetlają ostatnią klatkę KNUCKLE_CRACK. Kod `drawStatic` używa tego samego obrazu; test potwierdza identyczne piksele podczas chodzenia. Postać przesuwa się bez pracy nóg. | Osobne zatwierdzone animacje idle, kroków w obie strony, skoku/lądowania i bloku. Nie dorabiać nowego wyglądu postaci. |
| Wysoki | Stałe Y obiektu nie oznacza kontaktu stopy z podłogą. ROUNDHOUSE ma w klatce 6 dolną granicę obrazu zawodnika na Y=457, ale kotwicę na Y=470: różnica 13 pikseli źródła, ok. 10,4 piksela przy wysokości widoku 390. | Zdefiniować stopę podporową i jej kotwicę osobno dla klatek; odróżnić zamierzone oderwanie nóg w skoku od niezamierzonego unoszenia w kopnięciu. |
| Wysoki | W widoku 844×390 stopy BRAX-a wypadają na pionowym froncie podestu, poniżej jego górnej powierzchni. Obecna linia gruntu jest wyliczana od dołu ekranu, niezależnie od grafiki areny. | Uzgodnić jedną linię walki na powierzchni areny i powiązać z nią skalowanie i cień. |
| Wysoki | COMBO ma tylko 362×271 pikseli, pozostałe materiały 512×512. W 15 z 16 klatek nieprzezroczyste piksele dotykają co najmniej jednej granicy pliku. Oględziny pokazują ucięcie stóp lub efektów na dole, a później rogów przy górze. Dotknięcie krawędzi samo nie dowodzi ucięcia anatomii w każdej klatce. | Potrzebny eksport zatwierdzonego combo z pełną sylwetką i zapasem wokół ruchu. Dodanie pustego marginesu nie odzyska utraconych fragmentów. Zachować choreografię BRAXHORN_COMBO_FIXED. |
| Średni | Gesty i ataki mają 6–16 klatek, każda trwa 80–130 ms, czyli ok. 7,7–12,5 klatki animacji na sekundę. Lekki cios blokuje kolejną akcję na 660 ms, combo na 2080 ms. Brak bufora poleceń. | Dostroić fazy i bufor wejścia; sprawdzić odczucie sterowania na prawdziwym telefonie. Wyższy FPS pętli gry nie dodaje brakujących klatek animacji. |
| Średni | Na widoku telefonu przyciski mają 39×39 px, specjalny 48×48 px. Oznaczenia P/K/H/S nie objaśniają kombinacji z H i B. | Zwiększyć wygodę pól dotykowych i czytelność sposobu wywoływania ruchów, zachowując zaakceptowany charakter interfejsu. |
| Średni | Gra zajmuje całe okno, ale nie utrzymuje osobnego pola walki 16:9. `object-fit: cover` przycina tło w zależności od proporcji. 844×390 to ok. 2,16:1, nie 16:9. | Ustalić zachowanie na szerokich telefonach: pole walki 16:9 z miejscem po bokach albo szersza arena. Nie rozciągać postaci. |
| Średni | Kod nie zawiera pełnego systemu wymiennych czterech zawodników, animacji obrażeń, przegranej i nokautu. W oryginale AI wyłącznie się przemieszczało; czas zawsze prowadził do zwycięstwa BRAX-a. | Przed dodawaniem czterech postaci wydzielić wspólny model zawodnika, zestaw animacji i pełne zasady rund. Obecny wynik to trening solo, nie gotowa bijatyka. |

## Czytelność i jakość grafiki

W testowanym widoku 844×390 BRAX jest rozpoznawalny, a kończyny i akcenty butów są widoczne. Ciemny tułów miejscami zlewa się z ciemną areną. Ocena kontrastu na realnym telefonie zależy także od jasności ekranu i oświetlenia; nie była mierzona na sprzęcie użytkownika. Ewentualne delikatne oddzielenie światłem od tła wymaga sprawdzenia i akceptacji wyglądu.

Najpierw należy poprawić kompletność materiałów, kotwice i spójność przejść. Zmiana projektu głowy, ubrania czy kolorów nie jest potrzebna do usunięcia wykrytych problemów.

## Dowody i granice testów

- Testy logiki w Node z symulowanym DOM i zegarem: 11 ataków w obu kierunkach, łącznie 66 uruchomień przy rozmiarach 844×390, 640×360 i 1363×936. Sprawdzone fazy STARTUP/ACTIVE/RECOVERY, zakończenie akcji, lądowanie, pauza, zwalnianie wejścia i brak końca treningu po 90 sekundach. To test logiki, a nie emulacja prawdziwego telefonu.
- Wszystkie 13 GIF-ów mają oryginalne SHA-256. Renderer GIF jest porównywany klatka po klatce z niezależnym dekodowaniem Pillow, z pominięciem nieistotnych wartości RGB przezroczystych pikseli. Wynik: `runtime-audit.json`.
- Test w przeglądarce: ekran startowy, gesty startowe, wejście w IDLE, cios i kopnięcie, zmiana pozycji i pauza/wznowienie. Widok telefonu jest iframe'em 844×390, nie fizycznym urządzeniem.
- Osobny test dotyku wielopunktowego, Safari na iOS, bezpiecznych marginesów i natywnego pełnego ekranu na telefonie pozostaje do wykonania.
- Brak przeciwnika uniemożliwia obecnie ocenę balansu, realnych trafień, reakcji na obrażenia i jakości walki dwóch postaci.
- Oryginalny błąd odrzucenia pełnego ekranu był widoczny w konsoli przeglądarki; poprawiono jego obsługę. Komunikaty rozszerzenia przeglądarki nie są zaliczane do błędów gry.

## Materiały

- `brax-solo-phone.jpg` — faktyczny widok treningu bez przeciwniczki.
- `selected-frames.png` — powiększone oryginalne klatki do oceny ruchu i przycięcia.
- `asset-audit.json` — wymiary, liczba klatek, czasy i granice obrazów.
- `decoded-frame-hashes.json` — niezależne wartości kontrolne dekodowanych klatek.
- `runtime-audit.json` oraz `../scripts/audit-game.cjs` — wynik i powtarzalny test.

Kolejność dalszych prac: linia podłoża i kotwice → brakujące animacje BRAX-a i pełny eksport combo → sterowanie i przejścia między akcjami → wspólny system postaci → druga postać przekazana przez użytkownika.

## 2026-10-07 — animowane plansze i prosty wybór

Pięć oryginalnych GIF-ów użytkownika: dach, metro, port, lawa i dżungla. Zastąpiono odwołania do czterech nieruchomych JPEG-ów i dodano dżunglę. Oryginalne bajty GIF zachowane. Wszystkie mają wiele różnych klatek oraz loop=0 (bez końca); szczegóły w arena-animation-audit.json. Natywny obraz GIF jest stale obecny podczas treningu, bez resetowania źródła w pętli gry. Tło nadal cover na cały dostępny viewport, podłoże niezależne od klatek animacji.

Wybór: trzy miniaturki w ramkach na środku, przesuwanie w lewo i subtelne strzałki. Kliknięcie miniaturki rozpoczyna wybraną planszę. Usunięte podgląd pełnego tła, przycisk walki, powrót oraz dźwięk z tego ekranu, zgodnie z żądaniem samych miniaturek i strzałek.

Walidacja: niezależne dekodowanie wszystkich klatek pięciu GIF-ów Pillow, podgląd pierwszych klatek, test logiki wejścia na każdą planszę i kotwic stóp, gest przeciągania w lewo. Brak nowego testu w prawdziwej przeglądarce i na fizycznym telefonie.

## 2026-10-07 — tło wyboru planszy i szerokość

Dodano oryginalny Braxhorn-ruchome-swiatla.gif (1536×711, 120 klatek, loop=0) jako tło wyboru planszy. Trzy miniaturki pozostają na środku. Na tym ekranie gra istniejący licencjonowany utwór Prepare to Fight; tłum pozostaje na ekranie zawodnika.

Szerokość gry bierze pełny viewport układu, nie zwężony visualViewport; usunięto boczne przesunięcie visualViewport. Kontenery menu przypięto jawnie do wszystkich krawędzi. Regresja sprawdza szerokość 844 przy visualViewport 726 i offsetLeft 59. To zabezpieczenie dla zgłoszonych marginesów; nie potwierdza zachowania Chrome na fizycznym iPhonie. Pasek Chrome nie jest kontrolowany CSS-em; manifest pozostaje skonfigurowany do uruchomienia aplikacji z ekranu początkowego.

## 2026-10-07 — napis BRAX i delikatniejsze kroki

Tylko stylistyka istniejącej nazwy zawodnika: gruba pochyła typografia, srebrny gradient i cienki zielony akcent. Bez dodatkowego tekstu i bez zmian grafiki postaci. Kroki zastąpiono krótkim suchym dźwiękiem kontaktu o łagodnym wybrzmieniu; rytm nadal wynika z klatek chodu.

## 2026-10-07 — neonowy obrys nazwy w wyborze zawodnika

Zachowano oryginalny srebrny gradient i pochylenie. Powiększono litery, zwiększono odstępy, dodano zielony obrys każdej litery i wyśrodkowano kontener. Sprawdzono wizualnie w działającym podglądzie, w tym w iframe 844×390; pełny obrys, srebrne wnętrze i pochylenie widoczne. To podgląd rozmiaru telefonu w Chrome, nie fizyczny iPhone.


## NYXA integration — 2026-10-07

Continued existing game. NYXA occupies slot 2; slots 3–4 remain empty.
Compared the individual uploads with NYXA_SAME_GIFY: duplicate uploads have identical bytes. Kept 28 unique pack actions plus separate selection and frontal intro. Exact original GIF bytes are embedded in nyxa-data.js; selection uses its original GIF. No generated artwork.

Ten attacks: jab, cross, teep, body kick, high kick, standing knee, jumping knee, lunge punch, low kick, hook. Two-turn combo remains separate, including user-approved dust. Original transparent frames checked against independent Pillow decoding; all decoded frame hashes match. Grounded actions use per-frame shoe anchors; actual jumps retain lift. Low kick and hook source frames have visible proportion differences; anchoring stabilizes contact but does not redraw anatomy. Intro scale is normalized to idle height.

Controls: P cycles hand strikes, K cycles kicks, H+P standing knee, jump+P jumping knee, S charged combo, U/E evade, B block, arrows movement/jump. Intro, hit reaction and round-end reactions are context driven. Optional gestures and extra defensive poses are retained as assets without adding redundant buttons.

Selected fighter spars against the other approved fighter. Both face one another after side changes; hit geometry mirrors with artwork. Actual collisions reduce health; blocks reduce damage and evades have a limited protection window. Sparring resets after knockout. BRAX lacks a supplied fall animation, so its existing pose remains at knockout.

Verification: Node simulation at 844×390 and 568×320 for both players; movement, facing, ground contact, attacks, jumping knee, block reduction, evade expiry, pause, collision damage, empty slots. Browser preview at 844×390: selection, original GIFs, intro/countdown, live arena, attack controls and fighter scale. No storefront changes.


## Round rules, automatic combo and intro videos — 2026-10-07

User-authorized continuation: replaced B with a hollow shield icon (same control, accessible label Blok); S now explicitly reads COMBO. Preserved artwork and selection layouts.

Round duration 60 seconds, up to three rounds, match ends on two wins or after round three. Timeout compares remaining health; equal health is a drawn round. Maximum three rounds even with draws; equal match score is a draw. Timer starts after the pre-fight countdown, pauses with gameplay and stops at round end. Results provide rematch or fighter selection.

Combo requires 100% charge, consumes it immediately, clears queued input, automatically closes the distance, then starts the original sequence. Two uses maximum each round. Inputs cannot queue another combo while approaching; third use is rejected even if energy is set full. Meter/uses reset between rounds. Tests confirm approach actually causes collision damage for both characters.

NYXA movement and combo approach are 22% faster than BRAX. Her recovery frames after the last active attack frame play 18% faster; original image bytes and active attack timings are preserved. AI NYXA shares movement advantage and a modestly shorter attack cooldown.

Original supplied ten-second MP4s mapped by viewed content: ec87573d is BRAX, 1d68f53d is NYXA. Played once after arena confirmation before existing intro/countdown. Full viewport cover, inline mobile playback, original audio follows mute. If autoplay is denied, a play control resumes. Visibility loss pauses film and requires explicit resume.

Verification: simulation for both fighters at 844×390 and 568×320; prior animation/controls tests, separate film URLs, timer frozen during film, charged combo, immediate energy consumption, approach hit, repeat rejection, two-use limit, round progression, reset, match end and rematch. Browser preview checks BRAX/NYXA video selection and the landscape HUD/control layout.
