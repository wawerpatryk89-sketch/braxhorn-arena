# Poprawki po zgłoszeniu zdjęć IMG_8220–IMG_8225

## Potwierdzone problemy i zmiany
- `.roster-card span` nadawał wszystkim etykietom statystyk pozycjonowanie absolutne plakietki. Zawężono regułę do bezpośredniej `.roster-badge`; etykiety mają osobne, statyczne reguły siatki.
- Lista ćwiczeń zawierała błędne `</option value=...>`. Poprawiono składnię. Usunięto widoczność zbędnych pól przed wyborem zawodników; ćwiczenia pozostają w panelu podczas treningu, z rzeczywistymi nazwami ataków wybranego przeciwnika. Pole ataku widoczne tylko przy powtarzanym ataku i kontrze.
- Skróty Survival, Wyzwania i Rekordy przeniesiono z ustawień każdego trybu na wybór trybu.
- Replay interpolował pozycję między różnymi akcjami, choć nie interpolował samej animacji. Mógł w ten sposób odsuwać postać przed rozpoczęciem reakcji. Zablokowano interpolację całego aktora na granicy akcji.
- Dodano wymuszony zapis obu pozycji w momencie wykrytego kontaktu przed zastosowaniem reakcji. Omija ograniczenie częstotliwości próbek. Klatka ataku zgodna z klatką używaną do kolizji.

- Usunięto odrzucone oznaczenia HP/pkt i liczby z kart. Paski mają widoczne etykiety PIĘŚCI, KOPNIĘCIA, COMBO. Długość wynika z najsilniejszego dostępnego pełnego ataku danej kategorii na wspólnej skali 100 zdrowia. Kategorię ustala faktyczna kończyna, nie nazwa przycisku: Nina nie ma technik pięści, więc jej pasek pięści jest pusty z kreską. To nie są wymyślone oceny ani bonusy postaci.

## Sprawdzenia
`audit-contact-ui.cjs`: składnia opcji, zakres reguł CSS, położenie nawigacji, brak odsuwania przed zmianą akcji, wymuszona próbka kontaktu.
`test:repairs`, `test:audit`, `audit-ko-replay`, `audit-mode-first-films` — PASS.
Ponownie `audit-engine-acceptance` po korekcie ułamka klatki kontaktu.

## Granice dowodów
Zdjęcia użytkownika potwierdzają problem interfejsu przed zmianą. W środowisku nie ma dostępnej obsługiwanej kontroli przeglądarki ani fizycznego iPhone'a. Nie ma nagrania po zmianie. Zmiany replay usuwają znalezione błędy zapisu i interpolacji; nie dowodzą idealnego dopasowania powierzchni modelu 3D do wszystkich hitboxów. Pełny odbiór trafień w obrazie pozostaje otwarty. Nie zmieniano zasięgu, obrażeń, modeli ani zatwierdzonych technik.

## Dalsze zgłoszenie: nadmiar krwi
Zmniejszono rozprysk do 5 cząstek dla 12 obrażeń, czas do 260–420 ms; tylko trafienia głowy. Brak trwałych śladów po pierwszych dwóch trafieniach; rozwój co trzy trafienia w ten sam obszar. Maksymalnie trzy ślady głowy i trzy miejsca obicia. Ciosy w korpus i nogi dają stopniowe, mniejsze, przygaszone siniaki bez czerwonych rozcięć i bez rozprysku. Trafienia w tę samą kapsułę zwiększają jeden ślad, nie nakładają kolejnych plam. Test audit-blood-gradual PASS. Ocena wizualna nadal niepotwierdzona. Od 14.10 użytkownik ponownie polecił kontynuować całość napraw. Nie przywrócono odrzuconych oznaczeń punktowych.


