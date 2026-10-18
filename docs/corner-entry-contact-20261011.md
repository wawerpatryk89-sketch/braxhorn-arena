# Wejście na arenę, kontakt zawodników i filmy — 11.10.2026

Zakres ostatnich poleceń użytkownika:

- Po doprecyzowaniu użytkownika: powitanie, całe odliczanie i moment FIGHT odbywają się przy przeciwnych bokach. Podejście do środka następuje dopiero w czasie walki. Także kolejna runda, rewanż i reset treningu zaczynają się przy bokach.
- Krov wykonuje na początku oryginalne Jab Cross, Hook Punch i Uppercut zamiast Salsa Dancing. Pozostałe akcje, modele, tekstury i pliki źródłowych klipów nie zostały zmienione.
- Zetknięcie podczas chodzenia nie inicjuje automatycznego chwytu. Mała korekta kolizji w 85% zatrzymuje napierającego, a w 15% przesuwa biernego zawodnika. Chwyty z przycisku, decyzji CPU i przypisanego finishera pozostają obsługiwane.
- Usunięto osobne `object-fit: contain` dla filmu Vexy. Obowiązuje ten sam pełnoekranowy `cover` co u pozostałych postaci. Na szerokim ekranie część pionowego kadru może zostać przycięta — plik filmu nie został rozciągnięty ani przerobiony.

Weryfikacja logiki w obecnym silniku: 72 pary/rozmiary ekranu dla wejścia, kolejnej rundy, rewanżu i pauzy; 72 pary/kierunki kontaktu bez automatycznego chwytu; 144 scenariusze combo; 96 par/ról/kierunków chwytu z ruchem od pierwszej klatki, jednorazowym rzutem, zerwaniem i wstawaniem; 24 pary CPU/gracz z dotykowym zerwaniem i limitem powtarzania chwytu; cztery ścieżki trybów i zakończenie/pominięcie sześciu filmów.

Testy renderera 3D w Safari na fizycznym iPhonie nie zostały wykonane. Symulacja silnika nie zastępuje wizualnej oceny przejść między pozami ani kadru Vexy na urządzeniu.

Dalsze poprawki z 22:18–22:23 CEST:

- Arcade i trening losują planszę po wyborze zawodnika, bez ekranu wyboru areny. Arcade rozpoczyna pierwszą walkę bez dodatkowego potwierdzenia listy rywali; przed kolejną walką losuje inną planszę. Turniej zachowuje pełną drabinkę.
- Portrety w wyniku, HUD, Arcade i drabince są renderami rzeczywistych modeli i tekstur gry. Wyeliminowano stare GIF-y oraz wycinki zbiorczego plakatu. Sześć obrazów sprawdzono wizualnie.
- Jeden CHWYT od razu odtwarza sparowaną animację rzutu. Nie wymaga drugiego naciśnięcia i nie zamraża pierwszej klatki na czas decyzji. W pierwszych 200 ms C/U rozdziela parę. Limit 2000 ms wymusza odepchnięcie, jeśli sekwencja nie zakończy się normalnie.
- Dodatkowo sprawdzono rzeczywisty ruch kości w dziesięciu oryginalnych klipach atakującego/przyjmującego oraz przepływ Arcade i treningu dla wszystkich sześciu zawodników.
