# PL/EN — wynik odbioru lokalnego

**PASS: 12 kontroli, 103 zrzuty, 103 pomiary układu.** Koniec testu: 19.10.2026, 16:58:38 UTC. Pełny zapis: [proof.json](proof.json).

Sprawdzono widoki 844×390, 915×412, 932×430 oraz 1366×768. Na widokach telefonów zastosowano emulowane bezpieczne marginesy 44 px z lewej i prawej oraz 21 px od dołu. W wykonanych pomiarach wykryto 0 kolizji, elementów poza ekranem, ucięć tekstu, brakujących kluczy, surowych kluczy tłumaczeń, polskiego tekstu interfejsu w EN, błędów JavaScript oraz błędów API. Nie skrócono również żadnego z użytych testowych nicków.

Przełączanie PL/EN zachowało wpisane dane logowania i rejestracji, wybrany awatar, powiększenie i piksele kadru, dane formularza profilu, poziom trudności, wybór zawodnika i areny. Język gościa przetrwał odświeżenie, a język konta — odświeżenie, ponowne logowanie i logowanie w drugiej, izolowanej sesji przeglądarki.

Rzeczywista lokalna walka wystartowała. Przełączenie języka zachowało zawodników, arenę, rundę, wynik i stan działania. Dwa oddzielne konteksty przeglądarki uruchomiły wspólną walkę online: gospodarz w PL, przeciwnik w EN. Oba widziały te same identyfikatory kont i awatary. Kanoniczny komunikat `PAUZA` przeszedł przez rzeczywiste połączenie i został pokazany jako `PAUZA` / `PAUSED`. Ranking, historia i drabinka turnieju korzystały z tego samego nicku, identyfikatora i awatara konta w obu językach.

Przykładowe zrzuty:

- Logowanie: [PL](844x390-pl-login.png), [EN](844x390-en-login.png).
- Rejestracja: [PL](844x390-pl-registration.png), [EN](844x390-en-registration.png).
- Walka lokalna: [PL](844x390-pl-fight-hud.png), [EN](844x390-en-fight-hud.png).
- Dwa konta online: [gospodarz PL](844x390-pl-online-host-pl-hud.png), [przeciwnik EN](844x390-en-online-peer-en-hud.png).
- [Ranking EN](844x390-en-ranking.png), [historia EN](844x390-en-match-history.png), [turniej EN](844x390-en-tournament-bracket.png).

Test wykonano w Chromium i izolowanej bazie SQLite przez prawdziwe lokalne API, z rzeczywistymi obrazami i renderowaniem zawodników. Zrzuty telefonów pochodzą z emulacji; nie testowano fizycznego iPhone’a, Androida, Safari, aparatu ani sieci komórkowej.

Ekran wyniku lokalnego sprawdzono przez jawnie wymuszony stan 2:1 wyłącznie w przeglądarkowym narzędziu testowym. Nie jest to rozegrana wygrana ani wynik przyjęty do rankingu. Komunikat online `PAUZA` także wyzwolono narzędziem testowym, po czym został przesłany zwykłym połączeniem gry. Te narzędzia są wstrzykiwane przez skrypt testu i nie występują w produkcyjnym kodzie gry. Ten raport opisuje odbiór lokalny; nie potwierdza samodzielnie wdrożenia produkcyjnego.
