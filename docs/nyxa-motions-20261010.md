# Nyxa: nowe animacje — 10.10.2026

Źródła: cztery pliki GLB z sufiksem (1), przesłane przez operatora.
Z plików pobrano wyłącznie kanały animacji: istniejąca geometria i tekstury Nyxy pozostają źródłem wyglądu.

Wejście: Proud_Strut, początek 14 punktów procentowych szerokości areny dalej od środka, dojście do pierwotnej pozycji startowej. Obsługa Nyxy po obu stronach i mirror fight. Odliczanie zaczyna się po zakończeniu obu prezentacji.

Sterowanie Nyxy (tył / neutralnie / przód względem przeciwnika):
- pięść: sierp / prosty / seria Punch_Combo_1
- mocna pięść: Dodge_and_Counter / sierp / seria Punch_Combo_1
- noga: kopnięcie z obrotem / Roundhouse_Kick / kopnięcie z obrotem
- druga noga: nowe Sweeping_Kick / High_Kick / nowe Sweeping_Kick
- unik: nowy Step_Back
- kucnięcie + pięść lub mocna pięść: CROUCH_PUNCH

Dodge_and_Counter odtwarzane w tempie 2.8, bez skracania kanałów. Pozostałe ataki zachowują dotychczasowe przyspieszenie 1.45. Hitboxy wyliczane z kości dłoni/stóp, serie pięści otrzymują kilka grup trafień.

Weryfikacja: rzeczywisty GLTFLoader i AnimationMixer, wszystkie kanały powiązane z kośćmi istniejącego modelu; 8 przypisanych ataków z poprawnymi liczbowo hitboxami. Test silnika z konfiguracją wygenerowaną z GLB: 24 kombinacje kierunek/przycisk dla obu postaci, zakończenie nowych akcji, kolejka wejścia, reakcja na trafienie, blok, wejście Nyxy z boku i odliczanie PASS.

Ograniczenie: brak wizualnego odbioru WebGL w przeglądarce. Nie potwierdzono dokładnej techniki wszystkich ruchów ani wizualnej płynności. Dostępne klipy Meshy nie realizują wszystkich N01–N06 z mastera 1:1; alternatywne ruchy zgodnie z bieżącym poleceniem operatora. Nie przedstawiać tego jako pełnego wdrożenia mastera.
