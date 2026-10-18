> Dokument historyczny. Aktualny stan kandydata po v113 opisuje [MASTER_AUDYT_20261014.md](MASTER_AUDYT_20261014.md). Dawne wartości replay, zbliżeń i balansu poniżej nie są specyfikacją bieżącej wersji.

# BRAXHORN — poprawki i ponowny audyt walki, 14.10.2026

## Wynik

Wprowadzono wspólne zasady reakcji na trafienia dla sześciu zawodników i obu stron walki. Usunięto premię za dwa kopnięcia oraz automatyczne przewracanie od samej bliskości. Przypisane ruchy, modele i wygląd gry pozostały bez zmian.

## Zasady po poprawce

- Liczą się wyłącznie trafienia bez bloku. Seria wygasa po 2,5 s aktywnej gry bez kolejnego trafienia; skuteczny blok ją przerywa.
- Każda oddzielna akcja daje najwyżej 14 punktów nacisku, również gdy animacja zawiera kilka ciosów. Obrażenia zdrowia są naliczane oddzielnie.
- Co najmniej dwie akcje i 20 punktów nacisku dają mocniejsze odepchnięcie trafionego zawodnika. Trzy lub więcej akcji i 36 punktów dają odrzut. Lżejsze ciosy potrzebują dłuższej serii.
- Specjalne combo odrzuca dopiero po trafieniu co najmniej trzech grup ciosów za łącznie co najmniej 24 obrażenia, razem z kończącym ciosem. Sam kończący cios nie wystarcza. Wcześniejsze trafienia nie rozrywają choreografii combo odpychaniem.
- Leżący nie przyjmuje kolejnych trafień. Pozostała ochrona po wstaniu: 350 ms przed obrażeniami, 3,5 s przed następnym odrzutem. Atak gracza kończy ochronę przed obrażeniami.
- Przy ścianie odepchnięcie nie dodaje obrażeń; brakujący dystans mocnego odpychania tworzy odstęp przez cofnięcie napastnika.
- Klincz od kontaktu wymaga rzeczywistego napierania przez 320 ms. Nie przerywa trwających ataków, reakcji ani upadków. Napierający jest inicjatorem niezależnie od strony. Gdy napierają obaj, obaj się odsuwają. Samo stanie blisko nie uruchamia akcji ani upadku.
- Energia za zwykły atak: raz za akcję, wyłącznie po trafieniu, jednakowo dla gracza i CPU. Blok nie zwiększa licznika trafionego combo.
- Odchylenie LEAN chroni głowę; nie daje już odporności nóg i tułowia.

## Dopasowanie zawodników

| Zawodnik | Analiza i zmiana |
|---|---|
| BRAX | Siłowe ataki zachowane. Lekka podwójna pięść: 13 → 9 obrażeń łącznie; mocna pięść nadal 13. Lekki ruch nie zastępuje już mocnego samą sumą obrażeń. |
| NYXA | Lekka para ciosów: 16 → 10. Mocny cios: 8 → 12; łokieć: 8 → 10; kolano: 8 → 12. Wzmocniono techniki wymagające dłuższej akcji względem szybkiej pary pięści. |
| VEXA | Zachowane kopnięcia i obrażenia. Poprawiono wybór dystansu, aby CPU nie wybierało obrotowego kopnięcia poza skutecznym zasięgiem przeciw Ninie. |
| KROV | Zachowane ciężkie ciosy, łokieć, podbródkowy i combo. Odpychanie/odrzut liczą również trafione pięści i łokcie, zamiast premiować wyłącznie kopnięcia. |
| NINA | Zachowane wszystkie osiem ruchów capoeiry. Cała akcja Armady: ok. 0,54 → 0,85 s; Armady z unikiem: ok. 0,75 → 0,85 s; mocnego kopnięcia: ok. 0,75 → 0,90 s. Zmieniono powrót po trafieniu, bez zmiany okna aktywnego i ruchu uderzenia. |
| DANNY | Zachowane sześć ruchów. Mocna pięść: ok. 0,62 → 0,85 s przez wydłużenie powrotu. Szybka lekka pięść nadal ok. 0,65 s. |

Czasy oznaczają pełną akcję z uwzględnieniem mnożników faz, bez zatrzymania po trafieniu. Nie są czasem do pierwszego trafienia. Aliasy tej samej animacji mają zgodne obrażenia i tempo. Dla wszystkich zawodników wybór ataku korzysta z 6% marginesu wewnątrz wyliczonego zasięgu; nie powiększono obszarów trafienia.

## Ponowny audyt automatyczny — PASS

| Zakres | Przypadki |
|---|---:|
| Serie, blok, wygaszanie, pojedynczy finisher, pełne combo, ochrona, LEAN; wszystkie 36 par, obie role, kierunki i ściany | 2880 |
| Rzeczywiste trafienia 38 przypisanych ataków przez detekcję kolizji | 912 |
| Ataki z dystansu, które muszą chybić | 38 |
| Powrót po odrzutach, dodatkowo blok, ochrona i KO | 12 |
| Naliczanie energii i odrzucanie bloków | 144 |
| Choreografia klinczu, odepchnięcia i upadku, obie role i ściany | 576 |
| Warunki inicjacji kontaktu bez faworyzowania gracza | 360 |
| CPU: wszystkie pary na easy/normal/hard | 108 |
| Podejście CPU do combo i odrzut, wszystkie pary i kierunki | 72 |

Odtworzenie: `npm run test:balance`. Szczegółowe obrażenia i czasy akcji: `docs/fair-pressure-audit.json`. Parametry strojenia: `scripts/tune-combat-balance.cjs`.

## Granice audytu i dalsze ulepszenia

Testy używają silnika logiki, rzeczywistych konfiguracji kolizji i symulowanego czasu. Nie są testem renderowania w przeglądarce ani oceną płynności na telefonie. Nie dowodzą identycznych szans wygranej — do takiego wniosku potrzebne są mecze z graczami i analiza wyników.

Do dalszego dopracowania pozostają odrębne pary chwytów dla stylów postaci (część używa wspólnego rzutu barkowego), animacja chwytu od tyłu oraz rozbudowa obrony na wysoką/niską ze spójnymi animacjami i sterowaniem. W obecnych sześciu modelach zwykły blok nadal chroni wszystkie poziomy. Nie dodano fikcyjnego chwytu od tyłu ani nowej animacji rzutu.
