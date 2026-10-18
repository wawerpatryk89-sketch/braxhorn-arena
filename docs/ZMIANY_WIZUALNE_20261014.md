# Krew, ślady walki i interfejs

Zakres: aktualizacja po v114, publikacja zatwierdzona przez użytkownika w rozmowie.

- Wybór postaci: zamiast list technik trzy paski maksymalnych obrażeń pełnego podstawowego ataku pięścią, kopnięcia i combo. Wartości pochodzą z unikalnych grup trafień konfiguracji, skala wspólna 100 HP. Nie oznaczają gwarantowanych obrażeń przy każdym dystansie. Instrukcja zachowuje techniki.
- Wyzwania: numer, rodzaj próby, cel, opis, zapisany status ukończenia dla wybranej postaci i rozpoczęcie/powtórzenie. Karty w siatce, przewijanie na niskich ekranach.
- Postępy: karty postaci z liczbą wygranych, rekordem Survival i pięcioma znacznikami rzeczywistych osiągnięć.
- Instrukcja: mniejszy tekst pomocniczy, oddzielone sekcje, uporządkowana legenda klawiatury.
- CHWYT i COMBO: zerowy padding, centralne wyrównanie obu osi, wspólna typografia bez nadpisywania rozmiaru w każdej klatce.
- Krew: 16 zamiast 12 cząstek dla trafienia 12 HP, zróżnicowane rozmiary, ciemniejsze kolory, dłuższy czas i większy zasięg rozprysku. Limit 96 cząstek zachowany. Wyraźniejsze ślady głowy.
- Trafienia korpusu i nóg zapisują do ośmiu lokalnych śladów na postać. Pozycja wiązana z najbliższą kapsułą trafionego obszaru. Dane są niezależne dla obu stron, kopiowane do replay, zachowywane przy przejściu rund i czyszczone przy nowej walce.

Testy: audit-visual-update, audit-blood-effects, audit-blood-visibility, audit-phone-controls, test:repairs oraz test:audit. Logi w docs/acceptance/visual-*.log.

Ograniczenia: ślady są nakładką 2D zakotwiczoną w obszarach animowanego modelu, nie deformacją skóry ani teksturą UV. Nie mają pełnego zasłaniania przez rękawice, włosy lub ubranie; na ubraniu mogą wyglądać jak plamy. Odtwarzają dyskretne klatki kapsuł. Nie wykonano oceny renderingu przeglądarkowego, nagrania ani testu na fizycznym iPhonie w tym środowisku. Pełny odbiór wizualny oraz wcześniejsze otwarte punkty mastera pozostają niepotwierdzone. Zatwierdzone modele, stroje, ruchy i tekstury bez zmian.
