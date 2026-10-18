# Sześć ataków i capoeira Niny — 12.10.2026

## Przyczyna

Wersja bazowa 695490af23857e0f54d0f24f5ab32469b0d05139 zawierała po sześć ataków w SOURCE_ATTACKS, ale tylko cztery przyciski ofensywne. Dwa dodatkowe ataki wymagały kierunku do przodu. Blok, unik i combo nie należały do tych sześciu ataków. Etykiety przycisków Niny nie odpowiadały aktualnym klipom.

## Zmiana

- Układ, liczba i etykiety przycisków przywrócone dokładnie do wersji bazowej. Nie dodano przycisków. Zachowano P1, P2, K1, K2, COMBO, unik, chwyt oraz blok.
- Piąty i szósty atak: przód + P1/P2 u Braxa, Nyxy, Vexy, Krova i Danny’ego; przód + K1/K2 u Niny. „Przód” oznacza kierunek do przeciwnika. Dotychczasowe sterowanie klawiaturą zachowano.
- Karty opisują prawdziwe kombinacje przycisków obok nazw ataków, zamiast liczyć obronę jako cios.
- Test przez rzeczywiste zdarzenia strzałka + przycisk wykazał pudła krótkich ataków u kilku postaci. Kolizja neutralna obejmowała wysunięte kończyny i odsuwała zawodników poza zasięg, choć bezpośrednie uruchomienie ataku w teście trafiało. Teraz ten sam obrys miednicy chroni odstęp zarówno w chodzie, jak i w ataku; wyciągnięta kończyna nie odpycha drugiego ciała. Hitboxy pozostają przy prawdziwych kończynach, nie rozszerzono ich sztucznie.
- Nina: Meia Lua De Frente; Macaco Side jako wejście do Breakdance 1990; Leg Sweep (1); Martelo Do Chau Sem Mao; Chapa-Giratoria; Armada.
- Combo Niny: pełna Capoeira (1), następnie Armada. Pięć okien trafienia, maksymalnie 40 obrażeń przed obroną/pudłem; bez zwiększenia dotychczasowej sumy obrażeń combo.
- IDLE Niny i wszystkie inne niezamówione stany Niny pozostawiono identyczne względem wersji bazowej. Jej zakaz rzucania oraz możliwość bycia rzucaną zachowano.
- Pozostałym pięciu postaciom zachowano oryginalne sześć różnych animacji ofensywnych; naprawiono dostępność skutecznego kontaktu po podejściu. Modele, tekstury i oryginalne próbki animacji nie zostały zmienione.

## Dowody

- audit-auto-clinch.cjs: 72 pary/strony; minimalne odepchnięcie, brak przechodzenia przez ciało, automatycznych chwytów lub obrażeń przy podejściu.

- audit-six-input.cjs: 432 próby (6 postaci × 6 ataków × 6 przeciwników × 2 strony) przez zdarzenia oryginalnych przycisków i strzałek, z rzeczywistym kontaktem i powrotem sterowania. Porównanie całego HTML sterowania z bazą: identyczny. IDLE Niny identyczne; wszystkie jej okna ataku powiązane ze stopami.
- audit-combat-integrity.cjs: 864 przypadki kontaktu każdy z każdym, 36 pudeł z dystansu, 12 powrotów po powaleniu, blok i KO.
- audit-combo-approach.cjs: 144 scenariusze, wszystkie grupy kontaktów, obie strony i granice areny.
- audit-phone-controls.cjs: 48 przypadków zwolnienia, anulowania i utraty dotyku, zmiany kierunku i kolejnego ataku.
- Wyniki i mapa sześciu ataków każdego zawodnika: six-attacks-input-proof-20261012.json.

To testy logiki z atrapą renderera, nie testy wizualne Safari. Środowisko Sites nie udostępnia control-browser, dlatego nie potwierdzono wyglądu, płynności przejścia breakdance ani wygody sterowania na rzeczywistym iPhonie.
