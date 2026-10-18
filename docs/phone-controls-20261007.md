# Sterowanie telefonem — wersja testowa

Cztery przyciski w rombie: P1 po lewej, P2 u góry, K1 na dole, K2 po prawej. COMBO osobno nad rombem. Lewa strona: ruch, skok, blok i unik. Bez przycisków naramiennych i bez wymogu dwóch ataków naraz. P1/P2 oznaczają warianty pięści, K1/K2 warianty kopnięć, nie deklarują konkretnej kończyny w istniejących animacjach.

Przód i tył są względne wobec przeciwnika. Kierunek zapamiętywany przy naciśnięciu, także gdy ruch trafia do kolejki. Jedno miejsce w kolejce, bez znikania zaakceptowanego polecenia po 450 ms; kolejkę kasuje przerwanie trafieniem, pauza, utrata fokusu lub koniec rundy. Wszystkie cztery ataki reagują na naciśnięcie. Blok nie chroni podczas ataku i ogłuszenia.

| Zawodnik | Przycisk | Tył | Neutralnie | Przód |
|---|---|---|---|---|
| Brax | P1 | UPPERCUT | LIGHT_PUNCH | DOUBLE_PUNCH |
| Brax | P2 | CLINCH_KNEE | HEAVY_PUNCH | CHAIN_STRIKES |
| Brax | K1 | LIGHT_KICK (prosty kopniak) | CROUCH_KICK | MUAY_THAI_ROUNDHOUSE |
| Brax | K2 | CLINCH_KNEE | HEAVY_KICK | MUAY_THAI_ROUNDHOUSE |
| Nyxa | P1 | HOOK | LIGHT_PUNCH | LUNGE_PUNCH |
| Nyxa | P2 | HOOK | HEAVY_PUNCH | CLINCH_KNEE |
| Nyxa | K1 | TEEP (prosty kopniak) | LIGHT_KICK | CLINCH_KNEE |
| Nyxa | K2 | CROUCH_KICK | LIGHT_KICK | HEAVY_KICK |

Blok + P1: CROUCH_PUNCH; blok + P2: HEAVY_STOMP; blok + kopnięcie: CROUCH_KICK. W powietrzu P1: JUMP_PUNCH. Pozostałe ataki powietrzne nie są dostępne w obecnym materiale.

Klawiatura: A=P1, F=P2, S=K1, G=K2, Q=COMBO, E=unik, D=blok; strzałki lewo/prawo=ruch, góra/spacja=skok.

Weryfikacja: 48 przypisań kierunek/przycisk (oba zwroty, obaj zawodnicy), wykonanie z pointerdown, zachowanie jednego buforowanego ataku do zakończenia animacji, odrzucenie trzeciego polecenia, blok podczas ataku, ogłuszenie i kasowanie kolejki po utracie fokusu. Testy symulacyjne, bez potwierdzenia na fizycznym telefonie. Oryginalne animacje zachowane. Płynny unik Braxa i garda oczekują na nowy materiał.

Inspiracja: oficjalny poradnik Bandai Namco Tekken 8, https://en.bandainamcoent.eu/tekken/news/tekken-8-the-guide-start-playing — cztery podstawowe przyciski ataku. Nasze przypisania dostosowane do dostępnych ruchów.
