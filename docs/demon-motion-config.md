# DEMON — konfiguracja nowych animacji

Wygenerowano wyłącznie nową konfigurację DEMON. Nie zmieniano konfiguracji ani próbek animacji sześciu dotychczasowych zawodników.

Styl: krótki prosty, mocny sierpowy, kopnięcie MMA, obrotowe Hurricane Kick, uderzenie głową, podbródkowy. Combo łączy sierpowy, uderzenie głową i kopnięcie MMA. Brak swobodnego skoku. Kroki, uniki, garda i reakcje korzystają z dostarczonych animacji lub istniejącej paczki.

| Stan | Klip źródłowy | Czas źródłowy (s) | Playback rate | Klatki kontaktu, 60 Hz |
|---|---|---:|---:|---|
| LIGHT_PUNCH | Punching | 0.85 | 1.4 | 18–26 |
| HEAVY_PUNCH | Hook Punch | 2.167 | 1.4 | 64–73 |
| LIGHT_KICK | Mma Kick | 1.583 | 1.35 | 37–46 |
| HEAVY_KICK | Hurricane Kick | 1.833 | 1.35 | 78–88 |
| SHOULDER | Headbutt | 2.1 | 1.4 | 41–50 |
| UPPERCUT | Surprise Uppercut | 1.1 | 1.35 | 23–30 |
| COMBO | Hook Punch | 5.85 | 1.4 | 64–73, 171–180, 294–303 |

Czasy kontaktu wyznaczono skanem rzutu odpowiedniej kończyny co 1/60 s: wyniki w `demon-contact-scan.json`. Hurricane Kick trafia lewą stopą; Headbutt używa kapsuły głowy. HIT_R1–R3, zwycięstwa, szybki odskok, niska garda oraz stany kontaktu mają własne generowane kapsuły DEMON.

Odtworzenie: `node --loader ./scripts/krov-three-loader.mjs scripts/build-demon-config.mjs`.
Wynik: `demon-config-validation.json`; skończone liczby wszystkich prostokątów, kapsuł i punktów kontaktu, obecność kontaktów każdego ataku.

Nie zweryfikowano wizualnie na telefonie ani w przeglądarce płynności retargetingu i przejść. Numeryczna poprawność nie dowodzi braku drżenia. CONTACT_PUSH/RECEIVE korzystają z Blocking/Reaction; nie stosują dopasowania rąk do barków przeciwnika. CONTACT_FALL łączy upadek i wstawanie ze spoiwem 0,2 s, wymagając wizualnego sprawdzenia przejścia.
