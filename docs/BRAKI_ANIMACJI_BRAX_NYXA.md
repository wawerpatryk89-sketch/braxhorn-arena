# Brax i Nyxa — braki animacji

Stan po sprawdzeniu oryginalnych paczek FBX, dodatkowego tańca i mastera produkcyjnego V2.3. Obecność nazwy akcji w kodzie nie oznacza, że dostarczono właściwy ruch. Nie trzeba ponownie tworzyć ani przesyłać modeli.

## Najpierw: podstawy płynności — osobno dla każdego modelu

1. Pełna garda bojowa / idle: naturalne przenoszenie ciężaru, ugięcia kolan, oddech, dłonie w gardzie, pętla 1,8–2,4 s, bez przesuwania całej postaci. Aktualna garda jest pętlą krótkiego fragmentu innej animacji. Brax ma być ciężki i stabilny, Nyxa spokojna i techniczna — zgodnie z masterem, bez przesadnego podskakiwania.
2. Brax: chód bojowy do przodu. W paczce jest tylko Step Backward; obecny ruch do przodu używa tego samego kroku wstecz, co jest rozwiązaniem zastępczym.
3. Nyxa: chód do przodu w gardzie. Walking jest dostarczony, ale nie jest dedykowanym chodem bojowym. Kroki wstecz są już dostarczone dla obu postaci.

## Powalenie i zakończenie walki — brak dla obu

- Utrata równowagi / początek upadku po mocnym ciosie.
- Lądowanie na podłożu.
- Leżenie / stan down.
- Wstawanie do gardy.
- Upadek KO i pozostanie na ziemi bez wstawania.
- Odlot po ciężkiej kontrze / finisherze oraz zgodne przejście do lądowania, jeśli ma działać efekt z mastera.

Upadek, lądowanie i wstawanie można dostarczyć jako jeden spójny klip z wyraźnymi fazami; w grze zostaną rozdzielone na stany. KO wymaga wariantu kończącego się na ziemi. Reakcja HIT_BODY nie jest animacją upadku i nie powinna jej zastępować.

## Reakcje na trafienia i obrona

Brax: brakuje rzeczywistych reakcji na głowę, korpus i nogę oraz lekkiego/średniego/mocnego zachwiania. HIT_BODY obecnie używa Center Block — to blok, a nie przyjęcie ciosu.

Nyxa: Head Hit, Head Hit (2) i Zombie Reaction Hit są dostarczone. To nie jest kompletny zestaw reakcji R1/R2/R3 na wszystkie strefy, zwłaszcza nogi. Nie zamawiać ponownie istniejących plików bez oceny, czego konkretnie nie pokrywają.

Oboje: prawidłowy niski blok, przyjęcie ciosu na blok, odepchnięcie z krokiem ratunkowym. Nyxa potrzebuje właściwej animacji wysokiego bloku: obecna poza pochodzi z pierwszej klatki Body Jab Cross. Brax ma dwa Center Block, ale przypisanie jednego jako niskiego bloku nie czyni go blokiem nóg.

Uniki: Brax nie ma dedykowanych slip/pullback/weave; Step Backward służy obecnie jako zastępstwo. Nyxa ma Dodging i Ducking, ale pełna zgodność slip/roll/pullback/check low kick z masterem wymaga dopasowania konkretnych klipów.

## Klincz — ruchy pary, nie sam atak

Dla obu modeli potrzebne są: próba chwytu, nieudany chwyt, utrzymanie klinczu, zerwanie/rozdzielenie, odepchnięcie i reakcja odpychanego.

- Brax: przechwyt ramienia i przewalenie na bok + zsynchronizowany upadek drugiej postaci.
- Nyxa: kontrola karku/ramion, kolano i puszczenie; alternatywnie techniczne podcięcie + zsynchronizowana reakcja ofiary.

Illegal Knee jest dostarczone dla Nyxy, lecz samo kolano nie jest kompletnym klinczem. Klip atakującego i reakcja obrońcy muszą mieć zgodny kontakt dłoni, moment puszczenia i lądowania.

## Ciosy i kombinacje z mastera

Dostarczone animacje są animacjami Mixamo, ale ich zestaw nie odtwarza automatycznie sześciu podstawowych ataków z mastera. Nie zmieniać nazw klipów, aby udawać zgodność.

Brax: Punching zawiera pojedynczy lewy cios. Boxing i Jab Cross zawierają sekwencje, a nie komplet niezależnych podstawowych ciosów. Potrzebne są osobne poprawne wykonania prawego prostego, lewego sierpowego i prawego podbródkowego; podbródkowy jest dziś częścią dłuższej sekwencji Knee Jabs To Uppercut. Nie ma potwierdzonego klipu prawego low kicka w zewnętrzne udo. Kicking(1) jest już podpięty jako lewy push kick; przed zamawianiem zamiennika należy porównać jego wykonanie z B06.

Nyxa: Body Jab Cross nie jest parą osobnych jab/cross w głowę. Brakuje potwierdzonych osobnych lewego low kicka i lewego teep. Prawe kolano jest dostarczone (Illegal Knee). Dwa Mma Kick są dostarczone, ale zgodność konkretnego klipu z prawym body roundhouse N05 wymaga oceny ruchu i wysokości kontaktu, a nie samej nazwy pliku.

Brakuje pełnych kombinacji mastera:

- BULL BREAKER: prawy prosty w korpus → lewy sierp w głowę → prawy hak w korpus → lewy sierp w głowę → prawy podbródkowy → lewy hak w korpus → szarża barkiem.
- BLACK THUNDER: lewy jab → prawy cross → lewy low kick → prawy body roundhouse → lewy teep → doskok i prawe kolano.

Knee Jabs To Uppercut, Martelo Do Chau oraz dodatkowy Punch To Elbow Combo nie są tymi kombinacjami. Ten ostatni plik jest dostępny, ale nie został w tej poprawce przypisany do sterowania.

## Dodatkowo

Brakuje skoku i lądowania dla obu nowych modeli; przycisk skoku nie ma obecnie odpowiadającego klipu. Brax nie ma osobnej animacji zwycięstwa.

## Przywitania — są, nie zamawiać ponownie

Brax: Breakdance Uprock Var 1 (1), 2,1 s, 65 kości zgodnych z jego źródłem. Dodany jako INTRO po filmie i przed odliczaniem.
Nyxa: Breakdance Freezes, 6,7 s, już podpięty jako INTRO.

## Eksport kolejnych ruchów

Ruch eksportować na właściwym, już zaakceptowanym modelu: FBX, Without Skin, 30 FPS. Zachować pełną sekwencję ruchu. Dla chodzenia i gardy potrzebny jest stabilny, pętlowy ruch; dla ataków pełne przygotowanie, kontakt i powrót. Nie zmieniać szkieletu ani wag istniejących modeli.

Weryfikacja tej poprawki: testy logiki gry i próbkowania szkieletu; bez podglądu GPU/przeglądarki i bez testu na iPhonie. Lista jest inwentaryzacją źródeł oraz niezgodności z masterem, nie deklaracją końcowego odbioru wizualnego.
