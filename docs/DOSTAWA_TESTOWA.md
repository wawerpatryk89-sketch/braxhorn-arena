# Dostawa testowa po audycie v113

**Bez wdrożenia. Całe zlecenie nie jest zamknięte.** Kandydat zawiera poprawki kodu i dane do odbioru. Nie zawiera wymyślonych nagrań ani pomiarów telefonu.

Bieżąca specyfikacja: [MASTER_AUDYT_20261014.md](MASTER_AUDYT_20261014.md).

| Punkt zlecenia | Wykonane i sprawdzone | Pozostały warunek odbioru |
|---|---|---|
| 1. Uczciwość | Odroczone rozliczenie obu legalnych trafień, wspólny stan obrony; 24 scenariusze sześciu postaci, obu stron i podwójnego KO | Szersze mieszane pary i nagranie równoczesnego trafienia |
| 2. Czas | Akumulator 60 Hz, wspólny zegar, timeout także po rozliczeniu kontaktów; identyczny wynik scenariusza przy 30/60/120/144 Hz | Rzeczywiste odświeżanie i opóźnienia wejść na urządzeniach |
| 3. Automatyczne zwarcie | Symetryczna animacja przy obustronnym naporze, bez rzutu i obrażeń; zachowany przytrzymany kierunek | Film animacji, kontakt dłoni i barków |
| 4. Chwyty | Korekta pozycji rozłożona na 180 ms; zachowane 200 ms zerwania i jednokrotne obrażenia lądowania | Wszystkie pary na obrazie, stopy, przenikanie, narożniki |
| 5. Trudność | Obserwacja podczas recovery, terminowy blok/kontra, bez atakowania chronionego wstawania; 1080 rund + 20 prób pierwotnego spamu | Krov nadal przegrał 1/10 prób spamu; dalsza kalibracja i gracze |
| 6. Combo | Brax 56→48 HP, Krov 28→44 HP; zachowana geometria i klipy; recovery z ogona combo; 144 ustawienia pełnych combo | Ocena tempa i przerwalności w realnej rozgrywce; balans nie jest ostateczny |
| 7. Kontakt | Punkt krwi i iskier z potwierdzonej kapsuły celu; zachowany system siły reakcji | Osobne reakcje nóg; zgodność interpolowanego renderu z kolizją |
| 8. Modele | Kontrola niezmienności modeli, tekstur, klipów i geometrii; istniejące testy 82 przypadków ruchu | Brak nowego wizualnego odbioru i poprawek rigów na podstawie obrazu |
| 9. KO/replay | Zachowany hit-stop KO, spójny rzut, czas symulacji w replay, zapis efektów i dźwięku, brak zoomu, wynik raz | Film kontakt→reakcja→upadek→wynik oraz rzeczywisty odsłuch |
| 10. Krew | Czas symulacji, zapis cząstek w replay, punkt kontaktu; ukrywanie śladów w gardzie i zwarciu | Pełna okluzja 3D i śledzenie skóry nadal niegotowe |
| 11. Dźwięk | Świsty obu stron, typ wg kończyny, odtwarzanie zapisanych zdarzeń raz | Brak zatwierdzonych głosów czterech postaci; odsłuch na iOS |
| 12. Ekrany | Regresje nawigacji, instrukcji, pauzy, błędów i 48 przypadków dotyku; zachowany wygląd | Oględziny wszystkich ekranów na telefonie, czytelność i odstępy |
| 13. Wydajność/odporność | Mniej metadanych na start, kolejka par, cleanup częściowego błędu, WebGL pause/restore, diagnostyka | Fizyczny iPhone, FPS/GPU/pamięć, Safari, wizualny efekt wyłączenia preserveDrawingBuffer |
| 14. Tryby/zapis | Testy Walki, kampanii, Survival, Treningu, Wyzwań, rankingu, remisów i jednokrotnego zapisu | Pełny przebieg użytkownika na urządzeniu |

## Dowody przed i po

- Baseline to oddzielny checkout dokładnego commitu v113, a nie rekonstrukcja starszego zachowania.
- `acceptance/before-engine-diagnostics.log`: 100/100→96/100 przy równoczesnym ciosie; brak choreografii obustronnego kontaktu; zegar 60→60 po 960 ms zwarcia.
- `acceptance/before-test-status.json` i trzy pliki `before-audit-*.log`: nowe testy wzajemnych trafień, sprzątania częściowego błędu tekstur i zdarzeń replay zawodzą na v113. Te same testy przechodzą w kandydacie (`npm-test-audit.log`).
- `acceptance/engine.json`: wynik po zmianie, w tym równe obrażenia, double KO, 4 odświeżania, zachowanie kierunku i timeout w kontakcie.
- `acceptance/ai-matrix.json`: wszystkie 1080 rund i ich wyniki. `ai-critical.json`: 20 szczegółowych prób przeciw Vexie/Krovowi; nie ukryto przegranej Krova. `before-ai-critical.json` zawiera te same 20 prób na v113: Vexa wygrywała 4/10, Krov 0/10; po zmianach odpowiednio 10/10 i 9/10.
- `acceptance/current-game-data.json`: parametry i kontrola oryginalnych zasobów. Zmniejszenie danych startowych to pomiar rozmiaru gzip, nie czasu ładowania na telefonie.
- `npm-test.log`, `npm-test-repairs.log`, `npm-test-audit.log`, `build.log`: rzeczywiste logi. Testy logiki używają atrap DOM/rendererów; nie są nagraniem WebGL.

Część pozostałych zmian wynika z analizy kodu i testów po zmianie, bez osobnego uruchomionego testu regresji na bazie dla każdej linii. Takich pozycji nie oznaczamy jako pełny odbiór „przed i po”.

## Budowanie i odtworzenie

W katalogu źródeł: `npm test`, `npm run test:repairs`, `npm run test:audit`, `npm run test:ai-matrix`, `node scripts/export-audit-master.cjs`, `npm run build`.
Build korzysta z już dostarczonego Three.js przez loader repozytorium. Nie wymaga pobrania innej wersji Three.js. Katalog `build/` jest gotowym pakietem statycznym. Sprawdzana jest dokładność Float32 wszystkich spakowanych próbek animacji.

Do ostatecznego odbioru potrzebne są: obsługiwana sesja przeglądarki, fizyczny iPhone, referencje wizualne do porównania oraz zatwierdzone brakujące głosy i reakcje nóg. Nie publikować tego kandydata jako „kompletnie dopracowanej gry” przed zamknięciem tych warunków.
