# BRAXHORN — przebudowa UI

Baza: v147, e111aff9c0db723bfeb43d486e3d97efbd86cd5a.

Wspólna warstwa: `game/assets/ui-system.css` (tokeny i układy), `ui-system.js` (ScreenHeader, PlayerChip, Button, SegmentedControl, ArenaPicker, CodeInput, Toast, odmiana liczebników, prezentacja VS, postępy i stany). Lokalne fonty Inter/Teko, licencje OFL w `assets/fonts/`. Brak zależności fontów od usług zewnętrznych.

Ekrany: wybór zawodnika i areny, turnieje/lobby, multiplayer, wyzwania, ranking i Survival. Komponenty zachowują identyfikatory oraz istniejące procedury obsługi akcji. Natywne selektory są ukrytymi modelami formularzy; widoczne sterowanie to segmenty/miniatury. Formularze kodów turnieju i osobistego zachowują osobne akcje, ale widoczny jest jeden formularz naraz.

| Kontrola | Wynik | Zakres |
|---|---|---|
| `npm run test:ui` | PASS | 8 nagłówków, normalizacja/wklejanie kodu, disabled, dynamiczne formularze, rola organizatora, jedna główna akcja, odmiana, wykluczenia NINY |
| `npm run test:147` | PASS | dotychczasowe testy aren, rankingów, sieci i przepływu ekranów |
| `npm run test:viewport` | PASS | matematyka viewportu i zdarzenia orientacji; nie ocena obrazu |
| Zachowanie zasobów | PASS | 164 istniejące pliki mediów zgodne SHA-256 z bazą |
| Silnik, transport i konfiguracje | PASS | combat.js, multiplayer.js, rtc.js, peer-link.js i 8 config.json bez zmian |
| Ocena obrazu 844×390 / 740×360 / 932×430 | NIEWYKONANE | brak obsługiwanej przeglądarki control-browser w środowisku Sites |
| Pomiar 60 FPS na telefonie | NIEWYKONANE | brak urządzenia i sesji pomiarowej |
| Pełny kontrast obliczonych stylów | NIEWYKONANE | brak renderowania przeglądarki; słaby kolor #5E6A64 z briefu służy disabled, tekst pomocniczy używa #9AA59F |

Ograniczenia: nie dodano waluty ani nowych nagród za wyzwania — istniejąca mechanika zapisuje ukończenie. Liczby walk nie są gromadzone w profilu, dlatego karty pokazują istniejące zwycięstwa i rekord Survival. Drabinka przed losowaniem pokazuje miejsca do obsadzenia, nie fikcyjne pary. Animacja VS dla wyboru ręcznego; w trybach z losowanymi przeciwnikami nie przedstawia fałszywie wybranej postaci. Brak potwierdzenia pełnej zgodności wizualnej bez testów przeglądarkowych.