## Brax — potwierdzona regresja chwytu i combo
- Automatyczne zwarcie blokowało przycisk świadomego chwytu. W początkowej fazie kontaktu (przed 550 ms) ręczny chwyt może przejąć kontakt, z zachowaniem istniejących warunków i zasięgu rzutu. Samo zwarcie nadal nie rzuca.
- Combo było automatycznie urywane po pudle lub bloku jednej grupy. Przywrócono pełną zatwierdzoną sekwencję Uppercut Jab → Kicking, bez wymiany klipów. Skuteczny blok nadal wyklucza obrażenia; rzeczywiste trafienie w Braxa może przerwać sekwencję.
- `acceptance/brax-reported-before.json` oraz `brax-reported-after.json`: przed zmianą blok ucinał combo po klatce 40, a chwyt podczas kontaktu zwracał false; po zmianie sekwencja dochodzi do kopnięcia od klatki 216, a rzut odejmuje 12 zdrowia raz.
- `audit-brax-input-paths.cjs`: 24 scenariusze ręcznego chwytu (6 rywali × 2 strony × dotyk/klawiatura) i 2 rzeczywiste kontry przerywające combo. Atrapy renderera; brak dowodu obrazu.

## Osobne ekrany i spójne zadania
- Survival: własny pełny ekran, prawdziwe reguły zdrowia i serii, wybór trudności, zapisany rekord na tym poziomie i przejście do zawodnika.
- Wyzwania: własny pełny ekran, pięć zadań z celem i stanem ukończenia, postęp konkretnego zawodnika. Bez fikcyjnych nagród.
- Po wyborze wyzwania następuje bezpośrednie przejście do zawodnika, bez zbędnego okna ogólnych ustawień. Przy ponownym otwarciu informacji o zadaniu ukryto niezgodne opcje zachowania i trudności. Panel w walce nie pozwala zamienić tego zadania w sparing. Odnowienie treningu rozpoczyna nową próbę: licznik, czas i ślady od zera, zdobyte wcześniej osiągnięcia pozostają zapisane.
- Testy `audit-mode-destinations.cjs` obejmują menu przed i po załadowaniu silnika; `audit-drills.cjs` rzeczywisty atak, zerwanie, blokadę zmiany zadania i reset.

## Źródła wzorców
- Oficjalny Tekken 8: https://tk8.tekken-official.jp/en/mode/offline.php — osobne funkcje ćwiczenia, powtarzanie scenariuszy, trening combo; https://tk8.tekken-official.jp/en/mode/replay.php — replay jako narzędzie analizy kontaktu i reakcji.
- Capcom / Andy Wong: https://blog.playstation.com/2023/04/20/street-fighter-6-showcase-new-gameplay-details-future-fighters-revealed-and-demo-launched/ — osobne materiały nauki, próby combo i stopniowe ślady walki.
- Wykorzystano zasady rozdzielenia celów i czytelnej informacji. Nie skopiowano cudzych grafik, parametrów postaci, zasad Survivalu ani nagród. Reguły BRAXHORN są odczytane z własnego silnika.


## Wyzwania — działanie zamiast samego wywołania zaliczenia
Znaleziono błąd: unik odliczano dopiero w obsłudze kolizji. Gdy oryginalna animacja skutecznie odsuwała ciało i cios geometrycznie mijał model, kolizji nie było i licznik nie rósł. Dodano sprawdzenie, czy cios trafiłby pozycję sprzed uniku; zaliczenie tylko w aktywnym oknie uniku i raz na grupę ciosu. Obrażenia, hitboxy i animacje pozostają bez zmian.

Ten sam sterownik wejść uruchomiony na opublikowanym v115 i kandydacie: `116-challenges-baseline.json` / `116-challenges-after.json`. Przed zmianą próba uników nie kończyła się dla Vexy, Niny i Danny’ego; po zmianie uniki i odepchnięcia zakończone dla wszystkich sześciu. Próba obejmuje powtarzane ataki Braxa i kilka momentów naciśnięcia uniku; nie jest testem wszystkich par ani ludzkiej łatwości nauki. Dodatkowo `116-evasion-scoring.json`: pudło z daleka nie zalicza, 100 ocen tej samej grupy ciosu daje jedno zaliczenie.

Kontra: `116-counter-contact.json` potwierdza naliczenie po faktycznej kolizji w przygotowanym stanie powrotu po pudle, trzy razy u sześciu postaci, bez podwójnego liczenia. Osobny sterownik wycofania i kontry ukończył tylko 2/6 scenariuszy (Vexa, Nina); pozostałych NIE uznano za PASS. Zapis `116-counter-controller-incomplete.log` pozostaje otwartym punktem oceny grywalności i momentu kontry. Nie zwiększono sztucznie okna ani zasięgu, żeby uzyskać zielony wynik.

