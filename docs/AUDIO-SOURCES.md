# Audio BRAXHORN — 2026-10-07

Nagrania są używane w zintegrowanej grze. Nie stanowią osobnej biblioteki audio do dalszej dystrybucji. Nie są autorskimi nagraniami BRAXHORN.

| Pliki w assets/audio | Źródło i autor | Licencja | Obróbka |
|---|---|---|---|
| title.mp3 | Basil — Prepare to fight, https://opengameart.org/content/prepare-to-fight | CC0 | Normalizacja, łagodne wejście/wyjście, MP3 160 kb/s |
| crowd.mp3 | Mixkit — Stadium joy shouting crowd, ID 3022, https://mixkit.co/free-sound-effects/crowd/ | Mixkit Sound Effects Free License, https://mixkit.co/license/modal/sfxFree/ | Normalizacja i łagodne krawędzie pętli, MP3 160 kb/s |
| 1.mp3, 2.mp3, 3.mp3, fight.mp3 | Kenney — Voiceover Pack: Fighter, https://opengameart.org/content/voiceover-pack-fighter-40-taunts | CC0 | Skrócenie ciszy początkowej, normalizacja, MP3 128 kb/s |
| swish.mp3, kick-swish.mp3 | remaxim / qubodup — 3 Melee sounds, https://opengameart.org/content/3-melee-sounds | CC0 | Skrócenie ciszy początkowej, normalizacja |
| impact.mp3, heavy.mp3, step.mp3, land.mp3 | qubodup — 40 wet towel club/pound/hit/attack sounds, https://opengameart.org/content/40-wet-towel-clubpoundhitattack-sounds | CC0 według strony autora; strona wyraźnie zastępuje starszą informację w archiwum | Próbki 05, 14, 03; cięcie ciszy, normalizacja, obniżenie tonu ciężkiego efektu; filtrowane akcenty kroków i lądowania |

Licencje odczytano 2026-10-07. Mixkit pozwala na użycie w grach, również komercyjnych; zakazuje oferowania nagrania samodzielnie jako stock lub paczki źródłowych efektów. Repozytorium gry zawiera wyłącznie efekty zintegrowane z produktem, nie pełne paczki pobranych materiałów. Surowe archiwa pozostają poza repozytorium.

Lektor nagrany przez profesjonalnego aktora głosowego — potwierdzenie autora Kenney w komentarzu do zestawu. Efekty kroków są opracowanymi akcentami foley, a nie terenowym nagraniem butów. W treningu solo efekty ciosów podkreślają animację; nie oznaczają trafienia niewidzialnego przeciwnika.

Sprawdzenie plików: docs/audio-validation.json. Jakości odsłuchu na fizycznym telefonie nie oceniano. "Premium" jest wymaganiem stylistycznym użytkownika, nie zweryfikowanym certyfikatem jakości.

Aktualizacja kroków: step.mp3 zastąpiony krótkim syntetycznym, nieintonowanym stuknięciem (115 ms, filtrowany szum 100–1100 Hz, łagodna obwiednia). Usunięto mokry efekt foley dla chodzenia; głośność chodzenia zmniejszono z .23 do .17. To zaprojektowany efekt, nie nagranie rzeczywistych butów.

## Aktualizacja: głosy i klimat aren (2026-10-07)

- BRAX: Kenney Voiceover Pack (Fighter), CC0; prepare_yourself / ready. Źródło: https://kenney.nl/assets/voiceover-pack-fighter . Delikatne obniżenie tonu, kompresja dynamiki i normalizacja.
- NYXA: Kenney Voiceover Pack, głos żeński Giselle (easymedia), CC0; ready / war_look_out / hurry_up. Źródło: https://kenney.nl/assets/voiceover-pack . Normalizacja i kompresja dynamiki. Nagrania angielskie.
- Pięć teł aren i gong: autorska synteza proceduralna (scripts/create-arena-audio.py), bez zewnętrznych nagrań: deszcz/wiatr na dachu, niski szum torów metra, fale w porcie, bulgot lawy, owady i ptaki w dżungli. Nie są to terenowe nagrania natury.
- Tło: głośność 0.13, podczas głosu 0.045; zatrzymanie przy pauzie, ukryciu strony i powrocie do menu.
- Głos przed odliczaniem; gong na FIGHT. Kwestie w walce wyłącznie po kontakcie, co najmniej 14–21 s po poprzedniej, pierwsza nie wcześniej niż po 12 s.
- Uderzenie słychać przy kontakcie z przeciwnikiem; zamach w powietrzu ma osobny świst.

## Card selection audio
Original synthesized stereo instrumental loop (96 BPM, 20 seconds) and two interface cues. Created with scripts/create-roster-audio.py; no third-party music samples. MP3, stereo. Existing mute controls govern playback.
