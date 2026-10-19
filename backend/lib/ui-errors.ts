/** Canonical legacy Polish fallbacks plus stable language-neutral API message codes. */
export const UI_MESSAGES:Record<string,string>={
 "unknown_action": "Nieznane działanie.",
 "request_origin": "Niedozwolone źródło żądania.",
 "request_origin_short": "Niedozwolone źródło.",
 "request_too_large": "Zbyt duże żądanie.",
 "data_too_large": "Za duże dane.",
 "request_invalid": "Nieprawidłowe dane żądania.",
 "data_invalid": "Nieprawidłowe dane.",
 "ranking_unavailable": "Ranking jest chwilowo niedostępny.",
 "ranking_connection": "Nie udało się połączyć z rankingiem. Spróbuj ponownie.",
 "ranking_owner_only": "Tylko właściciel może oceniać wyniki.",
 "ranking_category": "Nieznana kategoria.",
 "ranking_decision": "Nieprawidłowa decyzja.",
 "ranking_not_pending": "Wynik nie oczekuje na ocenę.",
 "nickname_reserved": "Pseudonim Wawer jest zarezerwowany dla właściciela. Zaloguj się na konto właściciela lub wybierz inną nazwę.",
 "nickname_length": "Wpisz pseudonim od 2 do 20 znaków.",
 "nick_taken_short": "Ten nick jest już zajęty. Wybierz inny.",
 "ranking_sign_in": "Zaloguj się, aby zapisywać wyniki w rankingach i wyzwaniach.",
 "match_settings": "Nieprawidłowe ustawienia walki.",
 "challenge_unknown": "Nieznane wyzwanie.",
 "challenge_fighter_unsupported": "Ten zawodnik nie obsługuje techniki wymaganej w wyzwaniu.",
 "challenge_settings": "Ustawienia nie odpowiadają wyzwaniu.",
 "match_start_rate": "Zbyt wiele rozpoczętych walk. Poczekaj chwilę.",
 "run_changed": "Seria została zakończona lub zmieniono jej ustawienia.",
 "run_ended": "Seria została zakończona.",
 "match_not_found": "Nie znaleziono rozpoczętej walki.",
 "run_already_ended": "Seria jest już zakończona.",
 "result_validation": "Wynik nie przeszedł sprawdzenia czasu lub parametrów.",
 "round_result_invalid": "Nieprawidłowy wynik rund.",
 "result_too_fast": "Wynik jest krótszy niż minimalny czas walki.",
 "challenge_inactive": "Wyzwanie nie jest aktywne.",
 "challenge_progress": "Nieprawidłowy postęp wyzwania.",
 "challenge_technique_time": "Nieprawidłowy czas techniki.",
 "challenge_run_short": "Seria jest za krótka.",
 "challenge_win_required": "Walka musi zakończyć się wygraną.",
 "challenge_combo_used": "Użyto COMBO.",
 "challenge_health_low": "Za mało zdrowia.",
 "challenge_time_exceeded": "Przekroczono czas.",
 "duel_unavailable": "Multiplayer chwilowo niedostępny.",
 "build_mismatch": "Odśwież grę — inna wersja u przeciwnika",
 "fighter_required": "Wybierz zawodnika.",
 "arena_invalid": "Wybierz poprawną arenę.",
 "room_create_rate": "Zbyt wiele nowych pokoi. Spróbuj za kilka minut.",
 "room_code_length": "Kod pokoju ma 8 znaków.",
 "room_closed": "Pokój wygasł albo został zamknięty.",
 "tournament_room_entry": "Wejdź do tej walki ze swojej drabinki turniejowej.",
 "room_same_player": "Nie możesz walczyć przeciwko własnemu profilowi.",
 "room_occupied": "Pokój jest już zajęty.",
 "room_forbidden": "Brak dostępu do pokoju.",
 "tournament_player_sign_in": "Zaloguj się na konto uczestnika tej walki turniejowej.",
 "match_not_tournament": "Ta walka nie należy do turnieju.",
 "match_score_invalid": "Nieprawidłowy wynik walki.",
 "match_not_finished": "Walka jeszcze się nie zakończyła.",
 "match_snapshot_invalid": "Nieprawidłowy stan walki.",
 "match_input_invalid": "Nieprawidłowe sterowanie.",
 "match_attempt_inactive": "Ta próba walki nie jest już aktywna.",
 "room_connection": "Połączenie z pokojem jest chwilowo niedostępne.",
 "tournament_schedule_order": "Termin musi przypadać po wcześniejszych walkach z zachowaniem odstępu.",
 "tournament_winner_invalid": "Zwycięzca musi być uczestnikiem tej walki.",
 "tournament_unavailable": "Turnieje są chwilowo niedostępne.",
 "tournament_sign_in": "Zaloguj się, aby uczestniczyć w turniejach.",
 "tournament_owner_only": "Tylko Wawer po zalogowaniu na konto właściciela może organizować turnieje.",
 "tournament_name_length": "Nazwa turnieju: od 3 do 60 znaków.",
 "tournament_settings": "Ustaw 4–10 miejsc, przyszły termin i tryb bez przerw albo odstęp 15, 30 lub 60 minut.",
 "timezone_invalid": "Nieprawidłowa strefa czasowa.",
 "tournament_limit": "Możesz prowadzić maksymalnie 5 aktywnych turniejów.",
 "invite_code_length": "Osobisty kod uczestnika ma 16 znaków.",
 "invite_invalid": "Kod jest nieprawidłowy albo został już wykorzystany.",
 "tournament_finished": "Ten turniej jest już zakończony.",
 "tournament_already_registered": "Masz już swoje miejsce w tym turnieju.",
 "invite_used": "Kod został już wykorzystany.",
 "tournament_code_length": "Kod turnieju ma 8 znaków.",
 "tournament_not_found": "Nie znaleziono turnieju.",
 "participant_name_invalid": "Podaj pseudonim uczestnika: 2–20 znaków. WAWER jest zarezerwowany.",
 "participant_fighter_required": "Wybierz zawodnika dla uczestnika.",
 "tournament_registration_closed": "Zapisy są zamknięte albo brak wolnych miejsc.",
 "participant_remove_locked": "Nie można usunąć tego zgłoszenia po losowaniu.",
 "tournament_registration_full": "Zapisy są zamknięte albo wszystkie miejsca są zajęte.",
 "tournament_bracket_exists": "Drabinka została już utworzona.",
 "tournament_draw_minimum": "Do losowania potrzebujesz co najmniej 4 uczestników.",
 "tournament_future_start": "Ustaw przyszłą godzinę pierwszej walki przed losowaniem.",
 "tournament_draw_conflict": "Lista uczestników zmieniła się lub drabinka już istnieje. Odśwież turniej.",
 "future_time_required": "Wybierz przyszły termin.",
 "match_reschedule_started": "Można przełożyć wyłącznie nierozpoczętą walkę.",
 "tournament_not_running": "Turniej nie jest w trakcie rozgrywania.",
 "match_not_ready": "Ta walka nie jest gotowa do rozpoczęcia.",
 "match_other_pair": "Ta walka jest przeznaczona dla innej pary zawodników.",
 "room_opens_before_match": "Pokój otworzy się 10 minut przed walką.",
 "match_schedule_expired": "Termin minął. Poproś organizatora o nową godzinę.",
 "match_already_started": "Ta próba walki już się rozpoczęła. Po utracie sesji organizator może zarządzić powtórkę.",
 "tournament_inactive": "Turniej nie jest aktywny.",
 "match_change_forbidden": "Nie można zmienić tej walki.",
 "reason_length": "Podaj uzasadnienie od 5 do 300 znaków.",
 "replay_time_required": "Ustaw termin powtórki.",
 "participant_required": "Wybierz uczestnika tej walki.",
 "tournament_already_finished": "Turniej został już zakończony.",
 "tournament_save": "Nie udało się zapisać turnieju. Spróbuj ponownie.",
 "room_invalid": "Nieprawidłowy pokój.",
 "account_upload_too_large": "Przesyłany plik lub formularz jest zbyt duży.",
 "account_form_format": "Nieprawidłowy format formularza.",
 "account_form_invalid": "Nieprawidłowe dane formularza.",
 "rate_limit": "Zbyt wiele prób. Poczekaj 15 minut i spróbuj ponownie.",
 "account_unavailable": "Konta są chwilowo niedostępne. Spróbuj ponownie.",
 "account_avatar_sign_in": "Zaloguj się, aby zmienić awatar.",
 "account_photo_save": "Nie udało się zapisać zdjęcia. Spróbuj ponownie.",
 "account_photo_format": "Wybierz poprawny obraz JPEG, PNG lub WebP.",
 "account_photo_dimensions": "Zatwierdź kadr zdjęcia o rozmiarze od 64 do 1024 pikseli.",
 "invalid_language": "Wybierz język polski lub angielski.",
 "account_nickname_invalid": "Nick musi mieć od 2 do 20 znaków: litery, cyfry, spacje, kropki, podkreślenia lub myślniki.",
 "account_password_length": "Hasło musi mieć od 8 do 128 znaków.",
 "account_avatar_required": "Wybierz gotowy awatar lub przygotuj własne zdjęcie.",
 "nick_taken": "Ten nick jest już zajęty. Wybierz inny lub zaloguj się na istniejące konto.",
 "invalid_credentials": "Nieprawidłowy nick lub hasło.",
 "legacy_login_required": "Zaloguj się przez dotychczasowe konto ChatGPT.",
 "authentication_required": "Zaloguj się, aby zapisać język.",
 "account_avatar_invalid": "Wybierz dostępny awatar.",
 "account_password_sign_in": "Zaloguj się, aby ustawić hasło.",
 "account_current_password": "Aktualne hasło jest nieprawidłowe.",
 "account_nickname_before_password": "Ustaw poprawny nick w profilu przed dodaniem hasła.",
 "account_legacy_nickname_taken": "Ten nick jest używany przez inne starsze konto. Zmień nick przed dodaniem hasła.",
 "account_save": "Nie udało się zapisać danych konta. Spróbuj ponownie.",
 "relay_not_configured": "Połączenie zapasowe nie jest skonfigurowane.",
 "relay_unavailable": "Połączenie zapasowe jest chwilowo niedostępne.",
 "system.match_interrupted": "Walka przerwana. Organizator może zarządzić powtórkę lub rozstrzygnąć wynik.",
 "system.result_review_requested": "Gracz zgłosił brak potwierdzenia lub problem z wynikiem.",
 "system.results_disagree": "Niezgodne wyniki. Potrzebna decyzja organizatora.",
 "system.match_draw": "Remis. Organizator wyznaczy powtórkę.",
 "system.result_confirmed": "Wynik potwierdzony przez oba połączenia.",
 "system.registration_opened": "Otwarto zapisy.",
 "system.participant_added": "Dodano uczestnika: {name}",
 "system.participant_removed": "Usunięto zgłoszenie przed losowaniem.",
 "system.bracket_drawn": "Zamknięto zapisy i wylosowano drabinkę.",
 "system.schedule_changed": "Zmieniono terminarz. Gracze widzą nowe godziny w panelu.",
 "system.schedule_reason": "Zmieniono terminarz. {reason}",
 "system.tournament_deleted": "Organizator usunął turniej z listy.",
 "system.tournament_cancelled": "Organizator odwołał turniej."
};
export type MessageParams=Record<string,string|number|boolean|null>;
const reverse=new Map(Object.entries(UI_MESSAGES).map(([code,message])=>[message,code]));
export function uiMessage(code:string,params:MessageParams={}){
 return (UI_MESSAGES[code]||UI_MESSAGES.unknown_action).replace(/\{([\w.]+)\}/g,(_all,name)=>Object.prototype.hasOwnProperty.call(params,name)?String(params[name]??''):'');
}
export function uiFailure(code:string,status=400,params:MessageParams={}){
 return Object.assign(new Error(uiMessage(code,params)),{status,code,params});
}
export function uiErrorBody(error:any,fallbackCode:string){
 const known=error?.status&&(error.code&&UI_MESSAGES[error.code]?error.code:reverse.get(String(error.message||'')));
 const code=known||fallbackCode,params=known&&error.params&&typeof error.params==='object'?error.params:{};
 return {error:known?String(error.message||uiMessage(code,params)):uiMessage(code),code,params};
}
const MESSAGE_PREFIX='\u001fBRAX_MESSAGE_1:';
export function systemMessage(code:string,params:MessageParams={}){
 if(!code.startsWith('system.')||!UI_MESSAGES[code])throw new Error('Unknown system message code');
 return MESSAGE_PREFIX+JSON.stringify({code,params});
}
export function literalMessage(value:string){return MESSAGE_PREFIX+JSON.stringify({literal:String(value)});}
function unpackMessage(value:any):any{
 if(typeof value!=='string'||!value.startsWith(MESSAGE_PREFIX))return null;
 try{const parsed=JSON.parse(value.slice(MESSAGE_PREFIX.length));if(typeof parsed.literal==='string')return {literal:parsed.literal};if(typeof parsed.code==='string'&&parsed.code.startsWith('system.')&&UI_MESSAGES[parsed.code]&&parsed.params&&typeof parsed.params==='object'&&!Array.isArray(parsed.params)&&Object.values(parsed.params).every(v=>v===null||['string','number','boolean'].includes(typeof v)))return parsed;}catch{}return null;
}
/** Decode only explicit system records or a caller-proven legacy system value. */
export function messageFields(value:any,field:string,legacySystem=false):Record<string,any>{
 const raw=String(value??''),parsed=unpackMessage(raw);
 if(parsed&&'literal' in parsed)return {[field]:parsed.literal};
 const code=parsed?.code||(legacySystem?reverse.get(raw):null),params=parsed?.params||{};
 if(code?.startsWith('system.'))return {[field]:uiMessage(code,params),[field+'Code']:code,[field+'Params']:params};
 return {[field]:value};
}
export function historyFields(event:any){
 const {actor,...safe}=event,raw=String(event.detail??'');
 if(unpackMessage(raw))return {...safe,...messageFields(raw,'detail')};
 // These event actions were always authored by the server. Names/reasons remain parameters.
 const legacy:Record<string,string>={create:'system.registration_opened',remove:'system.participant_removed',draw:'system.bracket_drawn',delete:'system.tournament_deleted',cancel:'system.tournament_cancelled'};
 let code=legacy[event.action],params:MessageParams={};
 if(event.action==='invite'&&raw.startsWith('Dodano uczestnika: ')){code='system.participant_added';params={name:raw.slice('Dodano uczestnika: '.length)};}
 if(event.action==='schedule'&&raw.startsWith('Zmieniono terminarz. ')){const reason=raw.slice('Zmieniono terminarz. '.length);code=reason==='Gracze widzą nowe godziny w panelu.'?'system.schedule_changed':'system.schedule_reason';params=code==='system.schedule_reason'?{reason}:{};}
 if(event.action==='result'&&actor==='system'){const exact=reverse.get(raw);if(exact?.startsWith('system.'))code=exact;}
 if(code)return {...safe,detail:raw,detailCode:code,detailParams:params};
 return safe;
}
