# Audyt aktualizacji — 14.10.2026

## Wdrożone
- Imię lub pseudonim przy wejściu: 2–20 znaków, zapamiętywanie profilu, oddzielne postępy zawodników.
- TOP 5 lokalnie w przeglądarce, osobno dla trybu i trudności. Powtórne zakończenie nie dubluje wyniku; kolejne zwycięstwa Survival aktualizują ten sam przebieg. Ranking rozstrzyga wyniki liczbą zwycięstw/ukończeniem, potem czasem.
- Krótka instrukcja przed każdą walką, dopasowana do rzeczywistych ruchów i obrony wybranego zawodnika; walka czeka na potwierdzenie.
- Survival: jedna runda, zmienni przeciwnicy, przenoszenie zdrowia i regeneracja 20 punktów po zwycięstwie.
- Pięć wyzwań, zapis osiągnięć bez bonusów do siły, trening powtarzanych ataków, kontr i zerwania chwytu.
- Różne preferencje dystansu i ataków CPU; trzy stopnie reakcji na trafienie; garda górna/dolna z zachowaniem uników Niny.
- Dopasowanie tempa i wychylenia istniejącego klinczu; istniejące przewrócenie po odepchnięciu. Krótkie zwolnienie KO respektujące ograniczenie ruchu.

## Weryfikacja
- 2880 przypadków nacisku/odrzutu, 912 kontaktów, 38 chybień, 12 powrotów z upadku.
- 144 przypadki energii: tylko czyste trafienia, raz na akcję. Test dostosowany do gardy regionalnej: samo trzymanie gardy górnej nie oznacza zablokowania uderzenia w nogi.
- 576 przypadków parowanego klinczu, 360 kontaktu, 108 zestawień CPU, 72 combo CPU.
- 108 przypadków nowych funkcji, 33 rankingu/profili, 18 ćwiczeń; wejście przez cztery wcześniejsze tryby i intro sześciu zawodników.
- 82 kontrole geometrii nowych reakcji i gardy; maksymalny krok stawu na klatkę poniżej 0,10 m.
- Produkcyjny build zakończony pomyślnie; animacje Float32 zachowują próbki bezstratnie.

## Granice i dalsze prace
Testy logiki działają w środowisku symulującym DOM. Nie wykonano wizualnego testu na iPhonie/Safari ani pełnej oceny grywalności przez człowieka. Potrzebna ocena czytelności instrukcji, odczuć czasu klinczu i tempa Survival na urządzeniu.

Ranking jest lokalny: nie synchronizuje urządzeń, a usunięcie danych przeglądarki usuwa zapis. Gra sieciowa i wspólny ranking wymagają osobnego etapu z serwerem. Nowe rzuty od tyłu i autentyczne dodatkowe techniki judo/jujitsu nie zostały dodane; obecna aktualizacja wykorzystuje istniejące animacje parowane. Kolejny etap: testy urządzeń, następnie dodatkowe animacje i rozgrywka sieciowa.
