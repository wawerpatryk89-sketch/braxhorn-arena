/* Authored server error and system-event messages. Player and organiser content is data. */
(()=>{'use strict';
 const I=window.BRAX_I18N;
 const messages={
 "unknown_action": {
  "pl": "Nieznane działanie.",
  "en": "Unknown action."
 },
 "request_origin": {
  "pl": "Niedozwolone źródło żądania.",
  "en": "This request origin is not allowed."
 },
 "request_origin_short": {
  "pl": "Niedozwolone źródło.",
  "en": "This request origin is not allowed."
 },
 "request_too_large": {
  "pl": "Zbyt duże żądanie.",
  "en": "The request is too large."
 },
 "data_too_large": {
  "pl": "Za duże dane.",
  "en": "The submitted data is too large."
 },
 "request_invalid": {
  "pl": "Nieprawidłowe dane żądania.",
  "en": "Invalid request data."
 },
 "data_invalid": {
  "pl": "Nieprawidłowe dane.",
  "en": "Invalid data."
 },
 "ranking_unavailable": {
  "pl": "Ranking jest chwilowo niedostępny.",
  "en": "Rankings are temporarily unavailable."
 },
 "ranking_connection": {
  "pl": "Nie udało się połączyć z rankingiem. Spróbuj ponownie.",
  "en": "Could not connect to rankings. Try again."
 },
 "ranking_owner_only": {
  "pl": "Tylko właściciel może oceniać wyniki.",
  "en": "Only the owner can review results."
 },
 "ranking_category": {
  "pl": "Nieznana kategoria.",
  "en": "Unknown ranking category."
 },
 "ranking_decision": {
  "pl": "Nieprawidłowa decyzja.",
  "en": "Invalid review decision."
 },
 "ranking_not_pending": {
  "pl": "Wynik nie oczekuje na ocenę.",
  "en": "This result is not awaiting review."
 },
 "nickname_reserved": {
  "pl": "Pseudonim Wawer jest zarezerwowany dla właściciela. Zaloguj się na konto właściciela lub wybierz inną nazwę.",
  "en": "The nickname Wawer is reserved for the owner. Log in to the owner account or choose another name."
 },
 "nickname_length": {
  "pl": "Wpisz pseudonim od 2 do 20 znaków.",
  "en": "Enter a nickname of 2 to 20 characters."
 },
 "nick_taken_short": {
  "pl": "Ten nick jest już zajęty. Wybierz inny.",
  "en": "This nickname is already taken. Choose another one."
 },
 "ranking_sign_in": {
  "pl": "Zaloguj się, aby zapisywać wyniki w rankingach i wyzwaniach.",
  "en": "Log in to save ranking and challenge results."
 },
 "match_settings": {
  "pl": "Nieprawidłowe ustawienia walki.",
  "en": "Invalid match settings."
 },
 "challenge_unknown": {
  "pl": "Nieznane wyzwanie.",
  "en": "Unknown challenge."
 },
 "challenge_fighter_unsupported": {
  "pl": "Ten zawodnik nie obsługuje techniki wymaganej w wyzwaniu.",
  "en": "This fighter cannot perform the technique required for this challenge."
 },
 "challenge_settings": {
  "pl": "Ustawienia nie odpowiadają wyzwaniu.",
  "en": "These settings do not match the challenge."
 },
 "match_start_rate": {
  "pl": "Zbyt wiele rozpoczętych walk. Poczekaj chwilę.",
  "en": "Too many matches started. Wait a moment."
 },
 "run_changed": {
  "pl": "Seria została zakończona lub zmieniono jej ustawienia.",
  "en": "This run has ended or its settings have changed."
 },
 "run_ended": {
  "pl": "Seria została zakończona.",
  "en": "This run has ended."
 },
 "match_not_found": {
  "pl": "Nie znaleziono rozpoczętej walki.",
  "en": "The started match was not found."
 },
 "run_already_ended": {
  "pl": "Seria jest już zakończona.",
  "en": "This run has already ended."
 },
 "result_validation": {
  "pl": "Wynik nie przeszedł sprawdzenia czasu lub parametrów.",
  "en": "The result failed the time or parameter checks."
 },
 "round_result_invalid": {
  "pl": "Nieprawidłowy wynik rund.",
  "en": "Invalid round result."
 },
 "result_too_fast": {
  "pl": "Wynik jest krótszy niż minimalny czas walki.",
  "en": "The result is faster than the minimum match duration."
 },
 "challenge_inactive": {
  "pl": "Wyzwanie nie jest aktywne.",
  "en": "This challenge is not active."
 },
 "challenge_progress": {
  "pl": "Nieprawidłowy postęp wyzwania.",
  "en": "Invalid challenge progress."
 },
 "challenge_technique_time": {
  "pl": "Nieprawidłowy czas techniki.",
  "en": "Invalid technique duration."
 },
 "challenge_run_short": {
  "pl": "Seria jest za krótka.",
  "en": "This run is too short."
 },
 "challenge_win_required": {
  "pl": "Walka musi zakończyć się wygraną.",
  "en": "You must win the match."
 },
 "challenge_combo_used": {
  "pl": "Użyto COMBO.",
  "en": "A COMBO was used."
 },
 "challenge_health_low": {
  "pl": "Za mało zdrowia.",
  "en": "Not enough health remaining."
 },
 "challenge_time_exceeded": {
  "pl": "Przekroczono czas.",
  "en": "The time limit was exceeded."
 },
 "duel_unavailable": {
  "pl": "Multiplayer chwilowo niedostępny.",
  "en": "Multiplayer is temporarily unavailable."
 },
 "build_mismatch": {
  "pl": "Odśwież grę — inna wersja u przeciwnika",
  "en": "Refresh the game — your opponent is using a different version"
 },
 "fighter_required": {
  "pl": "Wybierz zawodnika.",
  "en": "Choose a fighter."
 },
 "arena_invalid": {
  "pl": "Wybierz poprawną arenę.",
  "en": "Choose a valid arena."
 },
 "room_create_rate": {
  "pl": "Zbyt wiele nowych pokoi. Spróbuj za kilka minut.",
  "en": "Too many rooms created. Try again in a few minutes."
 },
 "room_code_length": {
  "pl": "Kod pokoju ma 8 znaków.",
  "en": "The room code has 8 characters."
 },
 "room_closed": {
  "pl": "Pokój wygasł albo został zamknięty.",
  "en": "This room has expired or been closed."
 },
 "tournament_room_entry": {
  "pl": "Wejdź do tej walki ze swojej drabinki turniejowej.",
  "en": "Enter this match from your tournament bracket."
 },
 "room_same_player": {
  "pl": "Nie możesz walczyć przeciwko własnemu profilowi.",
  "en": "You cannot fight against your own account."
 },
 "room_occupied": {
  "pl": "Pokój jest już zajęty.",
  "en": "This room is already full."
 },
 "room_forbidden": {
  "pl": "Brak dostępu do pokoju.",
  "en": "You do not have access to this room."
 },
 "tournament_player_sign_in": {
  "pl": "Zaloguj się na konto uczestnika tej walki turniejowej.",
  "en": "Log in to the account taking part in this tournament match."
 },
 "match_not_tournament": {
  "pl": "Ta walka nie należy do turnieju.",
  "en": "This match is not part of a tournament."
 },
 "match_score_invalid": {
  "pl": "Nieprawidłowy wynik walki.",
  "en": "Invalid match score."
 },
 "match_not_finished": {
  "pl": "Walka jeszcze się nie zakończyła.",
  "en": "This match has not finished yet."
 },
 "match_snapshot_invalid": {
  "pl": "Nieprawidłowy stan walki.",
  "en": "Invalid match state."
 },
 "match_input_invalid": {
  "pl": "Nieprawidłowe sterowanie.",
  "en": "Invalid control input."
 },
 "match_attempt_inactive": {
  "pl": "Ta próba walki nie jest już aktywna.",
  "en": "This match attempt is no longer active."
 },
 "room_connection": {
  "pl": "Połączenie z pokojem jest chwilowo niedostępne.",
  "en": "The room connection is temporarily unavailable."
 },
 "tournament_schedule_order": {
  "pl": "Termin musi przypadać po wcześniejszych walkach z zachowaniem odstępu.",
  "en": "This time must follow the earlier matches and preserve the interval."
 },
 "tournament_winner_invalid": {
  "pl": "Zwycięzca musi być uczestnikiem tej walki.",
  "en": "The winner must be a participant in this match."
 },
 "tournament_unavailable": {
  "pl": "Turnieje są chwilowo niedostępne.",
  "en": "Tournaments are temporarily unavailable."
 },
 "tournament_sign_in": {
  "pl": "Zaloguj się, aby uczestniczyć w turniejach.",
  "en": "Log in to take part in tournaments."
 },
 "tournament_owner_only": {
  "pl": "Tylko Wawer po zalogowaniu na konto właściciela może organizować turnieje.",
  "en": "Only Wawer can organise tournaments while logged in to the owner account."
 },
 "tournament_name_length": {
  "pl": "Nazwa turnieju: od 3 do 60 znaków.",
  "en": "The tournament name must have 3 to 60 characters."
 },
 "tournament_settings": {
  "pl": "Ustaw 4–10 miejsc, przyszły termin i tryb bez przerw albo odstęp 15, 30 lub 60 minut.",
  "en": "Choose 4–10 places, a future start time, and no interval or an interval of 15, 30 or 60 minutes."
 },
 "timezone_invalid": {
  "pl": "Nieprawidłowa strefa czasowa.",
  "en": "Invalid time zone."
 },
 "tournament_limit": {
  "pl": "Możesz prowadzić maksymalnie 5 aktywnych turniejów.",
  "en": "You can run up to 5 active tournaments."
 },
 "invite_code_length": {
  "pl": "Osobisty kod uczestnika ma 16 znaków.",
  "en": "A participant's personal code has 16 characters."
 },
 "invite_invalid": {
  "pl": "Kod jest nieprawidłowy albo został już wykorzystany.",
  "en": "This code is invalid or has already been used."
 },
 "tournament_finished": {
  "pl": "Ten turniej jest już zakończony.",
  "en": "This tournament has already ended."
 },
 "tournament_already_registered": {
  "pl": "Masz już swoje miejsce w tym turnieju.",
  "en": "You already have a place in this tournament."
 },
 "invite_used": {
  "pl": "Kod został już wykorzystany.",
  "en": "This code has already been used."
 },
 "tournament_code_length": {
  "pl": "Kod turnieju ma 8 znaków.",
  "en": "The tournament code has 8 characters."
 },
 "tournament_not_found": {
  "pl": "Nie znaleziono turnieju.",
  "en": "Tournament not found."
 },
 "participant_name_invalid": {
  "pl": "Podaj pseudonim uczestnika: 2–20 znaków. WAWER jest zarezerwowany.",
  "en": "Enter a participant nickname of 2–20 characters. WAWER is reserved."
 },
 "participant_fighter_required": {
  "pl": "Wybierz zawodnika dla uczestnika.",
  "en": "Choose a fighter for this participant."
 },
 "tournament_registration_closed": {
  "pl": "Zapisy są zamknięte albo brak wolnych miejsc.",
  "en": "Registration is closed or no places are available."
 },
 "participant_remove_locked": {
  "pl": "Nie można usunąć tego zgłoszenia po losowaniu.",
  "en": "This entry cannot be removed after the draw."
 },
 "tournament_registration_full": {
  "pl": "Zapisy są zamknięte albo wszystkie miejsca są zajęte.",
  "en": "Registration is closed or all places are taken."
 },
 "tournament_bracket_exists": {
  "pl": "Drabinka została już utworzona.",
  "en": "The bracket has already been created."
 },
 "tournament_draw_minimum": {
  "pl": "Do losowania potrzebujesz co najmniej 4 uczestników.",
  "en": "You need at least 4 participants for the draw."
 },
 "tournament_future_start": {
  "pl": "Ustaw przyszłą godzinę pierwszej walki przed losowaniem.",
  "en": "Set a future time for the first match before the draw."
 },
 "tournament_draw_conflict": {
  "pl": "Lista uczestników zmieniła się lub drabinka już istnieje. Odśwież turniej.",
  "en": "The participant list changed or the bracket already exists. Refresh the tournament."
 },
 "future_time_required": {
  "pl": "Wybierz przyszły termin.",
  "en": "Choose a future time."
 },
 "match_reschedule_started": {
  "pl": "Można przełożyć wyłącznie nierozpoczętą walkę.",
  "en": "Only a match that has not started can be rescheduled."
 },
 "tournament_not_running": {
  "pl": "Turniej nie jest w trakcie rozgrywania.",
  "en": "This tournament is not currently running."
 },
 "match_not_ready": {
  "pl": "Ta walka nie jest gotowa do rozpoczęcia.",
  "en": "This match is not ready to start."
 },
 "match_other_pair": {
  "pl": "Ta walka jest przeznaczona dla innej pary zawodników.",
  "en": "This match belongs to a different pair of players."
 },
 "room_opens_before_match": {
  "pl": "Pokój otworzy się 10 minut przed walką.",
  "en": "The room opens 10 minutes before the match."
 },
 "match_schedule_expired": {
  "pl": "Termin minął. Poproś organizatora o nową godzinę.",
  "en": "The scheduled time has passed. Ask the organiser for a new time."
 },
 "match_already_started": {
  "pl": "Ta próba walki już się rozpoczęła. Po utracie sesji organizator może zarządzić powtórkę.",
  "en": "This match attempt has already started. If a session is lost, the organiser can arrange a replay."
 },
 "tournament_inactive": {
  "pl": "Turniej nie jest aktywny.",
  "en": "This tournament is not active."
 },
 "match_change_forbidden": {
  "pl": "Nie można zmienić tej walki.",
  "en": "This match cannot be changed."
 },
 "reason_length": {
  "pl": "Podaj uzasadnienie od 5 do 300 znaków.",
  "en": "Enter a reason of 5 to 300 characters."
 },
 "replay_time_required": {
  "pl": "Ustaw termin powtórki.",
  "en": "Set a time for the replay."
 },
 "participant_required": {
  "pl": "Wybierz uczestnika tej walki.",
  "en": "Choose a participant in this match."
 },
 "tournament_already_finished": {
  "pl": "Turniej został już zakończony.",
  "en": "This tournament has already ended."
 },
 "tournament_save": {
  "pl": "Nie udało się zapisać turnieju. Spróbuj ponownie.",
  "en": "The tournament could not be saved. Try again."
 },
 "room_invalid": {
  "pl": "Nieprawidłowy pokój.",
  "en": "Invalid room."
 },
 "account_upload_too_large": {
  "pl": "Przesyłany plik lub formularz jest zbyt duży.",
  "en": "The uploaded file or form is too large."
 },
 "account_form_format": {
  "pl": "Nieprawidłowy format formularza.",
  "en": "Invalid form format."
 },
 "account_form_invalid": {
  "pl": "Nieprawidłowe dane formularza.",
  "en": "Invalid form data."
 },
 "rate_limit": {
  "pl": "Zbyt wiele prób. Poczekaj 15 minut i spróbuj ponownie.",
  "en": "Too many attempts. Wait 15 minutes and try again."
 },
 "account_unavailable": {
  "pl": "Konta są chwilowo niedostępne. Spróbuj ponownie.",
  "en": "Accounts are temporarily unavailable. Try again."
 },
 "account_avatar_sign_in": {
  "pl": "Zaloguj się, aby zmienić awatar.",
  "en": "Log in to change your avatar."
 },
 "account_photo_save": {
  "pl": "Nie udało się zapisać zdjęcia. Spróbuj ponownie.",
  "en": "The photo could not be saved. Try again."
 },
 "account_photo_format": {
  "pl": "Wybierz poprawny obraz JPEG, PNG lub WebP.",
  "en": "Choose a valid JPEG, PNG or WebP image."
 },
 "account_photo_dimensions": {
  "pl": "Zatwierdź kadr zdjęcia o rozmiarze od 64 do 1024 pikseli.",
  "en": "Confirm a photo crop between 64 and 1024 pixels in size."
 },
 "invalid_language": {
  "pl": "Wybierz język polski lub angielski.",
  "en": "Choose Polish or English."
 },
 "account_nickname_invalid": {
  "pl": "Nick musi mieć od 2 do 20 znaków: litery, cyfry, spacje, kropki, podkreślenia lub myślniki.",
  "en": "Your nickname must have 2 to 20 characters: letters, digits, spaces, full stops, underscores or hyphens."
 },
 "account_password_length": {
  "pl": "Hasło musi mieć od 8 do 128 znaków.",
  "en": "Your password must have 8 to 128 characters."
 },
 "account_avatar_required": {
  "pl": "Wybierz gotowy awatar lub przygotuj własne zdjęcie.",
  "en": "Choose a preset avatar or prepare your own photo."
 },
 "nick_taken": {
  "pl": "Ten nick jest już zajęty. Wybierz inny lub zaloguj się na istniejące konto.",
  "en": "This nickname is already taken. Choose another one or log in to your existing account."
 },
 "invalid_credentials": {
  "pl": "Nieprawidłowy nick lub hasło.",
  "en": "Incorrect nickname or password."
 },
 "legacy_login_required": {
  "pl": "Zaloguj się przez dotychczasowe konto ChatGPT.",
  "en": "Log in through your existing ChatGPT account."
 },
 "authentication_required": {
  "pl": "Zaloguj się, aby zapisać język.",
  "en": "Log in to save your language."
 },
 "account_avatar_invalid": {
  "pl": "Wybierz dostępny awatar.",
  "en": "Choose an available avatar."
 },
 "account_password_sign_in": {
  "pl": "Zaloguj się, aby ustawić hasło.",
  "en": "Log in to set a password."
 },
 "account_current_password": {
  "pl": "Aktualne hasło jest nieprawidłowe.",
  "en": "Your current password is incorrect."
 },
 "account_nickname_before_password": {
  "pl": "Ustaw poprawny nick w profilu przed dodaniem hasła.",
  "en": "Set a valid profile nickname before adding a password."
 },
 "account_legacy_nickname_taken": {
  "pl": "Ten nick jest używany przez inne starsze konto. Zmień nick przed dodaniem hasła.",
  "en": "Another older account uses this nickname. Change it before adding a password."
 },
 "account_save": {
  "pl": "Nie udało się zapisać danych konta. Spróbuj ponownie.",
  "en": "Your account data could not be saved. Try again."
 },
 "relay_not_configured": {
  "pl": "Połączenie zapasowe nie jest skonfigurowane.",
  "en": "The relay connection is not configured."
 },
 "relay_unavailable": {
  "pl": "Połączenie zapasowe jest chwilowo niedostępne.",
  "en": "The relay connection is temporarily unavailable."
 },
 "system.match_interrupted": {
  "pl": "Walka przerwana. Organizator może zarządzić powtórkę lub rozstrzygnąć wynik.",
  "en": "The match was interrupted. The organiser can arrange a replay or decide the result."
 },
 "system.result_review_requested": {
  "pl": "Gracz zgłosił brak potwierdzenia lub problem z wynikiem.",
  "en": "A player reported a missing confirmation or a problem with the result."
 },
 "system.results_disagree": {
  "pl": "Niezgodne wyniki. Potrzebna decyzja organizatora.",
  "en": "The results do not match. The organiser must make a decision."
 },
 "system.match_draw": {
  "pl": "Remis. Organizator wyznaczy powtórkę.",
  "en": "Draw. The organiser will arrange a replay."
 },
 "system.result_confirmed": {
  "pl": "Wynik potwierdzony przez oba połączenia.",
  "en": "The result was confirmed by both connections."
 },
 "system.registration_opened": {
  "pl": "Otwarto zapisy.",
  "en": "Registration opened."
 },
 "system.participant_added": {
  "pl": "Dodano uczestnika: {name}",
  "en": "Participant added: {name}"
 },
 "system.participant_removed": {
  "pl": "Usunięto zgłoszenie przed losowaniem.",
  "en": "An entry was removed before the draw."
 },
 "system.bracket_drawn": {
  "pl": "Zamknięto zapisy i wylosowano drabinkę.",
  "en": "Registration closed and the bracket was drawn."
 },
 "system.schedule_changed": {
  "pl": "Zmieniono terminarz. Gracze widzą nowe godziny w panelu.",
  "en": "The schedule was changed. Players can see the new times in the tournament panel."
 },
 "system.schedule_reason": {
  "pl": "Zmieniono terminarz. {reason}",
  "en": "The schedule was changed. {reason}"
 },
 "system.tournament_deleted": {
  "pl": "Organizator usunął turniej z listy.",
  "en": "The organiser removed the tournament from the list."
 },
 "system.tournament_cancelled": {
  "pl": "Organizator odwołał turniej.",
  "en": "The organiser cancelled the tournament."
 }
};
 I.register('errors',messages);
 I.registerErrors(Object.fromEntries(Object.keys(messages).map(code=>[code,'errors.'+code])));
 I.registerLegacy(Object.fromEntries(Object.entries(messages).filter(([,message])=>!message.pl.includes('{')).map(([code,message])=>[message.pl,'errors.'+code])));
})();
