Audyt walk i turnieju — 11.10.2026

Wynik: poprawiono potwierdzone błędy silnika i interfejsu. Nie jest to odbiór całej gry ani potwierdzenie pełnej zgodności choreografii z masterem.

| Problem | Ustalenie i poprawka |
| --- | --- |
| Zbyt szybkie KO | Drugi odrzut w powietrze wymuszał zero HP niezależnie od zdrowia. Usunięto tę regułę. KO wynika teraz z obrażeń. |
| Zwykłe ciosy powodowały lot | Skumulowane 55 obrażeń uruchamiało odrzut nawet bez finishera. Usunięto ten wyzwalacz; zwykłe powalenie zachowuje próg 30,8. |
| Zdrowie nie schodziło do zera | Zawodnicy z animacją lotu mieli minimum 1 HP także poza treningiem. Minimum 1 HP obowiązuje teraz wyłącznie w treningu, również przy rzucie. |
| Blok odbierał zdrowie | Skuteczny blok przepuszczał 18% obrażeń. Usunięto te obrażenia zgodnie z masterem. |
| CPU powtarzał chwyty | Dodano początkowe 4 s bez chwytu i minimum 12/10/8 s pomiędzy zwykłymi próbami dla poziomów łatwy/normalny/trudny. |
| Zbyt agresywny CPU | Wydłużono reakcję i przerwy ataków; po otrzymaniu ciosu CPU nie kontruje z zerowym czasem oczekiwania. Zmniejszono częstość bloków. |
| Niepełna drabinka | Cały turniej od początku: dwie pary pierwszej rundy, dwa wolne losy w półfinałach, półfinały i finał, portrety i linie awansu. Przyszłe miejsca są oznaczone; podgląd nie rozstrzyga dodatkowych walk. |
| Ucięty napis VEXA | Pełny kadr oryginalnego filmu zamiast kadrowania cover. Pozostałą powierzchnię wypełnia przyciemniona zatwierdzona grafika. |

Sprawdzenia przeprowadzone w aktualnym silniku przez symulację wejścia i czasu:

- 864 kombinacje trafienia: sześć postaci, sześć ataków, każdy przeciwnik, oba kierunki, gracz oraz CPU. Kontrola obrażeń i powrotu do gotowości.
- 36 prób ataku poza zasięgiem: brak obrażeń na odległość.
- 144 scenariusze combo, podejścia i kontaktów, także przy brzegu areny.
- 72 pary/kierunki automatycznego zwarcia oraz zatrzymania Nina/Danny przy kontakcie.
- 32 pary chwytów: decyzja, rzut, jedno naliczenie obrażeń, puszczenie i wstawanie.
- 24 pary CPU/gracz: początkowa blokada chwytu i limit częstotliwości.
- Blok, ochrona po wstaniu, nieśmiertelność treningowa i KO z obrażeń dla obu ról wszystkich sześciu postaci.
- 48 przypadków dotyku: puszczenie, anulowanie, utrata przechwycenia, dwa palce, utrata fokusu i ponowne naciśnięcie ataku.
- Nina/Danny: brak inicjowania rzutu, możliwość bycia rzucanym, zerwanie chwytu, odzyskanie kontroli.
- Oba tryby kampanii, sześciu graczy, zwycięstwo, porażka, remis, brak powtórzonych rywali, dwa wolne losy, finał i powrót.
- Cztery ścieżki wyboru trybu i sześć filmów: zakończenie oraz pominięcie.
- Drabinka wyrenderowana do obrazu z rzeczywistych portretów i sprawdzona wizualnie; nie jest to zrzut z iPhone’a.

Otwarte kwestie:

- Nie przeprowadzono testu obrazu 3D ani wydajności w Safari na fizycznym iPhonie. Testy logiki nie potwierdzają braku drżenia, ślizgania stóp ani wizualnego przenikania podczas każdej fazy ataku.
- Garda Nyxy nadal jest zamrożoną fazą Right Block. Nie ma potwierdzenia, która konkretna poza/animacja z paczki jest zaakceptowanym wzorcem; nie podmieniono jej na kolejną zgadywaną pozę.
- Aktualny dobór ciosów i combo nie odpowiada dokładnie kartom mastera V2.3. Przykładowo Brax używa Jab Cross jako jednego ataku, a jego combo to Uppercut Jab + Kicking, nie pełne BULL BREAKER. Nyxa używa Punch To Elbow Combo + Martelo Do Chau, zamiast BLACK THUNDER; Krov nie ma końcowego body lock/przerzutu w aktualnej sekwencji combo. To wymaga osobnej weryfikacji dostępnych animacji względem konkretnych ruchów, bez tworzenia zastępczych póz.
- Master opisuje cztery pierwotne postacie. Nina i Danny podlegają późniejszym poleceniom użytkownika dotyczącym stylu i braku rzutu.
- Stary test sterowania odwoływał się do usuniętego brax-data.js. Zastąpiono go testem rzeczywistego, aktualnego silnika; nie przedstawiono starego testu jako zaliczonego.