## Aktualny zakres odbioru
Naprawy kodu są udokumentowane. Nie ma potwierdzenia, że gra jest perfekcyjna ani że każde okno wygląda dobrze na iPhonie. Przeglądarka pozwoliła obejrzeć ekrany menu, ale zgłasza brak kontekstu WebGL. Nadal brakuje fizycznego urządzenia, nagrań animacji po zmianach, pełnej okluzji ran, zatwierdzonych reakcji nóg i czterech zestawów głosów. Historyczny test ruchu stóp gardy nie przeszedł; szczegóły w masterze i logu. Odbiór całego zlecenia pozostaje OTWARTY.


## Pakiet
Budowanie czyta oryginalne klipy z katalogu źródłowego, a nie pozostałości wcześniej zakodowanej paczki. Usunięto błąd ponownego kodowania Float32. Wszystkie próbki nadal sprawdzane bit po bicie; bez zmiany animacji. Rozmiar paczki statycznych plików po finalizacji: 264 574 538 B. To wielkość dostawy, nie pomiar pamięci ani ładowania iPhone’a. Pliki JS/CSS zgodne ze źródłem po zamianie odnośników PNG na bezstratne WebP. Oryginalne modele, klipy i tekstury porównane z bazą — zachowane.


## Korekta przed publikacją: pierwsze uruchomienie Survivalu
Pierwszy wybór trybu w małym menu przekazywał stan do dopiero załadowanego silnika. Ponowne ustawienie trybu otwierało ekran Survivalu, a dalsze przejście do areny go nie zamykało. To mogło zasłonić film i walkę. Przejście do areny zamyka teraz oba ekrany trybów. `117-boot-before.json` i `117-boot-after.json` obejmują sześć wariantów startu, w tym Survival i wyzwanie. Wariant przed zmianą: Survival pozostawał widoczny przy uruchomionej walce. Po zmianie: ukryty, wybrany tryb i zadanie zachowane. Wersja 116 została zapisana, ale nie wdrożona; ta korekta jest dołączona przed pierwszą publikacją całego zestawu.

## Kontrola przeglądarki 15 października — uzupełnienie do wersji 117
- Rzeczywiście obejrzano start, profil, menu, Survival, Wyzwania, karty zawodników i ustawienia treningu. Zrzuty: acceptance/117-survival.jpg i acceptance/117-challenges.jpg.
- Wykryto nakładanie skrótów Survival/Wyzwania na stopkę menu; przesunięto je wyżej, zwiększono czytelność. Zweryfikowano obraz po zmianie. Przycisk zamknięcia ustawień odsunięto od dźwięku.
- Podgląd Vite nie rozwiązywał istniejącej mapy importów Three.js. Dodano zgodny alias do oryginalnego pliku vendor, bez wymiany biblioteki.
- Odczyt gzip uwzględnia zarówno surowy plik gzip, jak i treść już rozpakowaną przez warstwę HTTP. Test 117-loader.log obejmuje oba warianty, zwykły JSON oraz błąd HTTP.
- Po zmianie odczytu przeglądarka dotarła do tworzenia renderera i zwróciła THREE.WebGLRenderer: Error creating WebGL context. To ograniczenie obecnego podglądu; NIE stanowi potwierdzenia działania walki ani dowodu usterki modeli. Komunikat gry rozróżnia teraz niedostępną grafikę 3D od błędu sieci.
- Ponowiono 28 scenariuszy wejść Braxa (117-brax-inputs.json) oraz sześć przepływów zimnego startu (117-boot-after.json). PASS dotyczy kodu, nie wyglądu animacji.
- Całościowy odbiór zlecenia pozostaje OTWARTY: brak wizualnego testu walki, filmów kontaktu/KO, pomiarów fizycznego iPhone’a; wcześniejsze ograniczenia reakcji, głosów i wyzwania kontr pozostają opisane powyżej.
