/* Online, multiplayer and shared presentation messages. */
(()=>{'use strict';
const I=window.BRAX_I18N;
const messages={
 "ranking.connecting": {
  "pl": "Łączenie z rankingiem…",
  "en": "Connecting to rankings…"
 },
 "identity.guest": {
  "pl": "Gość",
  "en": "Guest"
 },
 "identity.guestUpper": {
  "pl": "GOŚĆ",
  "en": "GUEST"
 },
 "identity.player": {
  "pl": "GRACZ",
  "en": "PLAYER"
 },
 "ranking.unavailable": {
  "pl": "Ranking chwilowo niedostępny.",
  "en": "Rankings are temporarily unavailable."
 },
 "ranking.guest": {
  "pl": "Tryb gościa · turnieje i ranking wymagają zalogowania.",
  "en": "Guest mode · Sign in to join tournaments and rankings."
 },
 "ranking.saved": {
  "pl": "✓ Wynik zapisany online",
  "en": "✓ Result saved online"
 },
 "ranking.retryPending": {
  "pl": "Wynik czeka na ponowny zapis.",
  "en": "Result is waiting to be saved again."
 },
 "ranking.connected": {
  "pl": "Połączono z rankingiem światowym",
  "en": "Connected to world rankings"
 },
 "ranking.offlineNote": {
  "pl": "Brak połączenia z rankingiem. Wyniki online wymagają połączenia.",
  "en": "Rankings are offline. An internet connection is required to save online results."
 },
 "ranking.matchConnected": {
  "pl": "Walka połączona z rankingiem",
  "en": "This match is connected to rankings"
 },
 "history.signIn": {
  "pl": "Zaloguj się, aby zobaczyć historię swojego konta.",
  "en": "Sign in to view your account history."
 },
 "history.loading": {
  "pl": "Pobieranie historii walk…",
  "en": "Loading match history…"
 },
 "identity.opponent": {
  "pl": "Rywal",
  "en": "Opponent"
 },
 "history.empty": {
  "pl": "Nie masz jeszcze zapisanych walk.",
  "en": "You have no saved matches yet."
 },
 "ranking.loading": {
  "pl": "Pobieranie rankingu światowego…",
  "en": "Loading world rankings…"
 },
 "ranking.loadingLabel": {
  "pl": "Pobieranie rankingu",
  "en": "Loading rankings"
 },
 "account.profile": {
  "pl": "MÓJ PROFIL",
  "en": "MY PROFILE"
 },
 "account.signIn": {
  "pl": "ZALOGUJ SIĘ",
  "en": "SIGN IN"
 },
 "ranking.refresh": {
  "pl": "ODŚWIEŻ ↻",
  "en": "REFRESH ↻"
 },
 "history.title": {
  "pl": "HISTORIA TWOICH WALK",
  "en": "YOUR MATCH HISTORY"
 },
 "ranking.completedLower": {
  "pl": "ukończone",
  "en": "completed"
 },
 "ranking.streak": {
  "pl": "seria",
  "en": "streak"
 },
 "ranking.champion": {
  "pl": "mistrz",
  "en": "champion"
 },
 "ranking.completed": {
  "pl": "Ukończone",
  "en": "Completed"
 },
 "ranking.guestNote": {
  "pl": "GOŚĆ · ZALOGUJ SIĘ, ABY ZAPISYWAĆ WYNIKI",
  "en": "GUEST · SIGN IN TO SAVE RESULTS"
 },
 "ranking.noOwnResult": {
  "pl": "TWÓJ WYNIK CZEKA NA PIERWSZĄ UKOŃCZONĄ GRĘ",
  "en": "FINISH YOUR FIRST GAME TO SAVE A RESULT"
 },
 "ranking.tieBreak": {
  "pl": "Przy remisie wygrywa krótszy czas.",
  "en": "Ties are decided by the shorter time."
 },
 "identity.youSuffix": {
  "pl": " · TY",
  "en": " · YOU"
 },
 "ranking.emptyTitle": {
  "pl": "Brak wyników",
  "en": "No results"
 },
 "ranking.emptyText": {
  "pl": "Jeszcze nikt nie zapisał wyniku w tej kategorii. Rozegraj serię i zajmij pierwsze miejsce.",
  "en": "No results have been saved in this category yet. Play a series and take first place."
 },
 "ranking.offline": {
  "pl": "RANKING ŚWIATOWY · BRAK POŁĄCZENIA",
  "en": "WORLD RANKINGS · OFFLINE"
 },
 "ranking.retryHelp": {
  "pl": "Użyj ODŚWIEŻ, aby spróbować ponownie.",
  "en": "Select REFRESH to try again."
 },
 "account.fixedNickname": {
  "pl": "Nick jest przypisany do konta.",
  "en": "Your nickname is linked to your account."
 },
 "fighter.power": {
  "pl": "SIŁA",
  "en": "POWER"
 },
 "multiplayer.modeLabel": {
  "pl": "Multiplayer — walka przez internet",
  "en": "Multiplayer — play online"
 },
 "multiplayer.playerVsPlayer": {
  "pl": "GRACZ KONTRA GRACZ",
  "en": "PLAYER VERSUS PLAYER"
 },
 "multiplayer.internetMatch": {
  "pl": "Walka przez internet",
  "en": "Play online"
 },
 "multiplayer.chooseFighter": {
  "pl": "WYBIERZ ZAWODNIKA",
  "en": "CHOOSE A FIGHTER"
 },
 "navigation.back": {
  "pl": "‹ WRÓĆ",
  "en": "‹ BACK"
 },
 "multiplayer.rosterLabel": {
  "pl": "Zawodnicy — przesuń w lewo lub w prawo",
  "en": "Fighters — swipe left or right"
 },
 "multiplayer.yourFighter": {
  "pl": "TWÓJ ZAWODNIK",
  "en": "YOUR FIGHTER"
 },
 "multiplayer.previousFighter": {
  "pl": "Poprzedni zawodnik",
  "en": "Previous fighter"
 },
 "multiplayer.nextFighter": {
  "pl": "Następny zawodnik",
  "en": "Next fighter"
 },
 "multiplayer.select": {
  "pl": "WYBIERZ →",
  "en": "SELECT →"
 },
 "multiplayer.swipe": {
  "pl": "Przesuń ",
  "en": "Swipe "
 },
 "multiplayer.changeFighter": {
  "pl": "ZMIEŃ ZAWODNIKA",
  "en": "CHANGE FIGHTER"
 },
 "multiplayer.inviteStep": {
  "pl": "01 · ZAPROŚ RYWALA",
  "en": "01 · INVITE AN OPPONENT"
 },
 "multiplayer.createRoom": {
  "pl": "UTWÓRZ POKÓJ",
  "en": "CREATE A ROOM"
 },
 "multiplayer.codeHelp": {
  "pl": "Otrzymasz kod, który przekażesz drugiemu graczowi.",
  "en": "You will receive a code to share with the other player."
 },
 "multiplayer.hostArena": {
  "pl": "ARENA GOSPODARZA",
  "en": "HOST ARENA"
 },
 "multiplayer.createRoomAction": {
  "pl": "UTWÓRZ POKÓJ →",
  "en": "CREATE ROOM →"
 },
 "multiplayer.haveCode": {
  "pl": "02 · MASZ JUŻ KOD?",
  "en": "02 · ALREADY HAVE A CODE?"
 },
 "multiplayer.joinMatch": {
  "pl": "DOŁĄCZ DO WALKI",
  "en": "JOIN A MATCH"
 },
 "multiplayer.otherPlayerCode": {
  "pl": "KOD OD DRUGIEGO GRACZA",
  "en": "CODE FROM THE OTHER PLAYER"
 },
 "code.enter": {
  "pl": "WPISZ KOD",
  "en": "ENTER CODE"
 },
 "multiplayer.joinAction": {
  "pl": "DOŁĄCZ →",
  "en": "JOIN →"
 },
 "multiplayer.internetMatchUpper": {
  "pl": "WALKA PRZEZ INTERNET",
  "en": "ONLINE MATCH"
 },
 "multiplayer.preparingConnection": {
  "pl": "Przygotowanie połączenia",
  "en": "Preparing connection"
 },
 "multiplayer.waitingOpponent": {
  "pl": "Czekamy na rywala…",
  "en": "Waiting for an opponent…"
 },
 "multiplayer.waitingOpponentUpper": {
  "pl": "CZEKAM NA RYWALA",
  "en": "WAITING FOR AN OPPONENT"
 },
 "multiplayer.shareRoomCode": {
  "pl": "KOD POKOJU · PRZEKAŻ RYWALOWI",
  "en": "ROOM CODE · SHARE WITH YOUR OPPONENT"
 },
 "multiplayer.copyCode": {
  "pl": "KOPIUJ KOD",
  "en": "COPY CODE"
 },
 "multiplayer.inviteOpponent": {
  "pl": "ZAPROŚ RYWALA",
  "en": "INVITE AN OPPONENT"
 },
 "multiplayer.lobbyHelp": {
  "pl": "Utwórz pokój albo dołącz kodem od drugiego gracza.",
  "en": "Create a room or join with the other player’s code."
 },
 "multiplayer.readyToConnect": {
  "pl": "ZAWODNICY GOTOWI DO POŁĄCZENIA",
  "en": "PLAYERS READY TO CONNECT"
 },
 "multiplayer.waitingSecondPlayer": {
  "pl": "OCZEKIWANIE NA DRUGIEGO GRACZA",
  "en": "WAITING FOR A SECOND PLAYER"
 },
 "multiplayer.leave": {
  "pl": "OPUŚĆ",
  "en": "LEAVE"
 },
 "multiplayer.connectionFailed": {
  "pl": "Nie udało się połączyć z multiplayerem.",
  "en": "Could not connect to multiplayer."
 },
 "multiplayer.connectionError": {
  "pl": "Błąd połączenia.",
  "en": "Connection error."
 },
 "multiplayer.roomTitle": {
  "pl": "POKÓJ WALKI",
  "en": "MATCH ROOM"
 },
 "multiplayer.connectingTournament": {
  "pl": "Łączenie z wyznaczoną walką turniejową…",
  "en": "Connecting to your tournament match…"
 },
 "multiplayer.giveCode": {
  "pl": "Podaj kod drugiemu graczowi.",
  "en": "Share the code with the other player."
 },
 "multiplayer.joinedPreparing": {
  "pl": "Dołączono. Przygotowanie walki…",
  "en": "Joined. Preparing the match…"
 },
 "multiplayer.codeLength": {
  "pl": "Kod pokoju ma 8 znaków.",
  "en": "A room code has 8 characters."
 },
 "multiplayer.savingConnecting": {
  "pl": "Zapisywanie profilu i łączenie…",
  "en": "Saving your profile and connecting…"
 },
 "multiplayer.roomCode": {
  "pl": "KOD POKOJU",
  "en": "ROOM CODE"
 },
 "multiplayer.copied": {
  "pl": "Kod skopiowany.",
  "en": "Code copied."
 },
 "multiplayer.peerLeft": {
  "pl": "Drugi gracz opuścił pokój.",
  "en": "The other player left the room."
 },
 "multiplayer.loadingFighters": {
  "pl": "Ładowanie obu zawodników…",
  "en": "Loading both fighters…"
 },
 "multiplayer.connectingPlayers": {
  "pl": "Łączenie graczy…",
  "en": "Connecting players…"
 },
 "multiplayer.voiceConsent": {
  "pl": "Wybierz zgodę na rozmowę głosową.",
  "en": "Choose whether to allow voice chat."
 },
 "multiplayer.fighterReady": {
  "pl": "Twój zawodnik gotowy. Czekamy na gotowość rywala…",
  "en": "Your fighter is ready. Waiting for your opponent…"
 },
 "multiplayer.matchLoadFailed": {
  "pl": "Nie udało się wczytać walki. Spróbuj ponownie.",
  "en": "Could not load the match. Please try again."
 },
 "multiplayer.draw": {
  "pl": "REMIS",
  "en": "DRAW"
 },
 "multiplayer.youWin": {
  "pl": "WYGRYWASZ",
  "en": "YOU WIN"
 },
 "multiplayer.opponentWins": {
  "pl": "WYGRYWA RYWAL",
  "en": "OPPONENT WINS"
 },
 "multiplayer.waitingConnection": {
  "pl": "Czekam na połączenie rywala…",
  "en": "Waiting for the opponent to reconnect…"
 },
 "multiplayer.youLeft": {
  "pl": "TY: LEWA STRONA",
  "en": "YOU: LEFT SIDE"
 },
 "multiplayer.youRight": {
  "pl": "TY: PRAWA STRONA",
  "en": "YOU: RIGHT SIDE"
 },
 "multiplayer.direct": {
  "pl": "BEZPOŚREDNIO",
  "en": "DIRECT"
 },
 "multiplayer.fallback": {
  "pl": " · POŁĄCZENIE ZAPASOWE · ",
  "en": " · BACKUP CONNECTION · "
 },
 "multiplayer.peerDisconnected": {
  "pl": "Rywal utracił połączenie. Walka zakończona.",
  "en": "Your opponent disconnected. The match has ended."
 },
 "multiplayer.reconnecting": {
  "pl": "Przywracanie połączenia…",
  "en": "Reconnecting…"
 },
 "multiplayer.versionMismatch": {
  "pl": "Odśwież grę — inna wersja u przeciwnika",
  "en": "Refresh the game — your opponent is using a different version"
 },
 "multiplayer.roomClosed": {
  "pl": "Pokój został zamknięty.",
  "en": "The room has been closed."
 },
 "multiplayer.connectionLost": {
  "pl": "Połączenie przerwane. Otwórz nowy pokój.",
  "en": "Connection lost. Open a new room."
 },
 "multiplayer.resultLabel": {
  "pl": "Wynik walki online",
  "en": "Online match result"
 },
 "multiplayer.resultHeading": {
  "pl": "BRAXHORN · WYNIK WALKI",
  "en": "BRAXHORN · MATCH RESULT"
 },
 "multiplayer.backToMultiplayer": {
  "pl": "WRÓĆ DO MULTIPLAYERA →",
  "en": "BACK TO MULTIPLAYER →"
 },
 "multiplayer.reportUnconfirmed": {
  "pl": "ZGŁOŚ BRAK POTWIERDZENIA",
  "en": "REPORT MISSING CONFIRMATION"
 },
 "multiplayer.organizerReview": {
  "pl": "Wynik oczekuje na decyzję organizatora.",
  "en": "The result is awaiting the organizer’s decision."
 },
 "multiplayer.backToTournament": {
  "pl": "WRÓĆ DO TURNIEJU →",
  "en": "BACK TO TOURNAMENT →"
 },
 "multiplayer.savingResult": {
  "pl": "Zapisywanie wyniku · czekamy na potwierdzenie obu połączeń…",
  "en": "Saving result · Waiting for confirmation from both players…"
 },
 "multiplayer.unconfirmed": {
  "pl": "Brakuje potwierdzenia drugiego gracza. Wynik nie został zatwierdzony.",
  "en": "The other player has not confirmed. The result has not been approved."
 },
 "multiplayer.drawReplay": {
  "pl": "Remis zapisany. Organizator wyznaczy powtórkę.",
  "en": "Draw saved. The organizer will schedule a rematch."
 },
 "multiplayer.resultConfirmed": {
  "pl": "Wynik zapisany · zgodne zgłoszenia obu graczy.",
  "en": "Result saved · Both players submitted matching results."
 },
 "multiplayer.resultDisputed": {
  "pl": "Niezgodność wyników. Organizator rozstrzygnie tę walkę.",
  "en": "The results differ. The organizer will decide this match."
 },
 "multiplayer.leaveFirst": {
  "pl": "Najpierw opuść obecną walkę.",
  "en": "Leave your current match first."
 },
 "tournament.signInPlay": {
  "pl": "Zaloguj się, aby grać w turniejach.",
  "en": "Sign in to play in tournaments."
 },
 "tournament.status.registration": {
  "pl": "ZAPISY OTWARTE",
  "en": "REGISTRATION OPEN"
 },
 "tournament.status.running": {
  "pl": "TURNIEJ W TOKU",
  "en": "TOURNAMENT IN PROGRESS"
 },
 "tournament.status.completed": {
  "pl": "ZAKOŃCZONY",
  "en": "COMPLETED"
 },
 "tournament.status.cancelled": {
  "pl": "ODWOŁANY",
  "en": "CANCELLED"
 },
 "tournament.status.scheduled": {
  "pl": "ZAPLANOWANA",
  "en": "SCHEDULED"
 },
 "tournament.status.waiting": {
  "pl": "OCZEKIWANIE NA PARĘ",
  "en": "WAITING FOR OPPONENTS"
 },
 "tournament.status.playing": {
  "pl": "WALKA W TOKU",
  "en": "MATCH IN PROGRESS"
 },
 "tournament.status.review": {
  "pl": "DECYZJA ORGANIZATORA",
  "en": "ORGANIZER’S DECISION"
 },
 "tournament.status.finished": {
  "pl": "ZAKOŃCZONA",
  "en": "FINISHED"
 },
 "tournament.status.bye": {
  "pl": "WOLNY LOS",
  "en": "BYE"
 },
 "tournament.onlineLabel": {
  "pl": "Turnieje online",
  "en": "Online tournaments"
 },
 "tournament.onlineTitle": {
  "pl": "TURNIEJE ONLINE",
  "en": "ONLINE TOURNAMENTS"
 },
 "tournament.saveFailed": {
  "pl": "Nie udało się zapisać turnieju.",
  "en": "Could not save the tournament."
 },
 "form.close": {
  "pl": "Zamknij formularz",
  "en": "Close form"
 },
 "tournament.create": {
  "pl": "UTWÓRZ TURNIEJ",
  "en": "CREATE TOURNAMENT"
 },
 "tournament.name": {
  "pl": "Nazwa turnieju",
  "en": "Tournament name"
 },
 "tournament.capacity": {
  "pl": "Liczba miejsc",
  "en": "Number of places"
 },
 "tournament.firstMatch": {
  "pl": "Pierwsza walka",
  "en": "First match"
 },
 "tournament.interval": {
  "pl": "Przerwa między walkami",
  "en": "Break between matches"
 },
 "tournament.whenReady": {
  "pl": "Gdy para jest gotowa",
  "en": "When both opponents are ready"
 },
 "tournament.registrationCloses": {
  "pl": "Zapisy zamkniesz przy losowaniu drabinki.",
  "en": "Registration closes when you draw the bracket."
 },
 "tournament.inTwoMinutes": {
  "pl": "ZA 2 MINUTY",
  "en": "IN 2 MINUTES"
 },
 "tournament.openRegistration": {
  "pl": "OTWÓRZ ZAPISY →",
  "en": "OPEN REGISTRATION →"
 },
 "identity.you": {
  "pl": "TY",
  "en": "YOU"
 },
 "tournament.waiting": {
  "pl": "Oczekiwanie",
  "en": "Waiting"
 },
 "tournament.previousWinner": {
  "pl": "ZWYCIĘZCA POPRZEDNIEJ WALKI",
  "en": "WINNER OF THE PREVIOUS MATCH"
 },
 "tournament.opponentSoon": {
  "pl": "Przeciwnik wkrótce",
  "en": "Opponent to be decided"
 },
 "tournament.waitingPrevious": {
  "pl": "Czekamy na wyniki poprzedniej rundy.",
  "en": "Waiting for results from the previous round."
 },
 "tournament.opponentsPlaying": {
  "pl": "Walka rywali trwa.",
  "en": "Your potential opponents are playing."
 },
 "tournament.opponentsReview": {
  "pl": "Wynik rywali czeka na decyzję organizatora.",
  "en": "The opponents’ result is awaiting the organizer’s decision."
 },
 "tournament.opponentsWhenReady": {
  "pl": "Walka rywali rozpocznie się po wyłonieniu pary.",
  "en": "The opponents’ match will start once both players are known."
 },
 "tournament.previousRoundWinner": {
  "pl": "Zwycięzca poprzedniej rundy",
  "en": "Winner of the previous round"
 },
 "tournament.waitingOpponent": {
  "pl": "CZEKASZ NA RYWALA",
  "en": "WAITING FOR AN OPPONENT"
 },
 "tournament.yourMatchActive": {
  "pl": "Twoja walka trwa w aktywnej sesji.",
  "en": "Your match is in progress in an active session."
 },
 "tournament.yourMatch": {
  "pl": "TWOJA WALKA",
  "en": "YOUR MATCH"
 },
 "tournament.title": {
  "pl": "TURNIEJE",
  "en": "TOURNAMENTS"
 },
 "tournament.compete": {
  "pl": "WEJDŹ DO RYWALIZACJI",
  "en": "JOIN THE COMPETITION"
 },
 "tournament.roadToFinal": {
  "pl": "Twoja droga do finału.",
  "en": "Your road to the final."
 },
 "tournament.createAction": {
  "pl": "+ UTWÓRZ TURNIEJ",
  "en": "+ CREATE TOURNAMENT"
 },
 "tournament.nextMatch": {
  "pl": "TWOJA NAJBLIŻSZA WALKA",
  "en": "YOUR NEXT MATCH"
 },
 "tournament.waitingNextOpponent": {
  "pl": "Czekamy na przeciwnika",
  "en": "Waiting for an opponent"
 },
 "tournament.viewMatch": {
  "pl": "ZOBACZ WALKĘ →",
  "en": "VIEW MATCH →"
 },
 "tournament.participating": {
  "pl": " · BIERZESZ UDZIAŁ",
  "en": " · YOU ARE ENTERED"
 },
 "tournament.organizerSuffix": {
  "pl": " · ORGANIZATOR",
  "en": " · ORGANIZER"
 },
 "tournament.emptyTitle": {
  "pl": "Brak zaplanowanych turniejów",
  "en": "No tournaments scheduled"
 },
 "tournament.emptyText": {
  "pl": "Organizator ogłosi tutaj kolejne rozgrywki.",
  "en": "The organizer will announce upcoming events here."
 },
 "tournament.haveCode": {
  "pl": "MASZ KOD TURNIEJU?",
  "en": "HAVE A TOURNAMENT CODE?"
 },
 "code.eightCharacters": {
  "pl": "8 ZNAKÓW",
  "en": "8 CHARACTERS"
 },
 "navigation.open": {
  "pl": "OTWÓRZ →",
  "en": "OPEN →"
 },
 "tournament.footnote": {
  "pl": " · Organizator: Wawer. Godziny w Twojej strefie: ",
  "en": " · Organizer: Wawer. Times in your time zone: "
 },
 "tournament.scheduleInfo": {
  "pl": ". Informacje o walkach i zmianach terminów są dostępne tutaj.",
  "en": ". Match information and schedule changes are available here."
 },
 "tournament.role": {
  "pl": "Rola w turniejach",
  "en": "Tournament role"
 },
 "tournament.playingRole": {
  "pl": "Gram",
  "en": "Playing"
 },
 "tournament.organizingRole": {
  "pl": "Organizuję",
  "en": "Organizing"
 },
 "tournament.personalCodeLabel": {
  "pl": "OSOBISTY KOD OD ORGANIZATORA",
  "en": "PERSONAL CODE FROM THE ORGANIZER"
 },
 "tournament.personalCodePlaceholder": {
  "pl": "TWÓJ KOD · 16 ZNAKÓW",
  "en": "YOUR CODE · 16 CHARACTERS"
 },
 "tournament.claimPlace": {
  "pl": "ODBIERZ MIEJSCE →",
  "en": "CLAIM YOUR PLACE →"
 },
 "tournament.codeHelp": {
  "pl": "Turniej z otwartymi zapisami: wybierz go z listy i naciśnij ZAPISZ SIĘ. Osobisty kod przypisuje Ci miejsce dodane przez organizatora.",
  "en": "For open registration, select a tournament and press SIGN UP. A personal code assigns you a place added by the organizer."
 },
 "tournament.codeTitle": {
  "pl": "KOD TURNIEJU",
  "en": "TOURNAMENT CODE"
 },
 "tournament.personalCodeTitle": {
  "pl": "TWÓJ OSOBISTY KOD",
  "en": "YOUR PERSONAL CODE"
 },
 "tournament.afterPairKnown": {
  "pl": "PO WYŁONIENIU PARY",
  "en": "ONCE BOTH OPPONENTS ARE KNOWN"
 },
 "tournament.advanceBye": {
  "pl": "AWANS BEZ WALKI",
  "en": "ADVANCE WITH A BYE"
 },
 "tournament.walkover": {
  "pl": "WALKOWER",
  "en": "WALKOVER"
 },
 "tournament.matchCode": {
  "pl": "KOD WALKI ",
  "en": "MATCH CODE "
 },
 "tournament.enterMatch": {
  "pl": "WEJDŹ DO WALKI →",
  "en": "ENTER MATCH →"
 },
 "tournament.matchInSession": {
  "pl": "Walka rozpoczęta w aktywnej sesji.",
  "en": "The match has started in an active session."
 },
 "tournament.roomOpens": {
  "pl": "Pokój otwiera się 10 min przed terminem.",
  "en": "The room opens 10 minutes before the scheduled time."
 },
 "tournament.manageMatch": {
  "pl": "ZARZĄDZAJ WALKĄ",
  "en": "MANAGE MATCH"
 },
 "tournament.noBreaks": {
  "pl": "BEZ PRZERW",
  "en": "NO BREAKS"
 },
 "share.action": {
  "pl": "UDOSTĘPNIJ ↗",
  "en": "SHARE ↗"
 },
 "tournament.organizerPanel": {
  "pl": "PANEL ORGANIZATORA",
  "en": "ORGANIZER PANEL"
 },
 "tournament.addOrShare": {
  "pl": "Dodaj graczy lub udostępnij otwarte zapisy.",
  "en": "Add players or share the open registration."
 },
 "tournament.addParticipantAction": {
  "pl": "+ DODAJ UCZESTNIKA",
  "en": "+ ADD PARTICIPANT"
 },
 "tournament.changeSchedule": {
  "pl": "ZMIEŃ TERMIN",
  "en": "CHANGE SCHEDULE"
 },
 "tournament.drawPairs": {
  "pl": "LOSUJ PARY →",
  "en": "DRAW PAIRS →"
 },
 "tournament.champion": {
  "pl": "MISTRZ TURNIEJU",
  "en": "TOURNAMENT CHAMPION"
 },
 "tournament.replayVictory": {
  "pl": "ODTWÓRZ FILM ZWYCIĘZCY →",
  "en": "REPLAY VICTORY FILM →"
 },
 "tournament.entrantList": {
  "pl": "LISTA ZAWODNIKÓW",
  "en": "FIGHTER LIST"
 },
 "tournament.afterRegistration": {
  "pl": "Po zamknięciu zapisów organizator losuje pary i publikuje godziny walk.",
  "en": "After registration closes, the organizer draws the pairs and publishes match times."
 },
 "tournament.enrolled": {
  "pl": "✓ JESTEŚ NA LIŚCIE",
  "en": "✓ YOU ARE ON THE LIST"
 },
 "tournament.withdraw": {
  "pl": "WYCOFAJ ZGŁOSZENIE",
  "en": "WITHDRAW ENTRY"
 },
 "tournament.chooseCharacter": {
  "pl": "1 · WYBIERZ POSTAĆ DO TURNIEJU",
  "en": "1 · CHOOSE YOUR TOURNAMENT FIGHTER"
 },
 "navigation.change": {
  "pl": "ZMIEŃ",
  "en": "CHANGE"
 },
 "tournament.signUp": {
  "pl": "ZAPISZ SIĘ →",
  "en": "SIGN UP →"
 },
 "tournament.awaitingClaim": {
  "pl": "CZEKA NA ODEBRANIE MIEJSCA",
  "en": "WAITING FOR PLACE TO BE CLAIMED"
 },
 "tournament.copyInvite": {
  "pl": "KOPIUJ OSOBISTY KOD",
  "en": "COPY PERSONAL CODE"
 },
 "tournament.placeAssigned": {
  "pl": "✓ MIEJSCE PRZYPISANE",
  "en": "✓ PLACE ASSIGNED"
 },
 "tournament.removeEntry": {
  "pl": "USUŃ Z LISTY",
  "en": "REMOVE FROM LIST"
 },
 "tournament.vacancy": {
  "pl": "WOLNE MIEJSCE",
  "en": "AVAILABLE PLACE"
 },
 "tournament.yourTournament": {
  "pl": "TWÓJ TURNIEJ",
  "en": "YOUR TOURNAMENT"
 },
 "tournament.addPlayer": {
  "pl": "DODAJ GRACZA",
  "en": "ADD PLAYER"
 },
 "share.actionPlain": {
  "pl": "UDOSTĘPNIJ",
  "en": "SHARE"
 },
 "tournament.cancel": {
  "pl": "ODWOŁAJ",
  "en": "CANCEL"
 },
 "tournament.bracket": {
  "pl": "DRABINKA",
  "en": "BRACKET"
 },
 "tournament.schedule": {
  "pl": "TERMINARZ",
  "en": "SCHEDULE"
 },
 "tournament.final": {
  "pl": "FINAŁ",
  "en": "FINAL"
 },
 "tournament.semifinals": {
  "pl": "PÓŁFINAŁY",
  "en": "SEMIFINALS"
 },
 "tournament.quarterfinals": {
  "pl": "ĆWIERĆFINAŁY",
  "en": "QUARTERFINALS"
 },
 "tournament.preliminary": {
  "pl": "RUNDA WSTĘPNA",
  "en": "PRELIMINARY ROUND"
 },
 "tournament.timeHeader": {
  "pl": "GODZINA",
  "en": "TIME"
 },
 "tournament.fightersHeader": {
  "pl": "ZAWODNICY",
  "en": "FIGHTERS"
 },
 "tournament.stageHeader": {
  "pl": "ETAP",
  "en": "STAGE"
 },
 "tournament.statusScore": {
  "pl": "STATUS / WYNIK",
  "en": "STATUS / SCORE"
 },
 "tournament.afterPairKnownSentence": {
  "pl": "Po wyłonieniu pary",
  "en": "Once both opponents are known"
 },
 "tournament.semifinal": {
  "pl": "PÓŁFINAŁ",
  "en": "SEMIFINAL"
 },
 "tournament.qualifiers": {
  "pl": "ELIMINACJE",
  "en": "QUALIFIERS"
 },
 "tournament.delete": {
  "pl": "USUŃ TURNIEJ",
  "en": "DELETE TOURNAMENT"
 },
 "tournament.decisionsHistory": {
  "pl": "HISTORIA DECYZJI ORGANIZATORA",
  "en": "ORGANIZER DECISION HISTORY"
 },
 "tournament.signInJoin": {
  "pl": "Zaloguj się, aby brać udział w turniejach.",
  "en": "Sign in to join tournaments."
 },
 "tournament.signInJoinSpace": {
  "pl": "Zaloguj się, aby brać udział w turniejach. ",
  "en": "Sign in to join tournaments. "
 },
 "tournament.loading": {
  "pl": "ŁADOWANIE TURNIEJU…",
  "en": "LOADING TOURNAMENT…"
 },
 "tournament.joinCompetition": {
  "pl": "Dołącz do rywalizacji",
  "en": "Join the competition"
 },
 "tournament.signInRanking": {
  "pl": "Zaloguj się, aby brać udział w turniejach i rankingach.",
  "en": "Sign in to join tournaments and rankings."
 },
 "tournament.guestOtherModes": {
  "pl": "Gość może grać w pozostałych trybach.",
  "en": "Guests can play the other modes."
 },
 "tournament.matchDue": {
  "pl": "TERMIN WALKI NADESZEDŁ",
  "en": "THE MATCH IS DUE"
 },
 "form.saving": {
  "pl": "Zapisywanie…",
  "en": "Saving…"
 },
 "tournament.deleted": {
  "pl": "Turniej usunięty.",
  "en": "Tournament deleted."
 },
 "tournament.cancelledNotice": {
  "pl": "Turniej odwołany i przeniesiony do odwołanych.",
  "en": "Tournament cancelled and moved to the cancelled list."
 },
 "tournament.participantAdded": {
  "pl": "Uczestnik dodany. Skopiuj jego osobisty kod z karty na liście.",
  "en": "Participant added. Copy their personal code from their card in the list."
 },
 "tournament.placeClaimed": {
  "pl": "Twoje miejsce zostało przypisane. Jesteś na liście turnieju.",
  "en": "Your place has been assigned. You are on the tournament list."
 },
 "form.saved": {
  "pl": "Zapisano.",
  "en": "Saved."
 },
 "form.action": {
  "pl": "Działanie",
  "en": "Action"
 },
 "tournament.rescheduleAll": {
  "pl": "Przełóż tę i późniejsze walki",
  "en": "Reschedule this and later matches"
 },
 "tournament.restart": {
  "pl": "Zarządź powtórkę",
  "en": "Schedule a rematch"
 },
 "tournament.resolve": {
  "pl": "Przyznaj walkower / rozstrzygnij",
  "en": "Award a walkover / decide result"
 },
 "tournament.newSchedule": {
  "pl": "Nowy termin",
  "en": "New scheduled time"
 },
 "tournament.winnerDecision": {
  "pl": "Zwycięzca przy rozstrzygnięciu",
  "en": "Winner when deciding the result"
 },
 "tournament.reason": {
  "pl": "Uzasadnienie decyzji",
  "en": "Reason for the decision"
 },
 "tournament.reasonPlaceholder": {
  "pl": "Powód zmiany lub rozstrzygnięcia",
  "en": "Reason for the change or decision"
 },
 "tournament.decisionNote": {
  "pl": "Decyzja zostanie zapisana w historii turnieju. Przed rozstrzygnięciem sprawdź uczestników i wynik.",
  "en": "The decision will be saved in tournament history. Check the participants and score before deciding."
 },
 "tournament.saveDecision": {
  "pl": "ZAPISZ DECYZJĘ →",
  "en": "SAVE DECISION →"
 },
 "tournament.addParticipant": {
  "pl": "DODAJ UCZESTNIKA",
  "en": "ADD PARTICIPANT"
 },
 "tournament.participantName": {
  "pl": "Imię lub pseudonim",
  "en": "Name or nickname"
 },
 "tournament.nameExample": {
  "pl": "np. Monika",
  "en": "e.g. Monica"
 },
 "tournament.fighter": {
  "pl": "Zawodnik",
  "en": "Fighter"
 },
 "tournament.personalCodeNote": {
  "pl": "Uczestnik otrzyma osobisty kod do swojego miejsca. Przekaż go tej osobie. Po wpisaniu kodu może wejść do swoich wylosowanych walk.",
  "en": "The participant will receive a personal code for their place. Share it with them. After entering it, they can join their assigned matches."
 },
 "tournament.addAndCode": {
  "pl": "DODAJ I UTWÓRZ KOD →",
  "en": "ADD AND CREATE CODE →"
 },
 "tournament.removeRegistration": {
  "pl": "USUŃ ZGŁOSZENIE",
  "en": "REMOVE ENTRY"
 },
 "tournament.drawTitle": {
  "pl": "LOSOWANIE DRABINKI",
  "en": "BRACKET DRAW"
 },
 "tournament.deleteNote": {
  "pl": "Turniej zniknie z listy i nie będzie dostępny przez kod. Trwające pokoje walk zostaną zamknięte.",
  "en": "The tournament will disappear from the list and can no longer be opened with its code. Active match rooms will close."
 },
 "tournament.cancelTitle": {
  "pl": "ODWOŁAJ TURNIEJ",
  "en": "CANCEL TOURNAMENT"
 },
 "tournament.cancelNote": {
  "pl": "Uczestnicy zobaczą, że turniej został odwołany.",
  "en": "Participants will see that the tournament has been cancelled."
 },
 "tournament.confirmCancel": {
  "pl": "POTWIERDŹ ODWOŁANIE",
  "en": "CONFIRM CANCELLATION"
 },
 "tournament.changeFirstSchedule": {
  "pl": "ZMIEŃ PIERWSZY TERMIN",
  "en": "CHANGE FIRST MATCH TIME"
 },
 "tournament.saveSchedule": {
  "pl": "ZAPISZ TERMIN →",
  "en": "SAVE TIME →"
 },
 "tournament.connectingMatch": {
  "pl": "Łączenie z walką…",
  "en": "Connecting to match…"
 },
 "tournament.modeLabel": {
  "pl": "Turnieje online — zapisz się do turnieju Wawera",
  "en": "Online tournaments — sign up for Wawer’s tournament"
 },
 "tournament.organizerWawer": {
  "pl": "ORGANIZATOR · WAWER",
  "en": "ORGANIZER · WAWER"
 },
 "tournament.modeDescription": {
  "pl": "Zapisy · drabinka · finał",
  "en": "Registration · bracket · final"
 },
 "profile.label": {
  "pl": "Twój profil · zmień awatar lub wyloguj się",
  "en": "Your profile · Change avatar or sign out"
 },
 "navigation.backLabel": {
  "pl": "Wróć",
  "en": "Back"
 },
 "navigation.choose": {
  "pl": "Wybierz",
  "en": "Choose"
 },
 "multiplayer.hostArenaLabel": {
  "pl": "Arena gospodarza",
  "en": "Host arena"
 },
 "code.paste": {
  "pl": "Wklej",
  "en": "Paste"
 },
 "code.pasteHelp": {
  "pl": "Wklej kod skrótem lub przytrzymaj pole.",
  "en": "Paste the code using a shortcut or press and hold the field."
 },
 "code.complete": {
  "pl": "✓ Kod kompletny",
  "en": "✓ Code complete"
 },
 "roster.title": {
  "pl": "WYBÓR ZAWODNIKA",
  "en": "CHOOSE FIGHTER"
 },
 "arena.title": {
  "pl": "WYBÓR ARENY",
  "en": "CHOOSE ARENA"
 },
 "arena.section": {
  "pl": "ARENY",
  "en": "ARENAS"
 },
 "challenge.section": {
  "pl": "WYZWANIA",
  "en": "CHALLENGES"
 },
 "modes.section": {
  "pl": "TRYBY",
  "en": "MODES"
 },
 "ranking.section": {
  "pl": "RANKING",
  "en": "RANKINGS"
 },
 "sound.toggle": {
  "pl": "Przełącz dźwięk",
  "en": "Toggle sound"
 },
 "code.type": {
  "pl": "Rodzaj kodu",
  "en": "Code type"
 },
 "code.tournamentTab": {
  "pl": "Kod turnieju (8)",
  "en": "Tournament code (8)"
 },
 "code.personalTab": {
  "pl": "Kod osobisty (16)",
  "en": "Personal code (16)"
 },
 "form.matchDate": {
  "pl": "Termin walki",
  "en": "Match time"
 },
 "form.chooseDate": {
  "pl": "Wybierz datę i godzinę",
  "en": "Choose a date and time"
 },
 "tournament.drawMinimum": {
  "pl": "Do losowania potrzeba co najmniej 4 graczy.",
  "en": "At least 4 players are needed for the draw."
 },
 "share.sentence": {
  "pl": "Udostępnij",
  "en": "Share"
 },
 "code.copied": {
  "pl": "Kod skopiowany",
  "en": "Code copied"
 },
 "share.failed": {
  "pl": "Nie udało się udostępnić kodu. Użyj „Kopiuj kod”.",
  "en": "Could not share the code. Use “Copy code”."
 },
 "tournament.bracketPreview": {
  "pl": "Drabinka zostanie uzupełniona po losowaniu",
  "en": "The bracket will be filled in after the draw"
 },
 "tournament.afterDraw": {
  "pl": "+ Po losowaniu",
  "en": "+ After the draw"
 },
 "versus.presentation": {
  "pl": "Prezentacja zawodników",
  "en": "Fighter presentation"
 },
 "challenge.saved": {
  "pl": "✓ Ukończenie zapisane w postępach postaci",
  "en": "✓ Completion saved to fighter progress"
 },
 "challenge.fighterProgress": {
  "pl": "Postać — postęp wyzwań",
  "en": "Fighter — challenge progress"
 },
 "challenge.guardUnavailable": {
  "pl": "To wyzwanie wymaga gardy niedostępnej dla tej postaci.",
  "en": "This challenge requires a guard that is unavailable for this fighter."
 },
 "survival.yourRecord": {
  "pl": "TWÓJ REKORD",
  "en": "YOUR RECORD"
 },
 "survival.winsInRow": {
  "pl": "zwycięstwa w serii",
  "en": "consecutive wins"
 },
 "connection.offline": {
  "pl": "Brak połączenia.",
  "en": "Offline."
 },
 "survival.noRecord": {
  "pl": "Brak zapisanego wyniku na tym poziomie.",
  "en": "No saved result at this difficulty."
 },
 "voice.heading": {
  "pl": "BRAXHORN · ROZMOWA GŁOSOWA",
  "en": "BRAXHORN · VOICE CHAT"
 },
 "voice.question": {
  "pl": "Czy zezwalasz na rozmowę głosową podczas gry?",
  "en": "Allow voice chat while playing?"
 },
 "voice.consentNote": {
  "pl": "Rozmowa po zgodzie obu graczy. Mikrofon możesz wyciszyć w każdej chwili.",
  "en": "Voice chat starts after both players agree. You can mute your microphone at any time."
 },
 "voice.allow": {
  "pl": "ZEZWALAM",
  "en": "ALLOW"
 },
 "voice.deny": {
  "pl": "NIE ZEZWALAM",
  "en": "DO NOT ALLOW"
 },
 "voice.label": {
  "pl": "Rozmowa głosowa",
  "en": "Voice chat"
 },
 "voice.defaultStatus": {
  "pl": "ROZMOWA",
  "en": "VOICE CHAT"
 },
 "voice.muteMic": {
  "pl": "Wycisz mikrofon",
  "en": "Mute microphone"
 },
 "voice.muteOpponent": {
  "pl": "Wycisz przeciwnika",
  "en": "Mute opponent"
 },
 "voice.endLabel": {
  "pl": "Zakończ rozmowę głosową",
  "en": "End voice chat"
 },
 "voice.permissionHelp": {
  "pl": "Zezwól na mikrofon w komunikacie telefonu. Możesz też wybrać „NIE ZEZWALAM”.",
  "en": "Allow microphone access in your device’s prompt. You can also choose “DO NOT ALLOW”."
 },
 "voice.disabled": {
  "pl": "ROZMOWA WYŁĄCZONA",
  "en": "VOICE CHAT OFF"
 },
 "voice.unavailableMic": {
  "pl": "MIKROFON NIEDOSTĘPNY",
  "en": "MICROPHONE UNAVAILABLE"
 },
 "voice.noPermission": {
  "pl": "BEZ ROZMOWY · BRAK ZGODY NA MIKROFON",
  "en": "NO VOICE CHAT · MICROPHONE PERMISSION NOT GRANTED"
 },
 "voice.micDisconnected": {
  "pl": "MIKROFON ODŁĄCZONY",
  "en": "MICROPHONE DISCONNECTED"
 },
 "voice.waitingConsent": {
  "pl": "CZEKAM NA ZGODĘ RYWALA",
  "en": "WAITING FOR OPPONENT’S CONSENT"
 },
 "voice.micBlocked": {
  "pl": "BEZ ROZMOWY · MIKROFON ZABLOKOWANY",
  "en": "NO VOICE CHAT · MICROPHONE BLOCKED"
 },
 "voice.unmuteOpponent": {
  "pl": "Włącz dźwięk przeciwnika",
  "en": "Unmute opponent"
 },
 "voice.muted": {
  "pl": "MIKROFON WYCISZONY",
  "en": "MICROPHONE MUTED"
 },
 "voice.active": {
  "pl": "ROZMOWA AKTYWNA",
  "en": "VOICE CHAT ACTIVE"
 },
 "voice.tapSpeaker": {
  "pl": "DOTKNIJ GŁOŚNIKA",
  "en": "TAP THE SPEAKER"
 },
 "voice.enableAudio": {
  "pl": "Włącz dźwięk rozmowy",
  "en": "Enable voice chat audio"
 },
 "voice.connecting": {
  "pl": "ŁĄCZENIE ROZMOWY",
  "en": "CONNECTING VOICE CHAT"
 },
 "voice.connectionFailed": {
  "pl": "NIE UDAŁO SIĘ POŁĄCZYĆ GŁOSU",
  "en": "COULD NOT CONNECT VOICE CHAT"
 },
 "voice.reconnecting": {
  "pl": "PRZYWRACANIE ROZMOWY",
  "en": "RECONNECTING VOICE CHAT"
 },
 "voice.interrupted": {
  "pl": "ROZMOWA PRZERWANA",
  "en": "VOICE CHAT INTERRUPTED"
 },
 "voice.chatConnectionFailed": {
  "pl": "NIE UDAŁO SIĘ POŁĄCZYĆ ROZMOWY",
  "en": "COULD NOT CONNECT VOICE CHAT"
 },
 "voice.unavailable": {
  "pl": "ROZMOWA NIEDOSTĘPNA",
  "en": "VOICE CHAT UNAVAILABLE"
 },
 "voice.opponentDeclined": {
  "pl": "RYWAL GRA BEZ ROZMOWY",
  "en": "OPPONENT IS PLAYING WITHOUT VOICE CHAT"
 },
 "voice.ended": {
  "pl": "ROZMOWA ZAKOŃCZONA",
  "en": "VOICE CHAT ENDED"
 },
 "voice.unmuteMic": {
  "pl": "Włącz mikrofon",
  "en": "Unmute microphone"
 },
 "code.close": {
  "pl": "Zamknij wpisywanie kodu",
  "en": "Close code entry"
 },
 "code.deleteLast": {
  "pl": "Usuń ostatni znak",
  "en": "Delete last character"
 },
 "code.clear": {
  "pl": "WYCZYŚĆ",
  "en": "CLEAR"
 },
 "code.next": {
  "pl": "DALEJ →",
  "en": "CONTINUE →"
 },
 "header.section": {
  "pl": "BRAXHORN · {section}",
  "en": "BRAXHORN · {section}"
 },
 "identity.avatarName": {
  "pl": "Awatar gracza {name}",
  "en": "Player avatar: {name}"
 },
 "ranking.resultRejected": {
  "pl": "Wynik nie został przyjęty: {error}",
  "en": "Result rejected: {error}"
 },
 "ranking.resultPending": {
  "pl": "Wynik czeka na zapis online. {error}",
  "en": "Result is waiting to be saved online. {error}"
 },
 "ranking.matchNotConnected": {
  "pl": "Ta walka nie jest połączona z rankingiem. {error}",
  "en": "This match is not connected to rankings. {error}"
 },
 "ranking.winCount": {
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
 "ranking.roundAdvantage": {
  "pl": {
   "one": "Przewaga {count} rundy",
   "few": "Przewaga {count} rund",
   "many": "Przewaga {count} rund",
   "other": "Przewaga {count} rundy"
  },
  "en": {
   "one": "{count}-round lead",
   "other": "{count}-round lead"
  }
 },
 "ranking.resultTournament": {
  "pl": "{count} wygr. · {status}",
  "en": {"one":"{count} win · {status}","other":"{count} wins · {status}"}
 },
 "ranking.note": {
  "pl": "TOP 100 · {status} · Przy remisie wygrywa krótszy czas.",
  "en": "TOP 100 · {status} · Ties are decided by the shorter time."
 },
 "ranking.rank": {
  "pl": "TWOJE MIEJSCE #{rank}",
  "en": "YOUR RANK #{rank}"
 },
 "ranking.rankLabel": {
  "pl": "Miejsce {rank}",
  "en": "Rank {rank}"
 },
 "multiplayer.selectNamedFighter": {
  "pl": "Wybierz zawodnika: {name}",
  "en": "Select fighter: {name}"
 },
 "multiplayer.chooseNamedFighter": {
  "pl": "Wybierz {name}, {style}",
  "en": "Choose {name}, {style}"
 },
 "multiplayer.codeNotice": {
  "pl": "Kod pokoju: {code}",
  "en": "Room code: {code}"
 },
 "multiplayer.scheduledNotice": {
  "pl": "START O {time} · Czekamy na termin i gotowość obu graczy.",
  "en": "STARTS AT {time} · Waiting for the scheduled time and both players to be ready."
 },
 "multiplayer.winner": {
  "pl": "{name} WYGRYWA",
  "en": "{name} WINS"
 },
 "multiplayer.resultRetry": {
  "pl": "Ponawiam zapis wyniku… {error}",
  "en": "Retrying result submission… {error}"
 },
 "code.progress": {
  "pl": "{count} / {length} znaków",
  "en": "{count} / {length} characters"
 },
 "code.lengthLabel": {
  "pl": {
   "one": "Kod: {count} znak",
   "few": "Kod: {count} znaki",
   "many": "Kod: {count} znaków",
   "other": "Kod: {count} znaku"
  },
  "en": {
   "one": "Code: {count} character",
   "other": "Code: {count} characters"
  }
 },
 "code.fullCode": {
  "pl": "Wpisz pełny kod: {count} znaków.",
  "en": "Enter the full code: {count} characters."
 },
 "challenge.best": {
  "pl": "Najlepszy zapisany wynik: {result}",
  "en": "Best saved result: {result}"
 },
 "ranking.pinned": {
  "pl": "#{rank} · {name} · TY",
  "en": "#{rank} · {name} · YOU"
 },
 "voice.statusLabel": {
  "pl": "Rozmowa głosowa: {status}",
  "en": "Voice chat: {status}"
 },
 "tournament.people": {
  "pl": {
   "one": "osoba",
   "few": "osoby",
   "many": "osób",
   "other": "osoby"
  },
  "en": {
   "one": "person",
   "other": "people"
  }
 },
 "tournament.createHelp": {
  "pl": "{zone} · Do 3 rund na walkę.",
  "en": "{zone} · Up to 3 rounds per match."
 },
 "tournament.removeQuestion": {
  "pl": "Usunąć {name} z listy przed losowaniem?",
  "en": "Remove {name} from the list before the draw?"
 },
 "tournament.drawConfirmation": {
  "pl": {
   "one": "{count} uczestnik. Losowanie zamknie zapisy i przypisze zawodników oraz godziny na cały turniej. Pseudonimy i postacie pozostaną zapisane w historii.",
   "few": "{count} uczestników. Losowanie zamknie zapisy i przypisze zawodników oraz godziny na cały turniej. Pseudonimy i postacie pozostaną zapisane w historii.",
   "many": "{count} uczestników. Losowanie zamknie zapisy i przypisze zawodników oraz godziny na cały turniej. Pseudonimy i postacie pozostaną zapisane w historii.",
   "other": "{count} uczestnika. Losowanie zamknie zapisy i przypisze zawodników oraz godziny na cały turniej. Pseudonimy i postacie pozostaną zapisane w historii."
  },
  "en": {
   "one": "{count} participant. Drawing closes registration and assigns fighters and times for the whole tournament. Nicknames and fighters remain saved in history.",
   "other": "{count} participants. Drawing closes registration and assigns fighters and times for the whole tournament. Nicknames and fighters remain saved in history."
  }
 },
 "tournament.inviteCopied": {
  "pl": "Skopiowano osobisty kod dla: {name}",
  "en": "Personal code copied for: {name}"
 },
 "tournament.inviteCode": {
  "pl": "Kod dla {name}: {code}",
  "en": "Code for {name}: {code}"
 },
 "tournament.shareCopied": {
  "pl": "Link do zapisów skopiowany. Kod turnieju: {code}",
  "en": "Registration link copied. Tournament code: {code}"
 },
 "tournament.shareCode": {
  "pl": "Kod turnieju: {code}",
  "en": "Tournament code: {code}"
 },
 "tournament.cancelledCount": {
  "pl": {
   "one": "ODWOŁANE TURNIEJE ({count})",
   "few": "ODWOŁANE TURNIEJE ({count})",
   "many": "ODWOŁANE TURNIEJE ({count})",
   "other": "ODWOŁANE TURNIEJE ({count})"
  },
  "en": {
   "one": "CANCELLED TOURNAMENT ({count})",
   "other": "CANCELLED TOURNAMENTS ({count})"
  }
 },
 "tournament.byeCount": {
  "pl": {
   "one": "{count} WOLNY LOS · ZOBACZ",
   "few": "{count} WOLNE LOSY · ZOBACZ",
   "many": "{count} WOLNYCH LOSÓW · ZOBACZ",
   "other": "{count} WOLNEGO LOSU · ZOBACZ"
  },
  "en": {
   "one": "{count} BYE · VIEW",
   "other": "{count} BYES · VIEW"
  }
 },
 "tournament.participantCapacity": {
  "pl": {
   "one": "{count} / {capacity} UCZESTNIK",
   "few": "{count} / {capacity} UCZESTNIKÓW",
   "many": "{count} / {capacity} UCZESTNIKÓW",
   "other": "{count} / {capacity} UCZESTNIKA"
  },
  "en": {
   "one": "{count} / {capacity} PARTICIPANT",
   "other": "{count} / {capacity} PARTICIPANTS"
  }
 },
 "tournament.intervalMinutes": {
  "pl": "CO {count} MIN",
  "en": "EVERY {count} MIN"
 },
 "tournament.countdown": {
  "pl": "START ZA {hours}h {minutes}m {seconds}s",
  "en": "STARTS IN {hours}h {minutes}m {seconds}s"
 },
 "identity.versus": {
  "pl": "VS {name}",
  "en": "VS {name}"
 },
 "history.mode.versus": {
  "pl": "Walka z CPU",
  "en": "CPU match"
 },
 "history.mode.arcade": {
  "pl": "Arcade",
  "en": "Arcade"
 },
 "history.mode.tournament": {
  "pl": "Turniej",
  "en": "Tournament"
 },
 "history.mode.survival": {
  "pl": "Survival",
  "en": "Survival"
 },
 "history.mode.challenge": {
  "pl": "Wyzwanie",
  "en": "Challenge"
 },
 "history.mode.match": {
  "pl": "Walka",
  "en": "Match"
 },
 "multiplayer.name": {
  "pl": "MULTIPLAYER",
  "en": "MULTIPLAYER"
 },
 "multiplayer.label": {
  "pl": "Multiplayer",
  "en": "Multiplayer"
 },
 "multiplayer.brandHeading": {
  "pl": "BRAXHORN · MULTIPLAYER",
  "en": "BRAXHORN · MULTIPLAYER"
 },
 "multiplayer.onlineTransport": {
  "pl": "ONLINE",
  "en": "ONLINE"
 },
 "multiplayer.relayTransport": {
  "pl": "TURN",
  "en": "TURN"
 },
 "online.brandHeading": {
  "pl": "BRAXHORN · ONLINE",
  "en": "BRAXHORN · ONLINE"
 },
 "tournament.brandHeading": {
  "pl": "BRAXHORN · RYWALIZACJA",
  "en": "BRAXHORN · COMPETITION"
 },
 "identity.cpu": {
  "pl": "CPU",
  "en": "CPU"
 },
 "tournament.winnerOf": {
  "pl": "Zwycięzca: {names}",
  "en": "Winner: {names}"
 },
 "tournament.opponentsAt": {
  "pl": "Walka rywali: {date}.",
  "en": "Opponents’ match: {date}."
 },
 "tournament.enterAfterPrevious": {
  "pl": "{info} Wejście po zakończeniu tej walki.",
  "en": "{info} Enter after this match ends."
 },
 "tournament.waitingWithSchedule": {
  "pl": "{info} Twój termin: {date}.",
  "en": "{info} Your scheduled time: {date}."
 },
 "tournament.readyFuture": {
  "pl": "Rywal wyłoniony. Czekamy na wyznaczony termin.",
  "en": "Your opponent has been decided. Waiting for the scheduled time."
 },
 "tournament.readyNow": {
  "pl": "Rywal wyłoniony. Możecie wejść do pokoju walki.",
  "en": "Your opponent has been decided. You can enter the match room."
 }
};
Object.assign(messages,{'tournament.minutes15':{pl:'15 minut',en:'15 minutes'},'tournament.minutes30':{pl:'30 minut',en:'30 minutes'},'tournament.minutes60':{pl:'60 minut',en:'60 minutes'}});
I.register('online',messages);
I.registerLegacy(Object.fromEntries(Object.entries(messages).filter(([,value])=>typeof value.pl==='string').map(([key,value])=>[value.pl,'online.'+key])));

// Bind only text produced by this catalog. Player names, tournament names, user
// reasons and input values are explicitly excluded; language changes never edit them.
const rendered=new Map(),bindings=new Map();
const preserved='#mpChosenPlayer,#mpHostName,#mpGuestName,#mpResultNames,#mpResultIdentities strong,#txProfile,.ui-player-chip span,#txTitle,.ui-history-row strong,.ui-history-row small,.ui-rank-row strong,.tx-event-card>strong,.tx-champion h2,.tx-fighter-row strong,.tx-fighter-row small,.tx-reason,.tx-history p,.tx-opponent-identity';
function remember(value,render){value=String(value??'');if(value.trim()){rendered.set(value,render);if(rendered.size>2048)rendered.delete(rendered.keys().next().value);}return value;}
function t(key,params){return remember(I.t('online.'+key,params),()=>I.t('online.'+key,params));}
function dynamic(render){return remember(render(),render);}
function error(value,fallback='common.error.generic'){const known=rendered.get(String(value?.message??value));return dynamic(()=>known?known():I.error(value,fallback.startsWith('common.')?fallback:'online.'+fallback));}
function bind(root=document){
 const nodes=[];if(root.nodeType===3)nodes.push(root);else if(root.nodeType===1||root.nodeType===9){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())nodes.push(walker.currentNode);}
 for(const node of nodes){if(node.parentElement?.closest(preserved+',script,style,textarea,input,[data-i18n-preserve]'))continue;const value=node.nodeValue,trimmed=value.trim(),render=rendered.get(value)||rendered.get(trimmed);if(render){const prefix=value.slice(0,value.indexOf(trimmed)),suffix=value.slice(value.indexOf(trimmed)+trimmed.length);bindings.set(node,{value,render:()=>prefix+render()+suffix});}else if(bindings.get(node)?.value!==value)bindings.delete(node);}
 const elements=root.nodeType===1?[root,...root.querySelectorAll('*')]:root.querySelectorAll?.('*')||[];
 for(const node of elements)for(const attribute of ['aria-label','title','placeholder','alt']){if(!node.hasAttribute(attribute))continue;const value=node.getAttribute(attribute),render=rendered.get(value);if(render){let key=node.__onlineI18nAttrs;if(!key)key=node.__onlineI18nAttrs={};key[attribute]={value,render};bindings.set(node,{attributes:true});}}
}
function refresh(){for(const [node,binding]of bindings){if(!node.isConnected){bindings.delete(node);continue;}if(binding.attributes){for(const [attribute,b]of Object.entries(node.__onlineI18nAttrs||{})){if(node.getAttribute(attribute)!==b.value)continue;const value=b.render();if(value!==b.value)node.setAttribute(attribute,value);b.value=value;}}else if(node.nodeValue===binding.value){const value=binding.render();node.nodeValue=value;binding.value=value;}}}
I.onChange(refresh);
let scheduled=false,pendingMutations=[];const observer=new MutationObserver(records=>{pendingMutations.push(...records);if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;const changes=pendingMutations;pendingMutations=[];for(const record of changes){if(record.type==='characterData'||record.type==='attributes')bind(record.target);else for(const node of record.addedNodes)bind(node);}for(const node of bindings.keys())if(!node.isConnected)bindings.delete(node);});});observer.observe(document.documentElement,{childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt'],subtree:true});
window.BRAX_ONLINE_I18N={t,error,dynamic,bind,refresh,renderer:value=>rendered.get(String(value))||(()=>String(value??'')),isLegacyMessage:(value,key)=>[messages[key]?.pl,messages[key]?.en].includes(value?.rawMessage||value?.message||value),isMessage:(value,keys)=>keys.some(key=>String(value).startsWith(I.t('online.'+key)))};
})();
