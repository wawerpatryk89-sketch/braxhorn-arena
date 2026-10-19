/* Combat presentation only. Action IDs, network tokens and source configs remain canonical. */
(()=>{
'use strict';
const entries={
 "common.you": {
  "pl": "TY",
  "en": "YOU"
 },
 "common.player": {
  "pl": "GRACZ",
  "en": "PLAYER"
 },
 "common.next": {
  "pl": "DALEJ →",
  "en": "CONTINUE →"
 },
 "callout.fight": {
  "pl": "FIGHT",
  "en": "FIGHT"
 },
 "callout.draw": {
  "pl": "REMIS",
  "en": "DRAW"
 },
 "callout.pause": {
  "pl": "PAUZA",
  "en": "PAUSED"
 },
 "callout.restoringGraphics": {
  "pl": "PRZYWRACANIE OBRAZU…",
  "en": "RESTORING GRAPHICS…"
 },
 "callout.graphicsReady": {
  "pl": "OBRAZ GOTOWY — WZNÓW GRĘ",
  "en": "GRAPHICS READY — RESUME THE FIGHT"
 },
 "hud.round": {
  "pl": "RUNDA {round}/{total}",
  "en": "ROUND {round}/{total}"
 },
 "hud.training": {
  "pl": "TRENING",
  "en": "TRAINING"
 },
 "hud.comboReady": {
  "pl": "COMBO GOTOWE",
  "en": "COMBO READY"
 },
 "hud.comboCharge": {
  "pl": "COMBO {percent}%",
  "en": "COMBO {percent}%"
 },
 "hud.comboUses": {
  "pl": "{charge} · {used}/{limit}",
  "en": "{charge} · {used}/{limit}"
 },
 "hud.hits": {
  "pl": "TRAFIENIA {count}",
  "en": "{count} HITS"
 },
 "controls.grab": {
  "pl": "CHWYT",
  "en": "GRAB"
 },
 "controls.release": {
  "pl": "PUŚĆ",
  "en": "RELEASE"
 },
 "controls.break": {
  "pl": "ZERWIJ",
  "en": "BREAK FREE"
 },
 "controls.breakHint": {
  "pl": "C lub U: zerwij w początkowym oknie",
  "en": "C or U: break free during the opening window"
 },
 "controls.grabHint": {
  "pl": "CHWYT: rzut z bliska",
  "en": "GRAB: throw at close range"
 },
 "controls.comboLimit": {
  "pl": "Limit dwóch combo wykorzystany",
  "en": "Both combos used this round"
 },
 "controls.comboReady": {
  "pl": "Combo gotowe",
  "en": "Combo ready"
 },
 "controls.comboCharging": {
  "pl": "Combo ładuje się",
  "en": "Combo charging"
 },
 "controls.evade": {
  "pl": "Unik",
  "en": "Evade"
 },
 "controls.block": {
  "pl": "Blok",
  "en": "Guard"
 },
 "controls.punch": {
  "pl": "Pięść {index}",
  "en": "Punch {index}"
 },
 "controls.kick": {
  "pl": "Kopnięcie {index}",
  "en": "Kick {index}"
 },
 "controls.moveRight": {
  "pl": "Ruch w prawo; dwa dotknięcia — bieg",
  "en": "Move right; double-tap to run"
 },
 "controls.moveLeft": {
  "pl": "Ruch w lewo; dwa dotknięcia — bieg",
  "en": "Move left; double-tap to run"
 },
 "controls.grabBreak": {
  "pl": "Chwyt / zerwanie klinczu",
  "en": "Grab / break free from a clinch"
 },
 "status.noThrowPair": {
  "pl": "BRAK DOPASOWANEJ PARY CHWYTU",
  "en": "NO COMPATIBLE THROW PAIR"
 },
 "status.throwOutOfRange": {
  "pl": "POZA ZASIĘGIEM CHWYTU",
  "en": "OUT OF GRAB RANGE"
 },
 "status.clinchOutOfRange": {
  "pl": "POZA ZASIĘGIEM KLINCZU",
  "en": "OUT OF CLINCH RANGE"
 },
 "result.draw": {
  "pl": "REMIS",
  "en": "DRAW"
 },
 "result.closeFight": {
  "pl": "WYRÓWNANA WALKA",
  "en": "AN EVEN MATCH"
 },
 "result.youWin": {
  "pl": "WYGRYWASZ",
  "en": "YOU WIN"
 },
 "result.opponentWins": {
  "pl": "WYGRYWA PRZECIWNIK",
  "en": "OPPONENT WINS"
 },
 "result.winner": {
  "pl": "ZWYCIĘZCA WALKI",
  "en": "MATCH WINNER"
 },
 "result.score": {
  "pl": "WYNIK WALKI",
  "en": "MATCH SCORE"
 },
 "result.rematch": {
  "pl": "REWANŻ",
  "en": "REMATCH"
 },
 "result.roster": {
  "pl": "WYBÓR ZAWODNIKA",
  "en": "CHOOSE FIGHTER"
 },
 "replay.knockout": {
  "pl": "Powtórka nokautu",
  "en": "Knockout replay"
 },
 "replay.decisiveBlow": {
  "pl": "DECYDUJĄCY CIOS",
  "en": "THE DECISIVE BLOW"
 },
 "replay.skip": {
  "pl": "POMIŃ →",
  "en": "SKIP →"
 },
 "film.menu": {
  "pl": "‹ WYJDŹ DO MENU",
  "en": "‹ RETURN TO MENU"
 },
 "film.skip": {
  "pl": "Pomiń film",
  "en": "Skip video"
 },
 "film.skipVictory": {
  "pl": "Pomiń film zwycięzcy",
  "en": "Skip victory video"
 },
 "film.play": {
  "pl": "Odtwórz film",
  "en": "Play video"
 },
 "loading.preparingFight": {
  "pl": "PRZYGOTOWANIE WALKI…",
  "en": "PREPARING THE FIGHT…"
 },
 "loading.arena": {
  "pl": "ŁADOWANIE ARENY",
  "en": "LOADING ARENA"
 },
 "loading.downloadingArena": {
  "pl": "Pobieranie areny",
  "en": "Downloading arena"
 },
 "errors.filmPlay": {
  "pl": "Nie udało się odtworzyć filmu. Spróbuj ponownie lub pomiń.",
  "en": "The video could not be played. Try again or skip it."
 },
 "errors.filmLoad": {
  "pl": "Nie udało się wczytać filmu. Spróbuj ponownie lub pomiń.",
  "en": "The video could not be loaded. Try again or skip it."
 },
 "errors.arenaLoad": {
  "pl": "Nie udało się pobrać areny. Sprawdź połączenie i spróbuj ponownie. Twój wybór pozostaje zapisany.",
  "en": "The arena could not be downloaded. Check your connection and try again. Your selection has been saved."
 },
 "errors.fighterLoad": {
  "pl": "Nie udało się pobrać zawodnika. Sprawdź połączenie i spróbuj ponownie. Twój wybór pozostaje zapisany.",
  "en": "The fighter could not be downloaded. Check your connection and try again. Your selection has been saved."
 },
 "errors.webgl": {
  "pl": "Nie udało się uruchomić grafiki 3D. Zamknij inne karty i uruchom grę ponownie w przeglądarce z obsługą WebGL. Twój wybór pozostaje zapisany.",
  "en": "3D graphics could not start. Close other tabs and reopen the game in a browser that supports WebGL. Your selection has been saved."
 },
 "errors.fightLoad": {
  "pl": "Nie udało się wczytać walki. Spróbuj ponownie.",
  "en": "The fight could not be loaded. Please try again."
 },
 "errors.connectionRetry": {
  "pl": "Brak połączenia. Spróbuj ponownie.",
  "en": "No connection. Please try again."
 },
 "pause.title": {
  "pl": "CHWILA ODDECHU",
  "en": "TAKE A BREATHER"
 },
 "pause.message": {
  "pl": "Walka jest wstrzymana.",
  "en": "The fight is paused."
 },
 "pause.resume": {
  "pl": "WRÓĆ DO WALKI →",
  "en": "RESUME FIGHT →"
 },
 "pause.back": {
  "pl": "WRÓĆ DO PAUZY →",
  "en": "BACK TO PAUSE →"
 },
 "pause.controls": {
  "pl": "STEROWANIE",
  "en": "CONTROLS"
 },
 "pause.fullscreen": {
  "pl": "PEŁNY EKRAN",
  "en": "FULL SCREEN"
 },
 "pause.menu": {
  "pl": "WYJDŹ DO MENU",
  "en": "RETURN TO MENU"
 },
 "settings.soundEnable": {
  "pl": "Włącz dźwięk",
  "en": "Enable sound"
 },
 "settings.soundMute": {
  "pl": "Wycisz dźwięk",
  "en": "Mute sound"
 },
 "settings.arenaEffects": {
  "pl": "Efekty areny",
  "en": "Arena effects"
 },
 "settings.effectsHigh": {
  "pl": "Wysokie",
  "en": "High"
 },
 "settings.effectsLow": {
  "pl": "Niskie",
  "en": "Low"
 },
 "settings.effectsOff": {
  "pl": "Wyłączone",
  "en": "Off"
 },
 "roster.confirm": {
  "pl": "Zatwierdź zawodnika i przeciwnika",
  "en": "Confirm fighter and opponent"
 },
 "controls.forward": {
  "pl": "PRZÓD",
  "en": "FORWARD"
 },
 "controls.down": {
  "pl": "DÓŁ",
  "en": "DOWN"
 },
 "controls.move": {
  "pl": "RUCH",
  "en": "MOVE"
 },
 "controls.defense": {
  "pl": "OBRONA",
  "en": "DEFENSE"
 },
 "controls.attacks": {
  "pl": "ATAKI",
  "en": "ATTACKS"
 },
 "controls.kicks": {
  "pl": "KOPNIĘCIA",
  "en": "KICKS"
 },
 "controls.guard": {
  "pl": "GARDA",
  "en": "GUARD"
 },
 "controls.touch": {
  "pl": "DOTYK",
  "en": "TOUCH"
 },
 "controls.moves": {
  "pl": "CIOSY",
  "en": "MOVES"
 },
 "controls.keyboard": {
  "pl": "KLAWIATURA",
  "en": "KEYBOARD"
 },
 "controls.comboGrab": {
  "pl": "COMBO I CHWYT",
  "en": "COMBO AND GRAB"
 },
 "controls.forwardAttack": {
  "pl": "PRZÓD + ATAK · DODATKOWY CIOS",
  "en": "FORWARD + ATTACK · EXTRA MOVE"
 },
 "controls.comboRule": {
  "pl": "COMBO · PEŁNA ENERGIA · 2× NA RUNDĘ",
  "en": "COMBO · FULL ENERGY · 2× PER ROUND"
 },
 "guide.title": {
  "pl": "{fighter} · STEROWANIE",
  "en": "{fighter} · CONTROLS"
 },
 "guide.yourFighter": {
  "pl": "TWÓJ ZAWODNIK",
  "en": "YOUR FIGHTER"
 },
 "guide.beforeBell": {
  "pl": "PRZED PIERWSZYM GONGIEM",
  "en": "BEFORE THE FIRST BELL"
 },
 "guide.controlType": {
  "pl": "Rodzaj sterowania",
  "en": "Control type"
 },
 "guide.touchTitle": {
  "pl": "STEROWANIE DOTYKOWE",
  "en": "TOUCH CONTROLS"
 },
 "guide.tagline": {
  "pl": "POZNAJ RUCHY. ZNAJDŹ SWÓJ RYTM.",
  "en": "LEARN THE MOVES. FIND YOUR RHYTHM."
 },
 "guide.start": {
  "pl": "ROZPOCZNIJ WALKĘ →",
  "en": "START FIGHT →"
 },
 "guide.forwardExplanation": {
  "pl": "PRZÓD oznacza kierunek do rywala. Przytrzymaj go razem z przyciskiem ataku, aby wykonać dodatkowy cios.",
  "en": "FORWARD means toward your opponent. Hold it while attacking to perform an extra move."
 },
 "guide.ninaDefense": {
  "pl": "U: unik. Dwa dotknięcia od rywala: obrót w tył. Bez gardy i rzutu.",
  "en": "U: evade. Double-tap away from your opponent to spin back. No guard or throw."
 },
 "guide.defense": {
  "pl": "U: unik · przytrzymaj tarczę: garda wysoka · gest w dół: garda niska.",
  "en": "U: evade · hold the shield: high guard · swipe down: low guard."
 },
 "guide.combo": {
  "pl": "COMBO: {move}. Pełna energia, 2× na rundę. Ostatni czysty cios wyrzuca i powala (krótkie zwolnienie). Seria mocnych trafień też wyrzuca; blok ją przerywa.",
  "en": "COMBO: {move}. Requires full energy, twice per round. The final clean hit launches and knocks down your opponent in brief slow motion. Strong hit strings also launch; blocking interrupts them."
 },
 "guide.throw": {
  "pl": "CHWYT: rzut z bliska. Zerwanie: U lub CHWYT w pierwszych 0,2 s.",
  "en": "GRAB: throw at close range. Escape with U or GRAB within the first 0.2 seconds."
 },
 "guide.noThrow": {
  "pl": "Bez rzutu; U lub CHWYT zrywa chwyt rywala w pierwszych 0,2 s.",
  "en": "No throw; U or GRAB breaks your opponent’s grab within the first 0.2 seconds."
 },
 "guide.movement": {
  "pl": "◀ ▶: ruch. Dwa naciśnięcia do rywala: bieg; podczas biegu atak zachowuje rozpęd. Dwa naciśnięcia od rywala: {backMove}. U: osobny unik. PRZÓD + atak: dodatkowy cios.",
  "en": "◀ ▶: move. Double-tap toward your opponent to run; attacks keep your running momentum. Double-tap away: {backMove}. U: evade. FORWARD + attack: extra move."
 },
 "guide.acrobatic": {
  "pl": "DÓŁ + P2: {move}.",
  "en": "DOWN + P2: {move}."
 },
 "guide.keyboardNinaDefense": {
  "pl": "D: unik",
  "en": "D: evade"
 },
 "guide.keyboardDefense": {
  "pl": "D: garda wysoka · D + ↓: garda niska",
  "en": "D: high guard · D + ↓: low guard"
 },
 "guide.survival": {
  "pl": "SURVIVAL: jedna runda, zachowujesz zdrowie; +20 po wygranej.",
  "en": "SURVIVAL: one round per opponent; keep your health and recover 20 after a win."
 },
 "fighterStyle.brax": {
  "pl": "BOKS · KICKBOXING",
  "en": "BOXING · KICKBOXING"
 },
 "fighterStyle.nyxa": {
  "pl": "TECHNICZNE MUAY THAI",
  "en": "TECHNICAL MUAY THAI"
 },
 "fighterStyle.vexa": {
  "pl": "TAEKWONDO · KICKBOXING",
  "en": "TAEKWONDO · KICKBOXING"
 },
 "fighterStyle.krov": {
  "pl": "MUAY THAI",
  "en": "MUAY THAI"
 },
 "fighterStyle.nina": {
  "pl": "CAPOEIRA",
  "en": "CAPOEIRA"
 },
 "fighterStyle.danny": {
  "pl": "KICKBOXING",
  "en": "KICKBOXING"
 },
 "fighterStyle.bear": {
  "pl": "SIŁA · WALKA W ZWARCIU",
  "en": "POWER · CLOSE COMBAT"
 },
 "fighterStyle.demon": {
  "pl": "AKROBATYKA · KOPNIĘCIA",
  "en": "ACROBATICS · KICKS"
 },
 "campaign.tournament": {
  "pl": "TURNIEJ",
  "en": "TOURNAMENT"
 },
 "campaign.fight": {
  "pl": "WALKA 1 VS 1",
  "en": "1 VS 1 FIGHT"
 },
 "campaign.finished": {
  "pl": "KONIEC",
  "en": "FINISHED"
 },
 "campaign.champion": {
  "pl": "MISTRZ: {fighter}",
  "en": "CHAMPION: {fighter}"
 },
 "campaign.winner": {
  "pl": "ZWYCIĘZCA: {fighter}",
  "en": "WINNER: {fighter}"
 },
 "campaign.tryAgain": {
  "pl": "SPRÓBUJ PONOWNIE",
  "en": "TRY AGAIN"
 },
 "campaign.matchCount": {
  "pl": "WALKA {current} / {total}",
  "en": "FIGHT {current} / {total}"
 },
 "campaign.defeated": {
  "pl": "✓ POKONANY",
  "en": "✓ DEFEATED"
 },
 "campaign.loss": {
  "pl": "✕ PRZEGRANA",
  "en": "✕ DEFEAT"
 },
 "campaign.nextFight": {
  "pl": "NASTĘPNA WALKA",
  "en": "NEXT FIGHT"
 },
 "campaign.ahead": {
  "pl": "PRZED TOBĄ",
  "en": "UP AHEAD"
 },
 "campaign.cpuSimulated": {
  "pl": "Walki między zawodnikami CPU są symulowane.",
  "en": "Fights between CPU fighters are simulated."
 },
 "campaign.arcadeGoal": {
  "pl": "Pokonaj siedmiu różnych przeciwników.",
  "en": "Defeat seven different opponents."
 },
 "campaign.restart": {
  "pl": "ZAGRAJ OD NOWA",
  "en": "PLAY AGAIN"
 },
 "campaign.fightButton": {
  "pl": "WALCZ →",
  "en": "FIGHT →"
 },
 "campaign.bracket": {
  "pl": "DRABINKA →",
  "en": "BRACKET →"
 },
 "campaign.summary": {
  "pl": "PODSUMOWANIE →",
  "en": "SUMMARY →"
 },
 "campaign.arcadeComplete": {
  "pl": "ARCADE UKOŃCZONE",
  "en": "ARCADE COMPLETE"
 },
 "campaign.tournamentChampion": {
  "pl": "MISTRZ TURNIEJU",
  "en": "TOURNAMENT CHAMPION"
 },
 "campaign.arcadeChampion": {
  "pl": "MISTRZ ARCADE",
  "en": "ARCADE CHAMPION"
 },
 "survival.scoreRecord": {
  "pl": "ZWYCIĘSTWA: {score} · REKORD: {record}",
  "en": "WINS: {score} · BEST: {record}"
 },
 "survival.opponentsDefeated": {
  "pl": "POKONANYCH RYWALI",
  "en": "OPPONENTS DEFEATED"
 },
 "survival.runEnded": {
  "pl": "Seria zakończona. Spróbuj pobić swój rekord.",
  "en": "Your run is over. Try to beat your best."
 },
 "survival.nextHealth": {
  "pl": "ZDROWIE NA KOLEJNĄ WALKĘ: {health}/100",
  "en": "HEALTH FOR NEXT FIGHT: {health}/100"
 },
 "survival.rules": {
  "pl": "Jedna runda na rywala. Po wygranej odzyskujesz 20 zdrowia. Przegrana kończy serię.",
  "en": "One round per opponent. Recover 20 health after a win. A loss ends your run."
 },
 "survival.newRun": {
  "pl": "NOWA SERIA",
  "en": "NEW RUN"
 },
 "survival.nextFight": {
  "pl": "KOLEJNA WALKA →",
  "en": "NEXT FIGHT →"
 },
 "survival.result": {
  "pl": "WYNIK SURVIVAL →",
  "en": "SURVIVAL RESULT →"
 },
 "survival.nextOpponent": {
  "pl": "NASTĘPNY RYWAL →",
  "en": "NEXT OPPONENT →"
 },
 "survival.winCount": {
  "pl": "SURVIVAL · ZWYCIĘSTWA {count}",
  "en": "SURVIVAL · WINS {count}"
 },
 "training.description": {
  "pl": "Bez limitu czasu · wybierz zachowanie rywala",
  "en": "No time limit · choose your opponent’s behavior"
 },
 "training.resumeHint": {
  "pl": "Zamknij ten ekran, aby wznowić ćwiczenie.",
  "en": "Close this screen to resume the drill."
 },
 "training.challengeHint": {
  "pl": "Zachowanie rywala wynika z celu wyzwania. Zamknij, aby kontynuować.",
  "en": "Your opponent’s behavior is set by this challenge. Close to continue."
 },
 "training.grabPartner": {
  "pl": "Ćwiczenie chwytu wymaga rywala: BRAX, NYXA, VEXA, KROV, MIŚ lub AZRAK.",
  "en": "Grab drills require one of these opponents: BRAX, NYXA, VEXA, KROV, MIŚ or AZRAK."
 },
 "difficulty.easyDescription": {
  "pl": "Spokojne tempo · więcej czasu na reakcję",
  "en": "A relaxed pace · more time to react"
 },
 "difficulty.normalDescription": {
  "pl": "Zrównoważona walka",
  "en": "A balanced fight"
 },
 "difficulty.hardDescription": {
  "pl": "Szybsze reakcje · częstsza obrona",
  "en": "Faster reactions · stronger defense"
 },
 "challenge.completed": {
  "pl": "✓ UKOŃCZONE",
  "en": "✓ COMPLETE"
 },
 "challenge.completedCount": {
  "pl": "{done} / {total} UKOŃCZONYCH",
  "en": "{done} / {total} COMPLETE"
 },
 "challenge.technicalTitle": {
  "pl": "WYZWANIA TECHNICZNE",
  "en": "TECHNIQUE CHALLENGES"
 },
 "challenge.techniqueDrill": {
  "pl": "TRENING TECHNIKI",
  "en": "TECHNIQUE DRILL"
 },
 "challenge.combatTrial": {
  "pl": "PRÓBA WALKI",
  "en": "COMBAT TRIAL"
 },
 "challenge.goal": {
  "pl": "CEL · {goal}",
  "en": "GOAL · {goal}"
 },
 "challenge.repeat": {
  "pl": "POWTÓRZ",
  "en": "REPEAT"
 },
 "challenge.start": {
  "pl": "ROZPOCZNIJ",
  "en": "START"
 },
 "challenge.repeatButton": {
  "pl": "POWTÓRZ WYZWANIE →",
  "en": "REPEAT CHALLENGE →"
 },
 "challenge.chooseFighter": {
  "pl": "WYBIERZ ZAWODNIKA →",
  "en": "CHOOSE FIGHTER →"
 },
 "challenge.available": {
  "pl": "DO ZDOBYCIA · {fighter}",
  "en": "NOT YET EARNED · {fighter}"
 },
 "challenge.guardRequired": {
  "pl": "TO WYZWANIE WYMAGA GARDY · WYBIERZ INNEGO ZAWODNIKA",
  "en": "THIS CHALLENGE REQUIRES A GUARD · CHOOSE ANOTHER FIGHTER"
 },
 "challengeCategory.defense": {
  "pl": "OBRONA I REAKCJA",
  "en": "DEFENSE AND REACTION"
 },
 "challengeCategory.attack": {
  "pl": "ATAK I DYSTANS",
  "en": "ATTACK AND RANGE"
 },
 "challengeCategory.wins": {
  "pl": "PRÓBY WALKI",
  "en": "COMBAT TRIALS"
 },
 "challengeCategory.survival": {
  "pl": "SURVIVAL",
  "en": "SURVIVAL"
 },
 "leaderboard.world": {
  "pl": "RANKING ŚWIATOWY",
  "en": "WORLD LEADERBOARD"
 },
 "leaderboard.loading": {
  "pl": "Pobieranie rankingu…",
  "en": "Loading leaderboard…"
 },
 "leaderboard.firstRecord": {
  "pl": "Pierwszy rekord w tej kategorii czeka na Ciebie.",
  "en": "Set the first record in this category."
 },
 "leaderboard.name": {
  "pl": "Imię / pseudonim",
  "en": "Nickname"
 },
 "leaderboard.fighter": {
  "pl": "Postać",
  "en": "Fighter"
 },
 "leaderboard.result": {
  "pl": "Wynik",
  "en": "Score"
 },
 "leaderboard.time": {
  "pl": "Czas",
  "en": "Time"
 },
 "leaderboard.empty": {
  "pl": "Brak zapisanych wyników w tej kategorii. Rozegraj pierwszą serię.",
  "en": "No scores in this category yet. Play your first run."
 },
 "leaderboard.localNote": {
  "pl": "TOP 5 na tym urządzeniu · {name}.",
  "en": "TOP 5 on this device · {name}."
 },
 "leaderboard.tournamentOrder": {
  "pl": "Najpierw tytuł, potem wygrane i średni czas walki.",
  "en": "Titles first, then wins and average fight time."
 },
 "leaderboard.challengeOrder": {
  "pl": "Wygrywa krótszy czas ukończenia.",
  "en": "The fastest completion time wins."
 },
 "leaderboard.standardOrder": {
  "pl": "Najpierw wynik, przy remisie krótszy czas.",
  "en": "Highest score first; ties are decided by time."
 },
 "records.savedNotice": {
  "pl": "Wyniki online są wspólne dla wszystkich graczy. Osiągnięcia nie zwiększają siły postaci.",
  "en": "Online leaderboards are shared by all players. Achievements do not increase a fighter’s power."
 },
 "records.unavailableNotice": {
  "pl": "Zapis jest niedostępny. Wyniki pozostaną tylko do zamknięcia gry.",
  "en": "Saving is unavailable. Scores will be kept only until you close the game."
 },
 "records.survivalBest": {
  "pl": "REKORD SURVIVAL",
  "en": "SURVIVAL BEST"
 },
 "bracket.firstRound": {
  "pl": "PIERWSZA RUNDA",
  "en": "FIRST ROUND"
 },
 "bracket.quarterfinals": {
  "pl": "ĆWIERĆFINAŁY",
  "en": "QUARTERFINALS"
 },
 "bracket.semifinals": {
  "pl": "PÓŁFINAŁY",
  "en": "SEMIFINALS"
 },
 "bracket.final": {
  "pl": "FINAŁ",
  "en": "FINAL"
 },
 "bracket.semifinal": {
  "pl": "PÓŁFINAŁ {number}",
  "en": "SEMIFINAL {number}"
 },
 "bracket.pair": {
  "pl": "PARA {number}",
  "en": "MATCH {number}"
 },
 "bracket.pairWinner": {
  "pl": "ZWYCIĘZCA PARY {number}",
  "en": "WINNER OF MATCH {number}"
 },
 "bracket.quarterfinalWinner": {
  "pl": "Zwycięzca QF {number}",
  "en": "QF {number} winner"
 },
 "bracket.semifinalWinner": {
  "pl": "Zwycięzca SF {number}",
  "en": "SF {number} winner"
 },
 "bracket.current": {
  "pl": "TERAZ · {label}",
  "en": "NOW · {label}"
 },
 "bracket.bye": {
  "pl": "WOLNY LOS: {first} · {second}",
  "en": "BYE: {first} · {second}"
 },
 "bracket.championshipFight": {
  "pl": "WALKA O MISTRZOSTWO",
  "en": "CHAMPIONSHIP FIGHT"
 },
 "bracket.champion": {
  "pl": "MISTRZ · {fighter}",
  "en": "CHAMPION · {fighter}"
 },
 "bracket.oneChampion": {
  "pl": "JEDEN MISTRZ",
  "en": "ONE CHAMPION"
 },
 "bracket.finished": {
  "pl": "TURNIEJ ZAKOŃCZONY",
  "en": "TOURNAMENT COMPLETE"
 },
 "bracket.titlePath": {
  "pl": "DROGA DO TYTUŁU",
  "en": "ROAD TO THE TITLE"
 },
 "bracket.sixTitle": {
  "pl": "Pełna drabinka turnieju sześciu zawodników",
  "en": "Complete six-fighter tournament bracket"
 },
 "bracket.sixDescription": {
  "pl": "Dwie pary pierwszej rundy. Dwóch zawodników z wolnym losem w półfinałach. Linie prowadzą do finału. TY oznacza Twoją postać.",
  "en": "Two first-round matches. Two fighters have byes into the semifinals. Lines lead to the final. YOU marks your fighter."
 },
 "bracket.eightTitle": {
  "pl": "Turniej ośmiu zawodników",
  "en": "Eight-fighter tournament"
 },
 "bracket.eightDescription": {
  "pl": "Ćwierćfinały, półfinały i finał. Połączenia wskazują awans zwycięzców. TY oznacza Twojego zawodnika.",
  "en": "Quarterfinals, semifinals and final. Connections show the winners’ progress. YOU marks your fighter."
 },
 "moves.bodyJabCross": {
  "pl": "Proste na korpus",
  "en": "Body jab–cross"
 },
 "moves.jabCross": {
  "pl": "Jab–cross",
  "en": "Jab–cross"
 },
 "moves.jab": {
  "pl": "Jab",
  "en": "Jab"
 },
 "moves.hook": {
  "pl": "Sierpowy",
  "en": "Hook"
 },
 "moves.punch": {
  "pl": "Cios pięścią",
  "en": "Punch"
 },
 "moves.boxingPunch": {
  "pl": "Cios bokserski",
  "en": "Boxing punch"
 },
 "moves.boxingString": {
  "pl": "Seria bokserska",
  "en": "Boxing string"
 },
 "moves.twoStraights": {
  "pl": "Dwa proste",
  "en": "Two straight punches"
 },
 "moves.mmaKick": {
  "pl": "Kopnięcie MMA",
  "en": "MMA kick"
 },
 "moves.heavyMmaKick": {
  "pl": "Mocne kopnięcie MMA",
  "en": "Heavy MMA kick"
 },
 "moves.heavyKick": {
  "pl": "Mocne kopnięcie",
  "en": "Heavy kick"
 },
 "moves.frontKick": {
  "pl": "Kopnięcie frontalne",
  "en": "Front kick"
 },
 "moves.elbow": {
  "pl": "Łokieć",
  "en": "Elbow"
 },
 "moves.knee": {
  "pl": "Kolano",
  "en": "Knee"
 },
 "moves.uppercut": {
  "pl": "Podbródkowy",
  "en": "Uppercut"
 },
 "moves.sideKick": {
  "pl": "Kopnięcie boczne",
  "en": "Side kick"
 },
 "moves.roundhouseKick": {
  "pl": "Kopnięcie okrężne",
  "en": "Roundhouse kick"
 },
 "moves.flyingKick": {
  "pl": "Kopnięcie z wyskoku",
  "en": "Flying kick"
 },
 "moves.groundMartelo": {
  "pl": "Martelo z ziemi",
  "en": "Ground martelo"
 },
 "moves.uppercutJab": {
  "pl": "Podbródkowy + jab",
  "en": "Uppercut + jab"
 },
 "moves.punchElbowString": {
  "pl": "Pięści + łokcie",
  "en": "Punches + elbows"
 },
 "moves.elbowUppercut": {
  "pl": "Łokieć + podbródkowy",
  "en": "Elbow + uppercut"
 },
 "moves.elbows": {
  "pl": "Łokcie",
  "en": "Elbows"
 },
 "moves.capoeiraString": {
  "pl": "Seria capoeiry",
  "en": "Capoeira string"
 },
 "results.winCount": {
  "pl": {
   "one": "{count} zwycięstwo",
   "few": "{count} zwycięstwa",
   "many": "{count} zwycięstw",
   "other": "{count} zwycięstwa"
  },
  "en": {
   "one": "{count} win",
   "other": "{count} wins"
  }
 },
 "hud.hitCount": {
  "pl": {
   "one": "{count} TRAFIENIE",
   "few": "{count} TRAFIENIA",
   "many": "{count} TRAFIEŃ",
   "other": "{count} TRAFIENIA"
  },
  "en": {
   "one": "{count} HIT",
   "other": "{count} HITS"
  }
 },
 "records.challengeCount": {
  "pl": {
   "one": "{count} WYZWANIE",
   "few": "{count} WYZWANIA",
   "many": "{count} WYZWAŃ",
   "other": "{count} WYZWANIA"
  },
  "en": {
   "one": "{count} CHALLENGE",
   "other": "{count} CHALLENGES"
  }
 },
 "controls.forwardAttackLabel": {
  "pl": "przód + {button}: {move}",
  "en": "forward + {button}: {move}"
 },
 "controls.grabThrowBreak": {
  "pl": "Chwyt / rzut / zerwanie",
  "en": "Grab / throw / break free"
 },
 "controls.breakOpponentGrab": {
  "pl": "Zerwij chwyt przeciwnika",
  "en": "Break your opponent’s grab"
 },
 "controls.comboMove": {
  "pl": "COMBO: {move}",
  "en": "COMBO: {move}"
 },
 "errors.fighterSelection": {
  "pl": "Nie udało się wczytać zawodnika. Wybierz arenę ponownie.",
  "en": "The fighter could not be loaded. Choose the arena again."
 },
 "result.opponentWinsShort": {
  "pl": "WYGRYWA RYWAL",
  "en": "OPPONENT WINS"
 },
 "result.wins": {
  "pl": "{fighter} WYGRYWA",
  "en": "{fighter} WINS"
 },
 "result.rematchAgain": {
  "pl": "REWANŻ ↻",
  "en": "REMATCH ↻"
 },
 "guide.controlsAlt": {
  "pl": "{fighter} — układ sterowania. U: unik; strzałki: ruch. P2 u góry, P1 po lewej, K2 po prawej, K1 na dole, COMBO pośrodku.",
  "en": "{fighter} — control layout. U: evade; arrows: move. P2 at the top, P1 on the left, K2 on the right, K1 below, COMBO in the center."
 },
 "guide.ninaRestrictions": {
  "pl": "Bez gardy i rzutu.",
  "en": "No guard or throw."
 },
 "guide.dannyRestrictions": {
  "pl": "Garda, bez rzutu.",
  "en": "Guard, no throw."
 },
 "guide.fullControls": {
  "pl": "Chwyt i garda po lewej.",
  "en": "Grab and guard on the left."
 },
 "guide.backMove": {
  "pl": "Ruch w tył",
  "en": "Backward move"
 },
 "guide.punches": {
  "pl": "P1 / P2 · ATAKI",
  "en": "P1 / P2 · ATTACKS"
 },
 "guide.kicks": {
  "pl": "K1 / K2 · KOPNIĘCIA",
  "en": "K1 / K2 · KICKS"
 },
 "guide.noGuard": {
  "pl": "BEZ GARDY I RZUTU",
  "en": "NO GUARD OR THROW"
 },
 "guide.noThrowNote": {
  "pl": "GARDA · BEZ RZUTU",
  "en": "GUARD · NO THROW"
 },
 "guide.layoutTitle": {
  "pl": "BRAXHORN · STEROWANIE DOTYKOWE",
  "en": "BRAXHORN · TOUCH CONTROLS"
 },
 "guide.evadeLabel": {
  "pl": "UNIK",
  "en": "EVADE"
 },
 "guide.grabLabel": {
  "pl": "CHWYT",
  "en": "GRAB"
 },
 "guide.guardLabel": {
  "pl": "GARDA",
  "en": "GUARD"
 },
 "guide.moveLabel": {
  "pl": "RUCH",
  "en": "MOVE"
 },
 "guide.comboLabel": {
  "pl": "COMBO",
  "en": "COMBO"
 },
 "guide.comboRule": {
  "pl": "COMBO · PEŁNA ENERGIA · 2× NA RUNDĘ",
  "en": "COMBO · FULL ENERGY · 2× PER ROUND"
 },
 "guide.forwardRule": {
  "pl": "PRZÓD + ATAK · DODATKOWY CIOS",
  "en": "FORWARD + ATTACK · EXTRA MOVE"
 },
 "guide.header": {
  "pl": "STEROWANIE DOTYKOWE",
  "en": "TOUCH CONTROLS"
 },
 "avatar.player": {
  "pl": "Awatar gracza {name}",
  "en": "Player avatar: {name}"
 },
 "challenge.objective": {
  "pl": "{completed}{title} {count}/{goal}",
  "en": "{completed}{title} {count}/{goal}"
 },
 "challenge.completedPrefix": {
  "pl": "✓ UKOŃCZONE · ",
  "en": "✓ COMPLETE · "
 },
 "campaign.semifinal": {
  "pl": "PÓŁFINAŁ",
  "en": "SEMIFINAL"
 },
 "campaign.firstRound": {
  "pl": "RUNDA 1",
  "en": "ROUND 1"
 },
 "campaign.final": {
  "pl": "FINAŁ",
  "en": "FINAL"
 },
 "campaign.endStatus": {
  "pl": "KONIEC · {status}",
  "en": "FINISHED · {status}"
 },
 "campaign.nextMatchup": {
  "pl": "{stage} · {player} VS {opponent}",
  "en": "{stage} · {player} VS {opponent}"
 },
 "campaign.matchup": {
  "pl": "{player} VS {opponent}",
  "en": "{player} VS {opponent}"
 },
 "campaign.survivalTitle": {
  "pl": "SURVIVAL",
  "en": "SURVIVAL"
 },
 "campaign.arcadeTitle": {
  "pl": "ARCADE",
  "en": "ARCADE"
 },
 "training.title": {
  "pl": "TRENING · {fighter}",
  "en": "TRAINING · {fighter}"
 },
 "action.unknown": {
  "pl": "Ruch zawodnika",
  "en": "Fighter move"
 },
 "hud.comboLimit": {
  "pl": "COMBO 2/2",
  "en": "COMBO 2/2"
 },
 "action.DEMON.IDLE": {
  "pl": "Postawa bojowa",
  "en": "Fighting stance"
 },
 "action.DEMON.BLOCK": {
  "pl": "Garda wysoka",
  "en": "High guard"
 },
 "action.DEMON.INTRO": {
  "pl": "Powitanie",
  "en": "Introduction"
 },
 "action.DEMON.WIN": {
  "pl": "Zwycięstwo",
  "en": "Victory"
 },
 "action.DEMON.WALK_FORWARD": {
  "pl": "Krok w przód",
  "en": "Step forward"
 },
 "action.DEMON.WALK_BACK": {
  "pl": "Krok w tył",
  "en": "Step backward"
 },
 "action.DEMON.RUN": {
  "pl": "Bieg",
  "en": "Run"
 },
 "action.DEMON.LEAN": {
  "pl": "Unik",
  "en": "Evade"
 },
 "action.DEMON.LIGHT_PUNCH": {
  "pl": "Jab",
  "en": "Jab"
 },
 "action.DEMON.HEAVY_PUNCH": {
  "pl": "Sierpowy",
  "en": "Hook"
 },
 "action.DEMON.LIGHT_KICK": {
  "pl": "Kopnięcie MMA",
  "en": "MMA kick"
 },
 "action.DEMON.HEAVY_KICK": {
  "pl": "Mocne kopnięcie okrężne",
  "en": "Heavy roundhouse kick"
 },
 "action.DEMON.SHOULDER": {
  "pl": "Uderzenie głową",
  "en": "Headbutt"
 },
 "action.DEMON.UPPERCUT": {
  "pl": "Podbródkowy",
  "en": "Uppercut"
 },
 "action.DEMON.COMBO": {
  "pl": "Huragan z wyskoku",
  "en": "Flying hurricane"
 },
 "action.DEMON.HIT_BODY": {
  "pl": "Trafienie w korpus",
  "en": "Body hit"
 },
 "action.DEMON.HIT_HEAD": {
  "pl": "Trafienie w głowę",
  "en": "Head hit"
 },
 "action.DEMON.HIT_HEAVY": {
  "pl": "Mocne trafienie",
  "en": "Heavy hit"
 },
 "action.DEMON.FALL": {
  "pl": "Upadek",
  "en": "Fall"
 },
 "action.DEMON.LAND": {
  "pl": "Lądowanie",
  "en": "Landing"
 },
 "action.DEMON.DOWN": {
  "pl": "Powalenie",
  "en": "Knockdown"
 },
 "action.DEMON.FLY": {
  "pl": "Wyrzut w powietrze",
  "en": "Launch"
 },
 "action.DEMON.FLY_LAND": {
  "pl": "Upadek po wyrzucie",
  "en": "Landing after launch"
 },
 "action.DEMON.FLY_DOWN": {
  "pl": "Powalenie po wyrzucie",
  "en": "Knockdown after launch"
 },
 "action.DEMON.KO_HOLD": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.DEMON.KO": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.DEMON.GETUP": {
  "pl": "Wstawanie",
  "en": "Getting up"
 },
 "action.DEMON.THROW_ATTACKER": {
  "pl": "Rzut przez ramię",
  "en": "Shoulder throw"
 },
 "action.DEMON.THROW_VICTIM": {
  "pl": "Chwyt rywala",
  "en": "Opponent’s grab"
 },
 "action.DEMON.THROW_DOWN": {
  "pl": "Upadek po rzucie",
  "en": "Throw landing"
 },
 "action.DEMON.CONTACT_PUSH": {
  "pl": "Odepchnięcie",
  "en": "Pushback"
 },
 "action.DEMON.CONTACT_RECEIVE": {
  "pl": "Utrata równowagi",
  "en": "Stagger"
 },
 "action.DEMON.CONTACT_FALL": {
  "pl": "Upadek i wstawanie",
  "en": "Fall and recovery"
 },
 "action.DEMON.APPROACH": {
  "pl": "Podejście",
  "en": "Approach"
 },
 "action.DEMON.BLOCK_LOW": {
  "pl": "Garda niska",
  "en": "Low guard"
 },
 "action.DEMON.QUICK_BACK": {
  "pl": "Szybki krok w tył",
  "en": "Quick step backward"
 },
 "action.DEMON.WIN_ROUND": {
  "pl": "Wygrana runda",
  "en": "Round victory"
 },
 "action.DEMON.WIN_MATCH": {
  "pl": "Wygrana walka",
  "en": "Match victory"
 },
 "action.DEMON.HIT_R1_HEAD": {
  "pl": "Trafienie 1 w głowę",
  "en": "Head hit 1"
 },
 "action.DEMON.HIT_R1_BODY": {
  "pl": "Trafienie 1 w korpus",
  "en": "Body hit 1"
 },
 "action.DEMON.HIT_R2_HEAD": {
  "pl": "Trafienie 2 w głowę",
  "en": "Head hit 2"
 },
 "action.DEMON.HIT_R2_BODY": {
  "pl": "Trafienie 2 w korpus",
  "en": "Body hit 2"
 },
 "action.DEMON.HIT_R3_HEAD": {
  "pl": "Trafienie 3 w głowę",
  "en": "Head hit 3"
 },
 "action.DEMON.HIT_R3_BODY": {
  "pl": "Trafienie 3 w korpus",
  "en": "Body hit 3"
 },
 "action.BEAR.IDLE": {
  "pl": "Postawa bojowa",
  "en": "Fighting stance"
 },
 "action.BEAR.BLOCK": {
  "pl": "Garda wysoka",
  "en": "High guard"
 },
 "action.BEAR.INTRO": {
  "pl": "Powitanie",
  "en": "Introduction"
 },
 "action.BEAR.WIN": {
  "pl": "Zwycięstwo",
  "en": "Victory"
 },
 "action.BEAR.RUN": {
  "pl": "Bieg",
  "en": "Run"
 },
 "action.BEAR.WALK_FORWARD": {
  "pl": "Krok w przód",
  "en": "Step forward"
 },
 "action.BEAR.WALK_BACK": {
  "pl": "Krok w tył",
  "en": "Step backward"
 },
 "action.BEAR.LEAN": {
  "pl": "Unik",
  "en": "Evade"
 },
 "action.BEAR.LIGHT_PUNCH": {
  "pl": "Jab–cross",
  "en": "Jab–cross"
 },
 "action.BEAR.HEAVY_PUNCH": {
  "pl": "Miażdżący cios",
  "en": "Smash"
 },
 "action.BEAR.LIGHT_KICK": {
  "pl": "Bênção",
  "en": "Bênção"
 },
 "action.BEAR.HEAVY_KICK": {
  "pl": "Uderzenie kolanem",
  "en": "Knee jab"
 },
 "action.BEAR.SHOULDER": {
  "pl": "Szarża",
  "en": "Charge"
 },
 "action.BEAR.UPPERCUT": {
  "pl": "Podbródkowy",
  "en": "Uppercut"
 },
 "action.BEAR.COMBO": {
  "pl": "Szarża",
  "en": "Charging combo"
 },
 "action.BEAR.HIT_BODY": {
  "pl": "Trafienie w korpus",
  "en": "Body hit"
 },
 "action.BEAR.HIT_HEAD": {
  "pl": "Trafienie w głowę",
  "en": "Head hit"
 },
 "action.BEAR.HIT_HEAVY": {
  "pl": "Mocne trafienie",
  "en": "Heavy hit"
 },
 "action.BEAR.FALL": {
  "pl": "Upadek",
  "en": "Fall"
 },
 "action.BEAR.LAND": {
  "pl": "Lądowanie",
  "en": "Landing"
 },
 "action.BEAR.DOWN": {
  "pl": "Powalenie",
  "en": "Knockdown"
 },
 "action.BEAR.FLY": {
  "pl": "Wyrzut w powietrze",
  "en": "Launch"
 },
 "action.BEAR.FLY_LAND": {
  "pl": "Upadek po wyrzucie",
  "en": "Landing after launch"
 },
 "action.BEAR.FLY_DOWN": {
  "pl": "Powalenie po wyrzucie",
  "en": "Knockdown after launch"
 },
 "action.BEAR.KO_HOLD": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.BEAR.KO": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.BEAR.GETUP": {
  "pl": "Wstawanie",
  "en": "Getting up"
 },
 "action.BEAR.THROW_ATTACKER": {
  "pl": "Rzut przez ramię",
  "en": "Shoulder throw"
 },
 "action.BEAR.THROW_VICTIM": {
  "pl": "Chwyt rywala",
  "en": "Opponent’s grab"
 },
 "action.BEAR.THROW_DOWN": {
  "pl": "Upadek po rzucie",
  "en": "Throw landing"
 },
 "action.BEAR.APPROACH": {
  "pl": "Podejście",
  "en": "Approach"
 },
 "action.BEAR.WIN_ROUND": {
  "pl": "Wygrana runda",
  "en": "Round victory"
 },
 "action.BEAR.WIN_MATCH": {
  "pl": "Wygrana walka",
  "en": "Match victory"
 },
 "action.BEAR.BLOCK_LOW": {
  "pl": "Garda niska",
  "en": "Low guard"
 },
 "action.BEAR.QUICK_BACK": {
  "pl": "Szybki krok w tył",
  "en": "Quick step backward"
 },
 "action.BEAR.CONTACT_PUSH": {
  "pl": "Odepchnięcie",
  "en": "Pushback"
 },
 "action.BEAR.CONTACT_RECEIVE": {
  "pl": "Utrata równowagi",
  "en": "Stagger"
 },
 "action.BEAR.CONTACT_FALL": {
  "pl": "Upadek i wstawanie",
  "en": "Fall and recovery"
 },
 "action.BEAR.HIT_R1_HEAD": {
  "pl": "Trafienie 1 w głowę",
  "en": "Head hit 1"
 },
 "action.BEAR.HIT_R1_BODY": {
  "pl": "Trafienie 1 w korpus",
  "en": "Body hit 1"
 },
 "action.BEAR.HIT_R2_HEAD": {
  "pl": "Trafienie 2 w głowę",
  "en": "Head hit 2"
 },
 "action.BEAR.HIT_R2_BODY": {
  "pl": "Trafienie 2 w korpus",
  "en": "Body hit 2"
 },
 "action.BEAR.HIT_R3_HEAD": {
  "pl": "Trafienie 3 w głowę",
  "en": "Head hit 3"
 },
 "action.BEAR.HIT_R3_BODY": {
  "pl": "Trafienie 3 w korpus",
  "en": "Body hit 3"
 },
 "action.KROV.IDLE": {
  "pl": "Postawa bojowa",
  "en": "Fighting stance"
 },
 "action.KROV.BLOCK": {
  "pl": "Garda wysoka",
  "en": "High guard"
 },
 "action.KROV.INTRO": {
  "pl": "Powitanie",
  "en": "Introduction"
 },
 "action.KROV.WIN": {
  "pl": "Zwycięstwo",
  "en": "Victory"
 },
 "action.KROV.RUN": {
  "pl": "Bieg",
  "en": "Run"
 },
 "action.KROV.WALK_FORWARD": {
  "pl": "Krok w przód",
  "en": "Step forward"
 },
 "action.KROV.WALK_BACK": {
  "pl": "Krok w tył",
  "en": "Step backward"
 },
 "action.KROV.LEAN": {
  "pl": "Unik",
  "en": "Evade"
 },
 "action.KROV.LIGHT_PUNCH": {
  "pl": "Jab–cross",
  "en": "Jab–cross"
 },
 "action.KROV.HEAVY_PUNCH": {
  "pl": "Sierpowy",
  "en": "Hook"
 },
 "action.KROV.LIGHT_KICK": {
  "pl": "Kopnięcie MMA",
  "en": "MMA kick"
 },
 "action.KROV.HEAVY_KICK": {
  "pl": "Mocne kopnięcie",
  "en": "Heavy kick"
 },
 "action.KROV.ELBOW": {
  "pl": "Łokieć",
  "en": "Elbow"
 },
 "action.KROV.UPPERCUT": {
  "pl": "Podbródkowy",
  "en": "Uppercut"
 },
 "action.KROV.COMBO": {
  "pl": "Proste, łokcie i podbródkowy",
  "en": "Straight punches, elbows and uppercut"
 },
 "action.KROV.HIT_BODY": {
  "pl": "Trafienie w korpus",
  "en": "Body hit"
 },
 "action.KROV.HIT_HEAD": {
  "pl": "Trafienie w głowę",
  "en": "Head hit"
 },
 "action.KROV.HIT_HEAVY": {
  "pl": "Mocne trafienie",
  "en": "Heavy hit"
 },
 "action.KROV.FALL": {
  "pl": "Upadek",
  "en": "Fall"
 },
 "action.KROV.LAND": {
  "pl": "Lądowanie",
  "en": "Landing"
 },
 "action.KROV.DOWN": {
  "pl": "Powalenie",
  "en": "Knockdown"
 },
 "action.KROV.FLY": {
  "pl": "Wyrzut w powietrze",
  "en": "Launch"
 },
 "action.KROV.FLY_LAND": {
  "pl": "Upadek po wyrzucie",
  "en": "Landing after launch"
 },
 "action.KROV.FLY_DOWN": {
  "pl": "Powalenie po wyrzucie",
  "en": "Knockdown after launch"
 },
 "action.KROV.KO_HOLD": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.KROV.KO": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.KROV.GETUP": {
  "pl": "Wstawanie",
  "en": "Getting up"
 },
 "action.KROV.THROW_ATTACKER": {
  "pl": "Rzut przez ramię",
  "en": "Shoulder throw"
 },
 "action.KROV.THROW_VICTIM": {
  "pl": "Chwyt rywala",
  "en": "Opponent’s grab"
 },
 "action.KROV.THROW_DOWN": {
  "pl": "Upadek po rzucie",
  "en": "Throw landing"
 },
 "action.KROV.APPROACH": {
  "pl": "Podejście",
  "en": "Approach"
 },
 "action.KROV.CONTACT_PUSH": {
  "pl": "Odepchnięcie",
  "en": "Pushback"
 },
 "action.KROV.CONTACT_RECEIVE": {
  "pl": "Utrata równowagi",
  "en": "Stagger"
 },
 "action.KROV.WIN_ROUND": {
  "pl": "Wygrana runda",
  "en": "Round victory"
 },
 "action.KROV.WIN_MATCH": {
  "pl": "Wygrana walka",
  "en": "Match victory"
 },
 "action.KROV.CONTACT_FALL": {
  "pl": "Upadek i wstawanie",
  "en": "Fall and recovery"
 },
 "action.KROV.HIT_R1_HEAD": {
  "pl": "Trafienie 1 w głowę",
  "en": "Head hit 1"
 },
 "action.KROV.HIT_R1_BODY": {
  "pl": "Trafienie 1 w korpus",
  "en": "Body hit 1"
 },
 "action.KROV.HIT_R2_HEAD": {
  "pl": "Trafienie 2 w głowę",
  "en": "Head hit 2"
 },
 "action.KROV.HIT_R2_BODY": {
  "pl": "Trafienie 2 w korpus",
  "en": "Body hit 2"
 },
 "action.KROV.HIT_R3_HEAD": {
  "pl": "Trafienie 3 w głowę",
  "en": "Head hit 3"
 },
 "action.KROV.HIT_R3_BODY": {
  "pl": "Trafienie 3 w korpus",
  "en": "Body hit 3"
 },
 "action.KROV.BLOCK_LOW": {
  "pl": "Garda niska",
  "en": "Low guard"
 },
 "action.KROV.QUICK_BACK": {
  "pl": "Krótki odskok w gardzie",
  "en": "Short guarded retreat"
 },
 "action.NINA.IDLE": {
  "pl": "Ginga i automatyczna esquiva",
  "en": "Ginga with automatic esquiva"
 },
 "action.NINA.BLOCK": {
  "pl": "Garda wysoka",
  "en": "High guard"
 },
 "action.NINA.INTRO": {
  "pl": "Powitanie",
  "en": "Introduction"
 },
 "action.NINA.WIN": {
  "pl": "Zwycięstwo",
  "en": "Victory"
 },
 "action.NINA.WALK_FORWARD": {
  "pl": "Krok w przód",
  "en": "Step forward"
 },
 "action.NINA.APPROACH": {
  "pl": "Podejście",
  "en": "Approach"
 },
 "action.NINA.WALK_BACK": {
  "pl": "Krok w tył",
  "en": "Step backward"
 },
 "action.NINA.LEAN": {
  "pl": "Unik",
  "en": "Evade"
 },
 "action.NINA.LIGHT_PUNCH": {
  "pl": "Chapa giratória",
  "en": "Chapa giratória"
 },
 "action.NINA.HEAVY_PUNCH": {
  "pl": "Armada z unikiem",
  "en": "Armada with evasion"
 },
 "action.NINA.LIGHT_KICK": {
  "pl": "Chapa",
  "en": "Chapa"
 },
 "action.NINA.HEAVY_KICK": {
  "pl": "Chapéu de couro",
  "en": "Chapéu de couro"
 },
 "action.NINA.CRESCENT_KICK": {
  "pl": "Rasteira",
  "en": "Rasteira"
 },
 "action.NINA.SPIN_KICK": {
  "pl": "Armada",
  "en": "Armada"
 },
 "action.NINA.COMBO": {
  "pl": "Dwa proste, chapa i armada",
  "en": "Two straights, chapa and armada"
 },
 "action.NINA.HIT_BODY": {
  "pl": "Trafienie w korpus",
  "en": "Body hit"
 },
 "action.NINA.HIT_HEAD": {
  "pl": "Trafienie w głowę",
  "en": "Head hit"
 },
 "action.NINA.HIT_HEAVY": {
  "pl": "Mocne trafienie",
  "en": "Heavy hit"
 },
 "action.NINA.FALL": {
  "pl": "Upadek",
  "en": "Fall"
 },
 "action.NINA.LAND": {
  "pl": "Lądowanie",
  "en": "Landing"
 },
 "action.NINA.DOWN": {
  "pl": "Powalenie",
  "en": "Knockdown"
 },
 "action.NINA.FLY": {
  "pl": "Wyrzut w powietrze",
  "en": "Launch"
 },
 "action.NINA.FLY_LAND": {
  "pl": "Upadek po wyrzucie",
  "en": "Landing after launch"
 },
 "action.NINA.FLY_DOWN": {
  "pl": "Powalenie po wyrzucie",
  "en": "Knockdown after launch"
 },
 "action.NINA.KO_HOLD": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.NINA.KO": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.NINA.GETUP": {
  "pl": "Wstawanie",
  "en": "Getting up"
 },
 "action.NINA.THROW_VICTIM": {
  "pl": "Chwyt rywala",
  "en": "Opponent’s grab"
 },
 "action.NINA.THROW_DOWN": {
  "pl": "Upadek po rzucie",
  "en": "Throw landing"
 },
 "action.NINA.CONTACT_PUSH": {
  "pl": "Odepchnięcie",
  "en": "Pushback"
 },
 "action.NINA.CONTACT_RECEIVE": {
  "pl": "Utrata równowagi",
  "en": "Stagger"
 },
 "action.NINA.WIN_ROUND": {
  "pl": "Wygrana runda",
  "en": "Round victory"
 },
 "action.NINA.WIN_MATCH": {
  "pl": "Wygrana walka",
  "en": "Match victory"
 },
 "action.NINA.RUN": {
  "pl": "Bieg",
  "en": "Run"
 },
 "action.NINA.MEIA_LUA": {
  "pl": "Meia lua",
  "en": "Meia lua"
 },
 "action.NINA.GROUND_KICK": {
  "pl": "Martelo z ziemi",
  "en": "Ground martelo"
 },
 "action.NINA.BACK_ROLL": {
  "pl": "Obrót w tył",
  "en": "Backward roll"
 },
 "action.NINA.CONTACT_FALL": {
  "pl": "Upadek i wstawanie",
  "en": "Fall and recovery"
 },
 "action.NINA.HIT_R1_HEAD": {
  "pl": "Trafienie 1 w głowę",
  "en": "Head hit 1"
 },
 "action.NINA.HIT_R1_BODY": {
  "pl": "Trafienie 1 w korpus",
  "en": "Body hit 1"
 },
 "action.NINA.HIT_R2_HEAD": {
  "pl": "Trafienie 2 w głowę",
  "en": "Head hit 2"
 },
 "action.NINA.HIT_R2_BODY": {
  "pl": "Trafienie 2 w korpus",
  "en": "Body hit 2"
 },
 "action.NINA.HIT_R3_HEAD": {
  "pl": "Trafienie 3 w głowę",
  "en": "Head hit 3"
 },
 "action.NINA.HIT_R3_BODY": {
  "pl": "Trafienie 3 w korpus",
  "en": "Body hit 3"
 },
 "action.DANNY.IDLE": {
  "pl": "Postawa bojowa",
  "en": "Fighting stance"
 },
 "action.DANNY.BLOCK": {
  "pl": "Garda wysoka",
  "en": "High guard"
 },
 "action.DANNY.INTRO": {
  "pl": "Powitanie",
  "en": "Introduction"
 },
 "action.DANNY.WIN": {
  "pl": "Zwycięstwo",
  "en": "Victory"
 },
 "action.DANNY.WALK_FORWARD": {
  "pl": "Krok w przód",
  "en": "Step forward"
 },
 "action.DANNY.APPROACH": {
  "pl": "Podejście",
  "en": "Approach"
 },
 "action.DANNY.WALK_BACK": {
  "pl": "Krok w tył",
  "en": "Step backward"
 },
 "action.DANNY.LEAN": {
  "pl": "Unik",
  "en": "Evade"
 },
 "action.DANNY.LIGHT_PUNCH": {
  "pl": "Jab",
  "en": "Jab"
 },
 "action.DANNY.HEAVY_PUNCH": {
  "pl": "Cios pięścią",
  "en": "Punch"
 },
 "action.DANNY.LIGHT_KICK": {
  "pl": "Kopnięcie MMA",
  "en": "MMA kick"
 },
 "action.DANNY.HEAVY_KICK": {
  "pl": "Mocne kopnięcie",
  "en": "Heavy kick"
 },
 "action.DANNY.HOOK": {
  "pl": "Sierpowy",
  "en": "Hook"
 },
 "action.DANNY.SIDE_KICK": {
  "pl": "Kopnięcie boczne",
  "en": "Side kick"
 },
 "action.DANNY.COMBO": {
  "pl": "Boks, sierp, low kick i kopnięcie boczne",
  "en": "Boxing, hook, low kick and side kick"
 },
 "action.DANNY.HIT_BODY": {
  "pl": "Trafienie w korpus",
  "en": "Body hit"
 },
 "action.DANNY.HIT_HEAD": {
  "pl": "Trafienie w głowę",
  "en": "Head hit"
 },
 "action.DANNY.HIT_HEAVY": {
  "pl": "Mocne trafienie",
  "en": "Heavy hit"
 },
 "action.DANNY.FALL": {
  "pl": "Upadek",
  "en": "Fall"
 },
 "action.DANNY.LAND": {
  "pl": "Lądowanie",
  "en": "Landing"
 },
 "action.DANNY.DOWN": {
  "pl": "Powalenie",
  "en": "Knockdown"
 },
 "action.DANNY.FLY": {
  "pl": "Wyrzut w powietrze",
  "en": "Launch"
 },
 "action.DANNY.FLY_LAND": {
  "pl": "Upadek po wyrzucie",
  "en": "Landing after launch"
 },
 "action.DANNY.FLY_DOWN": {
  "pl": "Powalenie po wyrzucie",
  "en": "Knockdown after launch"
 },
 "action.DANNY.KO_HOLD": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.DANNY.KO": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.DANNY.GETUP": {
  "pl": "Wstawanie",
  "en": "Getting up"
 },
 "action.DANNY.THROW_VICTIM": {
  "pl": "Chwyt rywala",
  "en": "Opponent’s grab"
 },
 "action.DANNY.THROW_DOWN": {
  "pl": "Upadek po rzucie",
  "en": "Throw landing"
 },
 "action.DANNY.CONTACT_PUSH": {
  "pl": "Odepchnięcie",
  "en": "Pushback"
 },
 "action.DANNY.CONTACT_RECEIVE": {
  "pl": "Utrata równowagi",
  "en": "Stagger"
 },
 "action.DANNY.WIN_ROUND": {
  "pl": "Wygrana runda",
  "en": "Round victory"
 },
 "action.DANNY.WIN_MATCH": {
  "pl": "Wygrana walka",
  "en": "Match victory"
 },
 "action.DANNY.RUN": {
  "pl": "Bieg",
  "en": "Run"
 },
 "action.DANNY.CONTACT_FALL": {
  "pl": "Upadek i wstawanie",
  "en": "Fall and recovery"
 },
 "action.DANNY.HIT_R1_HEAD": {
  "pl": "Trafienie 1 w głowę",
  "en": "Head hit 1"
 },
 "action.DANNY.HIT_R1_BODY": {
  "pl": "Trafienie 1 w korpus",
  "en": "Body hit 1"
 },
 "action.DANNY.HIT_R2_HEAD": {
  "pl": "Trafienie 2 w głowę",
  "en": "Head hit 2"
 },
 "action.DANNY.HIT_R2_BODY": {
  "pl": "Trafienie 2 w korpus",
  "en": "Body hit 2"
 },
 "action.DANNY.HIT_R3_HEAD": {
  "pl": "Trafienie 3 w głowę",
  "en": "Head hit 3"
 },
 "action.DANNY.HIT_R3_BODY": {
  "pl": "Trafienie 3 w korpus",
  "en": "Body hit 3"
 },
 "action.DANNY.BLOCK_LOW": {
  "pl": "Garda niska",
  "en": "Low guard"
 },
 "action.DANNY.QUICK_BACK": {
  "pl": "Szybki krok w tył",
  "en": "Quick step backward"
 },
 "action.DANNY.ACROBATIC_PUNCH": {
  "pl": "Salto z podbródkowym",
  "en": "Flipping uppercut"
 },
 "action.VEXA.IDLE": {
  "pl": "Postawa bojowa",
  "en": "Fighting stance"
 },
 "action.VEXA.BLOCK": {
  "pl": "Garda wysoka",
  "en": "High guard"
 },
 "action.VEXA.BLOCK_LOW": {
  "pl": "Garda niska",
  "en": "Low guard"
 },
 "action.VEXA.INTRO": {
  "pl": "Powitanie",
  "en": "Introduction"
 },
 "action.VEXA.WIN": {
  "pl": "Zwycięstwo",
  "en": "Victory"
 },
 "action.VEXA.RUN": {
  "pl": "Bieg",
  "en": "Run"
 },
 "action.VEXA.WALK_FORWARD": {
  "pl": "Krok w przód",
  "en": "Step forward"
 },
 "action.VEXA.WALK_BACK": {
  "pl": "Krok w tył",
  "en": "Step backward"
 },
 "action.VEXA.LEAN": {
  "pl": "Unik",
  "en": "Evade"
 },
 "action.VEXA.LIGHT_PUNCH": {
  "pl": "Cios bokserski",
  "en": "Boxing punch"
 },
 "action.VEXA.HEAVY_PUNCH": {
  "pl": "Dwa proste",
  "en": "Two straight punches"
 },
 "action.VEXA.LIGHT_KICK": {
  "pl": "Pontera",
  "en": "Pontera"
 },
 "action.VEXA.HEAVY_KICK": {
  "pl": "Kopnięcie okrężne",
  "en": "Roundhouse kick"
 },
 "action.VEXA.SPIN_KICK": {
  "pl": "Armada",
  "en": "Armada"
 },
 "action.VEXA.FLYING_KICK": {
  "pl": "Kopnięcie z wyskoku",
  "en": "Flying kick"
 },
 "action.VEXA.COMBO": {
  "pl": "Pięści, kopnięcie okrężne, obrót i kopnięcie z wyskoku",
  "en": "Punches, roundhouse, spin and flying kick"
 },
 "action.VEXA.HIT_BODY": {
  "pl": "Trafienie w korpus",
  "en": "Body hit"
 },
 "action.VEXA.HIT_HEAD": {
  "pl": "Trafienie w głowę",
  "en": "Head hit"
 },
 "action.VEXA.HIT_HEAVY": {
  "pl": "Mocne trafienie",
  "en": "Heavy hit"
 },
 "action.VEXA.FALL": {
  "pl": "Upadek",
  "en": "Fall"
 },
 "action.VEXA.LAND": {
  "pl": "Lądowanie",
  "en": "Landing"
 },
 "action.VEXA.DOWN": {
  "pl": "Powalenie",
  "en": "Knockdown"
 },
 "action.VEXA.FLY": {
  "pl": "Wyrzut w powietrze",
  "en": "Launch"
 },
 "action.VEXA.FLY_LAND": {
  "pl": "Upadek po wyrzucie",
  "en": "Landing after launch"
 },
 "action.VEXA.FLY_DOWN": {
  "pl": "Powalenie po wyrzucie",
  "en": "Knockdown after launch"
 },
 "action.VEXA.KO_HOLD": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.VEXA.KO": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.VEXA.GETUP": {
  "pl": "Wstawanie",
  "en": "Getting up"
 },
 "action.VEXA.THROW_ATTACKER": {
  "pl": "Rzut przez ramię",
  "en": "Shoulder throw"
 },
 "action.VEXA.THROW_VICTIM": {
  "pl": "Chwyt rywala",
  "en": "Opponent’s grab"
 },
 "action.VEXA.THROW_DOWN": {
  "pl": "Upadek po rzucie",
  "en": "Throw landing"
 },
 "action.VEXA.APPROACH": {
  "pl": "Podejście",
  "en": "Approach"
 },
 "action.VEXA.CONTACT_PUSH": {
  "pl": "Odepchnięcie",
  "en": "Pushback"
 },
 "action.VEXA.CONTACT_RECEIVE": {
  "pl": "Utrata równowagi",
  "en": "Stagger"
 },
 "action.VEXA.WIN_ROUND": {
  "pl": "Wygrana runda",
  "en": "Round victory"
 },
 "action.VEXA.WIN_MATCH": {
  "pl": "Wygrana walka",
  "en": "Match victory"
 },
 "action.VEXA.CONTACT_FALL": {
  "pl": "Upadek i wstawanie",
  "en": "Fall and recovery"
 },
 "action.VEXA.HIT_R1_HEAD": {
  "pl": "Trafienie 1 w głowę",
  "en": "Head hit 1"
 },
 "action.VEXA.HIT_R1_BODY": {
  "pl": "Trafienie 1 w korpus",
  "en": "Body hit 1"
 },
 "action.VEXA.HIT_R2_HEAD": {
  "pl": "Trafienie 2 w głowę",
  "en": "Head hit 2"
 },
 "action.VEXA.HIT_R2_BODY": {
  "pl": "Trafienie 2 w korpus",
  "en": "Body hit 2"
 },
 "action.VEXA.HIT_R3_HEAD": {
  "pl": "Trafienie 3 w głowę",
  "en": "Head hit 3"
 },
 "action.VEXA.HIT_R3_BODY": {
  "pl": "Trafienie 3 w korpus",
  "en": "Body hit 3"
 },
 "action.VEXA.QUICK_BACK": {
  "pl": "Szybki krok w tył",
  "en": "Quick step backward"
 },
 "action.BRAX.IDLE": {
  "pl": "Postawa bojowa",
  "en": "Fighting stance"
 },
 "action.BRAX.BLOCK": {
  "pl": "Garda wysoka",
  "en": "High guard"
 },
 "action.BRAX.BLOCK_LOW": {
  "pl": "Garda niska",
  "en": "Low guard"
 },
 "action.BRAX.INTRO": {
  "pl": "Powitanie",
  "en": "Introduction"
 },
 "action.BRAX.WIN": {
  "pl": "Zwycięstwo",
  "en": "Victory"
 },
 "action.BRAX.RUN": {
  "pl": "Bieg",
  "en": "Run"
 },
 "action.BRAX.WALK_FORWARD": {
  "pl": "Krok w przód",
  "en": "Step forward"
 },
 "action.BRAX.WALK_BACK": {
  "pl": "Krok w tył",
  "en": "Step backward"
 },
 "action.BRAX.LEAN": {
  "pl": "Unik",
  "en": "Evade"
 },
 "action.BRAX.LIGHT_PUNCH": {
  "pl": "Jab–cross",
  "en": "Jab–cross"
 },
 "action.BRAX.HEAVY_PUNCH": {
  "pl": "Sierpowy",
  "en": "Hook"
 },
 "action.BRAX.DOUBLE_PUNCH": {
  "pl": "Cios bokserski",
  "en": "Boxing punch"
 },
 "action.BRAX.LIGHT_KICK": {
  "pl": "Kopnięcie MMA",
  "en": "MMA kick"
 },
 "action.BRAX.HEAVY_KICK": {
  "pl": "Kopnięcie boczne",
  "en": "Side kick"
 },
 "action.BRAX.TEEP": {
  "pl": "Kopnięcie frontalne",
  "en": "Front kick"
 },
 "action.BRAX.COMBO": {
  "pl": "Seria pięści zakończona kopnięciem",
  "en": "Punch string with a finishing kick"
 },
 "action.BRAX.HIT_BODY": {
  "pl": "Trafienie w korpus",
  "en": "Body hit"
 },
 "action.BRAX.HIT_HEAD": {
  "pl": "Trafienie w głowę",
  "en": "Head hit"
 },
 "action.BRAX.HIT_HEAVY": {
  "pl": "Mocne trafienie",
  "en": "Heavy hit"
 },
 "action.BRAX.HOOK": {
  "pl": "Sierpowy",
  "en": "Hook"
 },
 "action.BRAX.UPPERCUT": {
  "pl": "Podbródkowy",
  "en": "Uppercut"
 },
 "action.BRAX.ELBOW": {
  "pl": "Łokieć",
  "en": "Elbow"
 },
 "action.BRAX.COUNTER": {
  "pl": "Kontra",
  "en": "Counter"
 },
 "action.BRAX.CHAIN_STRIKES": {
  "pl": "Seria pięści",
  "en": "Punch string"
 },
 "action.BRAX.KNEE_CHAIN": {
  "pl": "Seria kolan",
  "en": "Knee string"
 },
 "action.BRAX.CLINCH_KNEE": {
  "pl": "Kolano",
  "en": "Knee"
 },
 "action.BRAX.CAPOEIRA": {
  "pl": "Mocne kopnięcie",
  "en": "Heavy kick"
 },
 "action.BRAX.MUAY_THAI_ROUNDHOUSE": {
  "pl": "Kopnięcie okrężne",
  "en": "Roundhouse kick"
 },
 "action.BRAX.CROUCH_KICK": {
  "pl": "Niskie kopnięcie",
  "en": "Low kick"
 },
 "action.BRAX.CROUCH_PUNCH": {
  "pl": "Cios z przysiadu",
  "en": "Crouching punch"
 },
 "action.BRAX.HEAVY_STOMP": {
  "pl": "Mocne tupnięcie",
  "en": "Heavy stomp"
 },
 "action.BRAX.FLY": {
  "pl": "Wyrzut w powietrze",
  "en": "Launch"
 },
 "action.BRAX.FLY_LAND": {
  "pl": "Upadek po wyrzucie",
  "en": "Landing after launch"
 },
 "action.BRAX.FLY_DOWN": {
  "pl": "Powalenie po wyrzucie",
  "en": "Knockdown after launch"
 },
 "action.BRAX.KO_HOLD": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.BRAX.FALL": {
  "pl": "Upadek",
  "en": "Fall"
 },
 "action.BRAX.LAND": {
  "pl": "Lądowanie",
  "en": "Landing"
 },
 "action.BRAX.DOWN": {
  "pl": "Powalenie",
  "en": "Knockdown"
 },
 "action.BRAX.KO": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.BRAX.GETUP": {
  "pl": "Wstawanie",
  "en": "Getting up"
 },
 "action.BRAX.THROW_ATTACKER": {
  "pl": "Rzut przez ramię",
  "en": "Shoulder throw"
 },
 "action.BRAX.THROW_VICTIM": {
  "pl": "Chwyt rywala",
  "en": "Opponent’s grab"
 },
 "action.BRAX.THROW_DOWN": {
  "pl": "Upadek po rzucie",
  "en": "Throw landing"
 },
 "action.BRAX.APPROACH": {
  "pl": "Podejście",
  "en": "Approach"
 },
 "action.BRAX.CONTACT_PUSH": {
  "pl": "Odepchnięcie",
  "en": "Pushback"
 },
 "action.BRAX.CONTACT_RECEIVE": {
  "pl": "Utrata równowagi",
  "en": "Stagger"
 },
 "action.BRAX.WIN_ROUND": {
  "pl": "Wygrana runda",
  "en": "Round victory"
 },
 "action.BRAX.WIN_MATCH": {
  "pl": "Wygrana walka",
  "en": "Match victory"
 },
 "action.BRAX.BACKFLIP": {
  "pl": "Salto w tył",
  "en": "Backflip"
 },
 "action.BRAX.CONTACT_FALL": {
  "pl": "Upadek i wstawanie",
  "en": "Fall and recovery"
 },
 "action.BRAX.HIT_R1_HEAD": {
  "pl": "Trafienie 1 w głowę",
  "en": "Head hit 1"
 },
 "action.BRAX.HIT_R1_BODY": {
  "pl": "Trafienie 1 w korpus",
  "en": "Body hit 1"
 },
 "action.BRAX.HIT_R2_HEAD": {
  "pl": "Trafienie 2 w głowę",
  "en": "Head hit 2"
 },
 "action.BRAX.HIT_R2_BODY": {
  "pl": "Trafienie 2 w korpus",
  "en": "Body hit 2"
 },
 "action.BRAX.HIT_R3_HEAD": {
  "pl": "Trafienie 3 w głowę",
  "en": "Head hit 3"
 },
 "action.BRAX.HIT_R3_BODY": {
  "pl": "Trafienie 3 w korpus",
  "en": "Body hit 3"
 },
 "action.NYXA.IDLE": {
  "pl": "Postawa bojowa",
  "en": "Fighting stance"
 },
 "action.NYXA.BLOCK": {
  "pl": "Garda wysoka",
  "en": "High guard"
 },
 "action.NYXA.BLOCK_LOW": {
  "pl": "Garda niska",
  "en": "Low guard"
 },
 "action.NYXA.INTRO": {
  "pl": "Powitanie",
  "en": "Introduction"
 },
 "action.NYXA.WIN": {
  "pl": "Zwycięstwo",
  "en": "Victory"
 },
 "action.NYXA.WALK_FORWARD": {
  "pl": "Krok w przód",
  "en": "Step forward"
 },
 "action.NYXA.WALK_BACK": {
  "pl": "Krok w tył",
  "en": "Step backward"
 },
 "action.NYXA.LEAN": {
  "pl": "Unik",
  "en": "Evade"
 },
 "action.NYXA.DUCK": {
  "pl": "Unik w dół",
  "en": "Duck"
 },
 "action.NYXA.LIGHT_PUNCH": {
  "pl": "Lewy prosty w głowę",
  "en": "Left straight to the head"
 },
 "action.NYXA.HEAVY_PUNCH": {
  "pl": "Sierpowy w korpus",
  "en": "Body hook"
 },
 "action.NYXA.ELBOW": {
  "pl": "Łokieć",
  "en": "Elbow"
 },
 "action.NYXA.CLINCH_KNEE": {
  "pl": "Kolano",
  "en": "Knee"
 },
 "action.NYXA.LIGHT_KICK": {
  "pl": "Kopnięcie MMA",
  "en": "MMA kick"
 },
 "action.NYXA.HEAVY_KICK": {
  "pl": "Mocne kopnięcie MMA",
  "en": "Heavy MMA kick"
 },
 "action.NYXA.CROUCH_KICK": {
  "pl": "Martelo z ziemi",
  "en": "Ground martelo"
 },
 "action.NYXA.COMBO": {
  "pl": "Pięści, łokcie i martelo z ziemi",
  "en": "Punches, elbows and ground martelo"
 },
 "action.NYXA.HIT_BODY": {
  "pl": "Trafienie w korpus",
  "en": "Body hit"
 },
 "action.NYXA.HIT_HEAD": {
  "pl": "Trafienie w głowę",
  "en": "Head hit"
 },
 "action.NYXA.HIT_HEAVY": {
  "pl": "Mocne trafienie",
  "en": "Heavy hit"
 },
 "action.NYXA.HOOK": {
  "pl": "Sierpowy",
  "en": "Hook"
 },
 "action.NYXA.UPPERCUT": {
  "pl": "Podbródkowy",
  "en": "Uppercut"
 },
 "action.NYXA.LUNGE_PUNCH": {
  "pl": "Proste na korpus",
  "en": "Body jab–cross"
 },
 "action.NYXA.PUNCH_CHAIN": {
  "pl": "Seria prostych",
  "en": "Straight punch string"
 },
 "action.NYXA.COUNTER": {
  "pl": "Kontra",
  "en": "Counter"
 },
 "action.NYXA.SPIN_KICK": {
  "pl": "Kopnięcie obrotowe",
  "en": "Spinning kick"
 },
 "action.NYXA.TEEP": {
  "pl": "Kopnięcie frontalne",
  "en": "Front kick"
 },
 "action.NYXA.CROUCH_PUNCH": {
  "pl": "Cios z przysiadu",
  "en": "Crouching punch"
 },
 "action.NYXA.HEAVY_STOMP": {
  "pl": "Mocne tupnięcie",
  "en": "Heavy stomp"
 },
 "action.NYXA.FLY": {
  "pl": "Wyrzut w powietrze",
  "en": "Launch"
 },
 "action.NYXA.FLY_LAND": {
  "pl": "Upadek po wyrzucie",
  "en": "Landing after launch"
 },
 "action.NYXA.FLY_DOWN": {
  "pl": "Powalenie po wyrzucie",
  "en": "Knockdown after launch"
 },
 "action.NYXA.KO_HOLD": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.NYXA.FALL": {
  "pl": "Upadek",
  "en": "Fall"
 },
 "action.NYXA.LAND": {
  "pl": "Lądowanie",
  "en": "Landing"
 },
 "action.NYXA.DOWN": {
  "pl": "Powalenie",
  "en": "Knockdown"
 },
 "action.NYXA.KO": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.NYXA.GETUP": {
  "pl": "Wstawanie",
  "en": "Getting up"
 },
 "action.NYXA.THROW_ATTACKER": {
  "pl": "Rzut przez ramię",
  "en": "Shoulder throw"
 },
 "action.NYXA.THROW_VICTIM": {
  "pl": "Chwyt rywala",
  "en": "Opponent’s grab"
 },
 "action.NYXA.THROW_DOWN": {
  "pl": "Upadek po rzucie",
  "en": "Throw landing"
 },
 "action.NYXA.APPROACH": {
  "pl": "Podejście",
  "en": "Approach"
 },
 "action.NYXA.CONTACT_PUSH": {
  "pl": "Odepchnięcie",
  "en": "Pushback"
 },
 "action.NYXA.CONTACT_RECEIVE": {
  "pl": "Utrata równowagi",
  "en": "Stagger"
 },
 "action.NYXA.WIN_ROUND": {
  "pl": "Wygrana runda",
  "en": "Round victory"
 },
 "action.NYXA.WIN_MATCH": {
  "pl": "Wygrana walka",
  "en": "Match victory"
 },
 "action.NYXA.RUN": {
  "pl": "Bieg",
  "en": "Run"
 },
 "action.NYXA.CONTACT_FALL": {
  "pl": "Upadek i wstawanie",
  "en": "Fall and recovery"
 },
 "action.NYXA.HIT_R1_HEAD": {
  "pl": "Trafienie 1 w głowę",
  "en": "Head hit 1"
 },
 "action.NYXA.HIT_R1_BODY": {
  "pl": "Trafienie 1 w korpus",
  "en": "Body hit 1"
 },
 "action.NYXA.HIT_R2_HEAD": {
  "pl": "Trafienie 2 w głowę",
  "en": "Head hit 2"
 },
 "action.NYXA.HIT_R2_BODY": {
  "pl": "Trafienie 2 w korpus",
  "en": "Body hit 2"
 },
 "action.NYXA.HIT_R3_HEAD": {
  "pl": "Trafienie 3 w głowę",
  "en": "Head hit 3"
 },
 "action.NYXA.HIT_R3_BODY": {
  "pl": "Trafienie 3 w korpus",
  "en": "Body hit 3"
 },
 "action.NYXA.QUICK_BACK": {
  "pl": "Szybki krok w tył",
  "en": "Quick step backward"
 },
 "action.generic.IDLE": {
  "pl": "Postawa bojowa",
  "en": "Fighting stance"
 },
 "action.generic.BLOCK": {
  "pl": "Garda wysoka",
  "en": "High guard"
 },
 "action.generic.BLOCK_LOW": {
  "pl": "Garda niska",
  "en": "Low guard"
 },
 "action.generic.INTRO": {
  "pl": "Powitanie",
  "en": "Introduction"
 },
 "action.generic.WIN": {
  "pl": "Zwycięstwo",
  "en": "Victory"
 },
 "action.generic.WIN_ROUND": {
  "pl": "Wygrana runda",
  "en": "Round victory"
 },
 "action.generic.WIN_MATCH": {
  "pl": "Wygrana walka",
  "en": "Match victory"
 },
 "action.generic.RUN": {
  "pl": "Bieg",
  "en": "Run"
 },
 "action.generic.WALK_FORWARD": {
  "pl": "Krok w przód",
  "en": "Step forward"
 },
 "action.generic.APPROACH": {
  "pl": "Podejście",
  "en": "Approach"
 },
 "action.generic.WALK_BACK": {
  "pl": "Krok w tył",
  "en": "Step backward"
 },
 "action.generic.LEAN": {
  "pl": "Unik",
  "en": "Evade"
 },
 "action.generic.DUCK": {
  "pl": "Unik w dół",
  "en": "Duck"
 },
 "action.generic.BACKFLIP": {
  "pl": "Salto w tył",
  "en": "Backflip"
 },
 "action.generic.BACK_ROLL": {
  "pl": "Obrót w tył",
  "en": "Backward roll"
 },
 "action.generic.QUICK_BACK": {
  "pl": "Szybki krok w tył",
  "en": "Quick step backward"
 },
 "action.generic.HIT_BODY": {
  "pl": "Trafienie w korpus",
  "en": "Body hit"
 },
 "action.generic.HIT_HEAD": {
  "pl": "Trafienie w głowę",
  "en": "Head hit"
 },
 "action.generic.HIT_HEAVY": {
  "pl": "Mocne trafienie",
  "en": "Heavy hit"
 },
 "action.generic.FALL": {
  "pl": "Upadek",
  "en": "Fall"
 },
 "action.generic.LAND": {
  "pl": "Lądowanie",
  "en": "Landing"
 },
 "action.generic.DOWN": {
  "pl": "Powalenie",
  "en": "Knockdown"
 },
 "action.generic.FLY": {
  "pl": "Wyrzut w powietrze",
  "en": "Launch"
 },
 "action.generic.FLY_LAND": {
  "pl": "Upadek po wyrzucie",
  "en": "Landing after launch"
 },
 "action.generic.FLY_DOWN": {
  "pl": "Powalenie po wyrzucie",
  "en": "Knockdown after launch"
 },
 "action.generic.KO_HOLD": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.generic.KO": {
  "pl": "Nokaut",
  "en": "Knockout"
 },
 "action.generic.GETUP": {
  "pl": "Wstawanie",
  "en": "Getting up"
 },
 "action.generic.THROW_ATTACKER": {
  "pl": "Rzut przez ramię",
  "en": "Shoulder throw"
 },
 "action.generic.THROW_VICTIM": {
  "pl": "Chwyt rywala",
  "en": "Opponent’s grab"
 },
 "action.generic.THROW_DOWN": {
  "pl": "Upadek po rzucie",
  "en": "Throw landing"
 },
 "action.generic.CONTACT_PUSH": {
  "pl": "Odepchnięcie",
  "en": "Pushback"
 },
 "action.generic.CONTACT_RECEIVE": {
  "pl": "Utrata równowagi",
  "en": "Stagger"
 },
 "action.generic.CONTACT_FALL": {
  "pl": "Upadek i wstawanie",
  "en": "Fall and recovery"
 },
 "action.generic.JUMP": {
  "pl": "Skok",
  "en": "Jump"
 },
 "action.generic.GRAB": {
  "pl": "Chwyt",
  "en": "Grab"
 },
 "action.generic.GRAB_TRY": {
  "pl": "Próba chwytu",
  "en": "Grab attempt"
 },
 "action.generic.DASH_FORWARD": {
  "pl": "Doskok w przód",
  "en": "Forward dash"
 },
 "action.generic.DASH_BACK": {
  "pl": "Odskok w tył",
  "en": "Backward dash"
 },
 "action.generic.ACROBATIC_PUNCH": {
  "pl": "Salto z podbródkowym",
  "en": "Flipping uppercut"
 },
 "action.generic.LIGHT_PUNCH": {
  "pl": "Jab",
  "en": "Jab"
 },
 "action.generic.HEAVY_PUNCH": {
  "pl": "Cios pięścią",
  "en": "Punch"
 },
 "action.generic.LIGHT_KICK": {
  "pl": "Kopnięcie MMA",
  "en": "MMA kick"
 },
 "action.generic.HEAVY_KICK": {
  "pl": "Mocne kopnięcie",
  "en": "Heavy kick"
 },
 "action.generic.DOUBLE_PUNCH": {
  "pl": "Cios bokserski",
  "en": "Boxing punch"
 },
 "action.generic.UPPERCUT": {
  "pl": "Podbródkowy",
  "en": "Uppercut"
 },
 "action.generic.ELBOW": {
  "pl": "Łokieć",
  "en": "Elbow"
 },
 "action.generic.HOOK": {
  "pl": "Sierpowy",
  "en": "Hook"
 },
 "action.generic.COUNTER": {
  "pl": "Kontra",
  "en": "Counter"
 },
 "action.generic.CHAIN_STRIKES": {
  "pl": "Seria pięści",
  "en": "Punch string"
 },
 "action.generic.KNEE_CHAIN": {
  "pl": "Seria kolan",
  "en": "Knee string"
 },
 "action.generic.CLINCH_KNEE": {
  "pl": "Kolano",
  "en": "Knee"
 },
 "action.generic.CAPOEIRA": {
  "pl": "Mocne kopnięcie",
  "en": "Heavy kick"
 },
 "action.generic.MUAY_THAI_ROUNDHOUSE": {
  "pl": "Kopnięcie okrężne",
  "en": "Roundhouse kick"
 },
 "action.generic.CROUCH_KICK": {
  "pl": "Niskie kopnięcie",
  "en": "Low kick"
 },
 "action.generic.CROUCH_PUNCH": {
  "pl": "Cios z przysiadu",
  "en": "Crouching punch"
 },
 "action.generic.HEAVY_STOMP": {
  "pl": "Mocne tupnięcie",
  "en": "Heavy stomp"
 },
 "action.generic.LUNGE_PUNCH": {
  "pl": "Proste na korpus",
  "en": "Body jab–cross"
 },
 "action.generic.PUNCH_CHAIN": {
  "pl": "Seria prostych",
  "en": "Straight punch string"
 },
 "action.generic.SPIN_KICK": {
  "pl": "Kopnięcie obrotowe",
  "en": "Spinning kick"
 },
 "action.generic.TEEP": {
  "pl": "Kopnięcie frontalne",
  "en": "Front kick"
 },
 "action.generic.SIDE_KICK": {
  "pl": "Kopnięcie boczne",
  "en": "Side kick"
 },
 "action.generic.FLYING_KICK": {
  "pl": "Kopnięcie z wyskoku",
  "en": "Flying kick"
 },
 "action.generic.CRESCENT_KICK": {
  "pl": "Rasteira",
  "en": "Rasteira"
 },
 "action.generic.MEIA_LUA": {
  "pl": "Meia lua",
  "en": "Meia lua"
 },
 "action.generic.GROUND_KICK": {
  "pl": "Martelo z ziemi",
  "en": "Ground martelo"
 },
 "action.generic.SHOULDER": {
  "pl": "Szarża",
  "en": "Charge"
 },
 "action.generic.COMBO": {
  "pl": "Seria combo",
  "en": "Combo string"
 },
 "action.generic.HIT_R1_HEAD": {
  "pl": "Trafienie 1 w głowę",
  "en": "Head hit 1"
 },
 "action.generic.HIT_R1_BODY": {
  "pl": "Trafienie 1 w korpus",
  "en": "Body hit 1"
 },
 "action.generic.HIT_R2_HEAD": {
  "pl": "Trafienie 2 w głowę",
  "en": "Head hit 2"
 },
 "action.generic.HIT_R2_BODY": {
  "pl": "Trafienie 2 w korpus",
  "en": "Body hit 2"
 },
 "action.generic.HIT_R3_HEAD": {
  "pl": "Trafienie 3 w głowę",
  "en": "Head hit 3"
 },
 "action.generic.HIT_R3_BODY": {
  "pl": "Trafienie 3 w korpus",
  "en": "Body hit 3"
 }
};
window.BRAX_I18N?.register('combat',entries);
window.BRAX_COMBAT_I18N={hasAction:(who,key)=>!!(entries['action.'+who+'.'+key]||entries['action.generic.'+key]),action:(who,key)=>window.BRAX_I18N?.t('combat.'+(entries['action.'+who+'.'+key]?'action.'+who+'.'+key:entries['action.generic.'+key]?'action.generic.'+key:'action.unknown'))||''};
})();
/* A clean vector counterpart: labels are real localized SVG text, never painted over a Polish image. */
(()=>{
'use strict';
const cache=new Map(),api=window.BRAX_COMBAT_I18N;
if(!api)return;
api.guide=who=>{
 const lang=window.BRAX_I18N?.language||'pl',variant=who==='NINA'?'nina':who==='DANNY'?'danny':'standard',cacheKey=lang+':'+variant;
 if(cache.has(cacheKey))return cache.get(cacheKey);
 const t=key=>window.BRAX_I18N?.t('combat.guide.'+key)||'',escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const text=(x,y,label,size=34,anchor='middle')=>`<text x="${x}" y="${y}" font-family="Georgia,serif" font-size="${size}" font-weight="700" text-anchor="${anchor}" fill="#fff3ce" filter="url(#shadow)">${escape(label)}</text>`;
 const button=(x,y,label,size=80)=>`<circle cx="${x}" cy="${y}" r="86" fill="url(#gold)" stroke="#f3d392" stroke-width="3"/><circle cx="${x}" cy="${y}" r="76" fill="url(#emerald)" stroke="#120f0a" stroke-width="5"/><circle cx="${x}" cy="${y}" r="72" fill="none" stroke="#86f0b1" stroke-opacity=".5" stroke-width="2"/>${text(x,y+size*.34,label,size)}`;
 const plaque=(x,y,w,label,size=29)=>`<path d="M${x+18} ${y} H${x+w-18} L${x+w} ${y+17} V${y+75} L${x+w-18} ${y+92} H${x+18} L${x} ${y+75} V${y+17}Z" fill="#080e0d" fill-opacity=".94" stroke="url(#gold)" stroke-width="3"/>${text(x+w/2,y+57,label,size)}`;
 let left=button(175,290,'U')+text(175,415,t('evadeLabel'),33);
 if(variant==='standard')left+=button(410,290,'',70)+'<path transform="translate(410 290)" d="M-38 18L-28-13L-14-28L8-34L24-24L30-7L23 5L12-8L6-10L3 3L16 22L8 37L-4 33L-16 17L-23 10L-27 26Z" fill="#e6cd92" stroke="#fff0bf" stroke-width="3"/>' +text(410,415,t('grabLabel'),33);
 if(variant!=='nina'){const x=variant==='standard'?645:510;left+=button(x,290,'◇',90)+text(x,415,t('guardLabel'),33);}
 left+=button(205,560,'◀',66)+button(610,560,'▶',66)+text(408,575,t('moveLabel'),36);
 if(variant!=='standard')left+=text(410,195,t(variant==='nina'?'noGuard':'noThrowNote'),25);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1942" height="809" viewBox="0 0 1942 809" role="img" aria-labelledby="guideTitle guideDesc" lang="${lang}"><title id="guideTitle">${escape(t('layoutTitle'))}</title><desc id="guideDesc">${escape(window.BRAX_I18N?.t('combat.guide.controlsAlt',{fighter:''})||'')}</desc><defs><linearGradient id="gold" x2=".8" y2="1"><stop stop-color="#fff0b9"/><stop offset=".28" stop-color="#957039"/><stop offset=".52" stop-color="#f0cd7e"/><stop offset=".76" stop-color="#4d371c"/><stop offset="1" stop-color="#d6b36b"/></linearGradient><radialGradient id="emerald" cx=".5" cy=".3" r=".75"><stop stop-color="#203d30"/><stop offset=".6" stop-color="#071713"/><stop offset="1" stop-color="#17452b"/></radialGradient><radialGradient id="back"><stop stop-color="#16372b"/><stop offset="1" stop-color="#040b0a"/></radialGradient><pattern id="stone" width="160" height="90" patternUnits="userSpaceOnUse"><path d="M0 0H160V90H0Z M0 45H160 M80 0V45 M30 45V90" stroke="#8c7651" stroke-opacity=".13" stroke-width="3" fill="none"/></pattern><filter id="shadow"><feDropShadow dx="1" dy="3" stdDeviation="3" flood-color="#000"/></filter><filter id="glow"><feGaussianBlur stdDeviation="9"/></filter></defs><rect width="1942" height="809" rx="18" fill="url(#back)"/><rect width="1942" height="809" fill="url(#stone)"/><path d="M24 24H1918V785H24Z" fill="none" stroke="url(#gold)" stroke-width="4"/><path d="M960 55V645" stroke="url(#gold)" stroke-width="3"/>${text(420,108,'BRAXHORN',93)}${text(420,158,t('header'),36)}${left}<path d="M1380 60L1690 340L1380 625L1070 340Z" fill="#0d3122" fill-opacity=".7" stroke="url(#gold)" stroke-width="5"/><circle cx="1380" cy="340" r="98" fill="#27f59d" fill-opacity=".32" filter="url(#glow)"/>${button(1380,160,'P2')}${button(1190,340,'P1')}${button(1570,340,'K2')}${button(1380,520,'K1')}${button(1380,340,t('comboLabel'),38)}${plaque(1530,96,355,t('punches'),31)}${plaque(1530,531,355,t('kicks'),31)}${plaque(55,675,865,t('forwardRule'),30)}${plaque(1000,675,885,t('comboRule'),30)}</svg>`;
 const uri='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);cache.set(cacheKey,uri);return uri;
};
})();
