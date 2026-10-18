> Dokument historyczny. Aktualny stan kandydata po v113 opisuje [MASTER_AUDYT_20261014.md](MASTER_AUDYT_20261014.md). Dawne wartości replay, zbliżeń i balansu poniżej nie są specyfikacją bieżącej wersji.

# Naprawy po audycie wersji 108

- Wspólny zegar pasywnej energii dla gracza i CPU: brak regeneracji podczas zatrzymania po trafieniu i klinczu; brak podczas własnego COMBO i po wykorzystaniu limitu dwóch specjalnych na rundę. Trening zachowuje pełną energię gracza.
- Nina przeciw Ninie: dystans rozpoczęcia COMBO 175 px i podążania 150 px w przestrzeni źródłowej. Ruch atakującego pozostaje ograniczony prędkością i kolizją. Nie zmieniono ciosów, obrażeń ani hitboxów. Symetryczne ustawienie dla obu ról.
- Wyniki nowych walk zapisują pełny rezultat rund. Dawne rekordy bez tego pola zachowano; pokazują przewagę rund, bez odgadywania wyniku 2:1. Zmiana nie usuwa pseudonimów ani postępów.
- Niski blok chroni nogi, wysoki głowę i korpus, zgodnie z masterem. Dotyczy gracza i CPU; Nina zachowuje uniki.
- Instrukcja rozróżnia dotyk i klawiaturę; U oraz E działają jako unik. Opis D jest odrębny dla Niny.
- Menu przed wczytaniem silnika informuje o niedostępnym zapisie zamiast obiecywać trwałe rekordy.
- npm test stanowi bieżącą bramkę: test:balance, test:expansion, test:regressions. Historyczny punkt wejścia pozostaje pod test:legacy. Test Niny wymaga kompletu czterech kontaktów także w mirror match.

Weryfikacja: 92 nowe przypadki regresji, 144 pełne ustawienia combo; komplet kontaktów Niny przeciw sześciu rywalom w obie strony. Przeszły testy sterowania dotykowego, kampanii, przejść i filmów zwycięstwa, a także zestawy balansu i nowych funkcji. Produkcyjny build wykonywany po testach.

Pozostają jawne ograniczenia: brak czterech osobnych zatwierdzonych zestawów głosów; brak wizualnego odbioru i pomiaru wydajności na iPhonie. Nie zmieniano tekstur ani fragmentu upadku Krova tylko na podstawie ryzyka wykazanego w audycie. Dalsze strojenie wymaga odtworzenia obrazu i pomiaru na urządzeniu. Wygląd, modele i oryginalne klipy zachowane.

## Rozszerzenie zlecone podczas napraw: widowiskowy nokaut
- Powtórka wyłącznie nokautu kończącego mecz: około 1,1 s przed i do 0,6 s po nokaucie, odtwarzane 0,65×, z przybliżeniem do 1,15×. Dostępne Pomiń.
- Bufor do 90 próbek pozy/konfiguracji/położenia, bez zapisywania filmów ani pełnych obrazów klatek. Dwa tymczasowe canvasy są zwalniane po powtórce. Arena pozostaje tłem aktualnej walki.
- Powtórka nie uruchamia fizyki, obrażeń, energii ani zegara. Wynik i rekord zapisują się raz po zakończeniu lub pominięciu.
- Ograniczenie ruchu wyłącza automatyczne replay i slow motion. Ukryta karta zatrzymuje odtwarzanie; wyjście do wyboru anuluje je bez późnego callbacku.
- Mocny odlot podczas walki dostaje krótki akcent przy krawędziach bez zmiany szybkości rozgrywki.
- Przy okazji testu ponownej walki naprawiono reset identyfikatora meczu, czasu i flagi zapisu, aby rewanż mógł otrzymać osobny rekord.
- Testy: ograniczenie bufora, zwolnione odtwarzanie, pominięcie, anulowanie, ograniczenie ruchu; pełny przepływ KO z zamrożeniem stanu i jednokrotnym zapisem. Obraz replay nadal wymaga wizualnego odbioru na urządzeniu.

## Stałe efekty krwi i otarć — doprecyzowanie użytkownika
Efekty są włączone na stałe, bez przełącznika. Nowy mecz, rewanż i kolejny przeciwnik kampanii zaczynają się bez ran. Otarcia twarzy narastają po mocnych czystych trafieniach w głowę i pozostają między rundami. Krótkie niewielkie rozpryski występują przy mocnym czystym trafieniu; skuteczny blok i unik nie dodają efektów. Warstwa nie zmienia modeli, tekstur, siły ciosów ani HP. Maksymalnie 48 cząstek i trzy stopnie śladów na postać. Powtórka odtwarza ślady zapisane w danym momencie. Ograniczenie ruchu pomija latające cząstki, zachowując stałe otarcia.
Przeszły testy rzeczywistej ścieżki damage, obu ról, blokowania, wygasania cząstek, zachowania śladów między rundami i czystego początku nowego meczu.

## Zbliżenia po rundzie
Po rundzie: 0,75 s zbliżenia na zwycięzcę i 0,75 s na drugiego zawodnika. Kadr przybliża górną część sylwetki 1,85× i pokazuje zachowane ślady trafień. To prezentacja końcowych póz rundy, bez dodatkowych obrażeń i bez zmiany zegara. Pomiń uruchamia kolejną rundę dokładnie raz. Po ostatecznym nokaucie pierwszeństwo ma powtórka ciosu. Tryb ograniczonego ruchu pomija automatyczne zbliżenia. Test pełnego przepływu potwierdza oba kadry, czas, pominięcie, niezmienność wyniku i zachowanie otarć.
