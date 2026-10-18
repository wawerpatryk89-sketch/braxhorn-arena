# Audyt gry — 7 października 2026

Zakres: przejścia ekranów, odliczanie, dotykowe sterowanie, skala postaci, realny kontakt i ładowanie.

- START pozostaje widoczny do rozpoczęcia filmu. Ekrany przechodzą przez wygaszenie 240 ms w każdą stronę. Zmiany są kolejkowane; szybkie pominięcie nie gubi planszy praw. Plansza zachowuje czas 4 sekund, zatrzymywany przy ukryciu karty. Film zawodnika ma ograniczone oczekiwanie na pierwszą klatkę, a przy błędzie nadal dostępne są odtwarzanie i pominięcie.
- Odliczanie czeka do 4 sekund na załadowanie nagrań 3, 2, 1, FIGHT i gongu. Kontekst audio jest ponownie wznawiany po filmie. Błąd sieci nie blokuje walki bez końca; wyciszenie pozostaje respektowane.
- Ataki po prawej są w siatce 3 × 2. P i K na dole, H i COMBO wyżej, U po lewej. Niezależne wskaźniki dotykowe obsługują ruch i atak jednocześnie. Bufor przechowuje jeden następny cios i odrzuca go po 450 ms.
- Wspólna skala obrazu oraz pól trafień została zwiększona. Przeciwnik podchodzi na krótszy z zasięgów podstawowego ciosu obu postaci, z zapasem rzeczywistego kontaktu. Postacie rozpoczynają bliżej środka. Obrażenia nadal wymagają przecięcia pól trafienia i ciała; brak trafień przez całą arenę.
- Skrypty danych są pobierane z niskim priorytetem po rozpoczęciu filmu startowego, a wykonywane po wyborze zawodnika. Usunięto nieużywane style starych elementów, nieużywaną zmienną i zbędne zagnieżdżenie pętli. Lista przycisków ataku jest zachowywana zamiast wyszukiwana w DOM co klatkę.

Weryfikacja: `npm test` — testy przejść oraz modelu gry, obaj zawodnicy, 844 × 390 i 568 × 320, ciosy w obu kierunkach, rzeczywiste podejście przeciwnika, dotyk dwoma wskaźnikami, pełna kolejność głosu odliczania, identyczność pikseli oryginalnych animacji. Testy używają symulowanego DOM/audio, nie fizycznego iPhone’a. Płynność GPU, faktyczny dźwięk i wydajność sieci na telefonie nie zostały zmierzone.
