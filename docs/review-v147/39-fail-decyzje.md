# Decyzje dotyczące 39 wcześniejszych FAIL

a: nieaktualny test; b: zestaw wymagający mediów/historii; c: poprawiony błąd gry. Asercje testów mediów pozostały w osobnym zestawie.

| Test | Decyzja | Wynik | Uzasadnienie |
|---|---|---|---|
| audit-access-rtc.mjs | a | PASS | Mock wysyłał nieprawidłowy stan actors={}; poprawiono pełny stan i handshake, zachowano monotoniczność sekwencji. |
| audit-auto-clinch.cjs | a | PASS | Bieżący kontakt po 320 ms naporu używa PUSH/RECEIVE; zachowano brak obrażeń, wyrzutu, krzyżowania oraz proporcję drobnej korekty 85/15. |
| audit-bear.cjs | a | PASS | BEAR jest w slocie 6; poprawiono intro, gardę bez chip damage i KO zależne od HP, bez usuwania testów trafień. |
| audit-brax-recovery.cjs | a | PASS | Bezpośrednio wymuszony rzut CPU wymaga wyzerowania grabCooldown w przygotowaniu scenariusza. |
| audit-clean-kicks.cjs | a | PASS | Dwa kopnięcia nie oznaczają już automatycznego wyrzutu. Sprawdzono trzy mocne akcje, presję lekkich, blok, cooldown i zakaz naliczania wielokrotnego kontaktu jednej akcji. |
| audit-clinch-controls.cjs | a | PASS | Krok RAF 16 ms nie gwarantuje kroku symulacji 16 ms; test przekracza rzeczywisty termin 2000 ms. |
| audit-combo-finisher.cjs | c | PASS | Naprawiono kasowanie serii przez własne odepchnięcie. Test naturalnego naporu wszystkich 8 postaci plus dotychczasowe warunki finishera. |
| audit-compact-gait.mjs | b | FAIL | Test odczytuje klipy i dawny gaitBlend. Zachowana niespełniona asercja; bez zmian animacji. |
| audit-contact-break.cjs | a | PASS | Bieżący kontakt to osobne PUSH/RECEIVE z ograniczonym czasem i zwolnieniem obu postaci; 64 pary, dwa kierunki, środek i krawędź. |
| audit-contact-deadline.cjs | a | PASS | Aktualny próg kontaktu to 320 ms, odejście zeruje licznik; test obu stron i ścian. |
| audit-contact-showcase.cjs | a | PASS | Scena demonstracyjna uruchamiana jawną funkcją, odrębne długości klipów PUSH/RECEIVE i aktualny czas celebracji; wszystkie 8 postaci. |
| audit-contact-stagger.mjs | b | FAIL | Pomiar stopy podporowej wymaga klipów i oceny dawnego kontraktu ruchu; zachowany FAIL, nie zmieniono animacji. |
| audit-corner-entry.cjs | a | PASS | Po zakończeniu filmu wejściowego odczekano faktyczne wejście; uwzględniono pełną celebrację rundy. |
| audit-cpu-levels.cjs | c | PASS | Zmieniono parametry easy/hard oraz wybór ataków. Pomiar 8×3, aktywność, co najmniej 5 ciosów hard i czas KO biernego gracza. |
| audit-danny-strikes.cjs | a | PASS | Przygotowanie kończy film dla każdego slotu i zeruje preFight; asercje rzeczywistych trafień zachowane. |
| audit-fighter-polish.cjs | a | PASS | Czas recovery i COMBO wyliczany z konfiguracji faz zamiast nieaktualnych stałych limitów. |
| audit-fullscreen.cjs | a | PASS | Nieobsługiwana ikona fullscreen jest celowo ukryta; zachowano kliknięcie, swipe i wielodotyk. |
| audit-impact-frequency.cjs | c | PASS | Nowa reguła serii z zachowaniem naporu i identyfikatorem mocnej akcji; 8 postaci, blok i jedna akcja nie produkują fałszywych wyrzutów. |
| audit-krov-new.cjs | a | PASS | Aktualne intro, brak skoku swobodnego, zero chip damage, czas COMBO i KO z HP; zachowane trafienia i finisher. |
| audit-mixamo-showcase.mjs | b | NIEWYKONANE | Wymaga brakującego historycznego obiektu git 5560fb… i mediów. |
| audit-mode-destinations.cjs | a | PASS | Mock ma asynchroniczny best(), jawne otwarcie wyboru wyzwania i czeka na zapis tożsamości oraz przejście ekranu. |
| audit-motion-polish.mjs | b | NIEWYKONANE | Wymaga historycznej konfiguracji z 19ecd… i klipów. |
| audit-mutual-contract.cjs | a | PASS | Aktualne PUSH i RECEIVE są oddzielnymi klipami; dawny contactMotion nie istnieje. Zachowane kontrole akcji i ograniczenia NINY. |
| audit-mutual-fall.mjs | b | FAIL | Stary test klipu zakłada upadek CONTACT_PUSH; zachowany wynik i kod do osobnego przeglądu animacji. |
| audit-natural-contact.cjs | a | PASS | Aktywny CPU może odpowiedzieć ciosem zamiast wejść w kontakt. Nadal sprawdzane przejście kontaktu, brak samowolnego rzutu i obrażeń. |
| audit-new-fighters.cjs | a | PASS | Poprawiona kolejność asynchronicznego startu/wyboru/filmu; test rzeczywistego INTRO i skonfigurowanego tempa. |
| audit-new-strikes.cjs | a | PASS | Pełne zakończenie intro wszystkich slotów, aktualna nazwa UPPERCUT i prawidłowe przygotowanie zasięgu; trafienia nadal wymagane. |
| audit-passive-contact.cjs | a | PASS | Sama bliskość nie uruchamia kontaktu; sprawdzono stan bierny, blok i ochronę stun/push/grabProtection dla 64 par. |
| audit-ranking-api.mjs | a | PASS | Mock D1 musi zwracać meta.changes dla atomowego zajęcia wyniku; zachowano walidacje i granice czasu. |
| audit-short-step.mjs | b | FAIL | Test wymaga nieobecnego starego klipu Retargeted; brak odtwarzania lub podmiany mediów. |
| audit-shoulder-contact.mjs | b | FAIL | Historyczny kontrakt IK ramion odczytuje brakujące metadane; zachowana asercja i FAIL do przeglądu mediów. |
| audit-six-attacks.cjs | a | PASS | Zastąpiono dawną nazwę TEEP rzeczywistą akcją UPPERCUT. |
| audit-six-input.cjs | b | PASS | Wymaga mediów i porównania historycznego; zaktualizowano wejścia wszystkich 8 postaci, 8 akcji NINY, aktualne kontrolki i osiągalny dystans SHOULDER; kontrole hashy zachowane. |
| audit-source-motion.mjs | b | FAIL | Test klipów zgłasza zakres ruchu stopy w gardzie; bez zmian mediów. Czy to błąd obrazu czy nieaktualny próg: nie wiem. |
| audit-sprint-backflip.cjs | a | PASS | Asercja ruchu jest wykonywana, gdy symulacja faktycznie wykonała krok; nie na pustym kroku RAF. |
| audit-training-contact.cjs | a | PASS | Stan bierny treningu nie inicjuje samowolnego kontaktu; kontrola wszystkich 64 par i stanów ochronnych. |
| audit-two-launches.cjs | c | PASS | Naprawiona seria mocnych trafień. Dwa nieśmiertelne wyrzuty nie kończą walki; pełny FLY/LAND/DOWN/GETUP, KO po HP=0, 8 postaci i obie role. |
| audit-vexa.cjs | a | PASS | Aktualne intro, APPROACH, brak swobodnego skoku, garda bez chip damage, czas COMBO i KO z HP. |
| audit-visual-update.cjs | a | PASS | Porównanie aktualnych pięciu statystyk UI z niezależnym przeliczeniem z konfiguracji i aktualna liczba wyzwań. |
