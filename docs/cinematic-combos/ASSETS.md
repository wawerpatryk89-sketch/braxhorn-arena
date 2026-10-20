# ASSETS — źródła klipów / walidacja nowej paczki

## Obecnie potwierdzone
- 8 zawodników, 299 **wpisów** w ich manifestach (31 BRAX, 30 NYXA, 26 VEXA, 29 KROV, 27 NINA, 28 DANNY, 66 BEAR, 62 DEMON); 85 wpisów bez aktywnego przypisania wg analizy z 20.10 (nie znaczy, że są poprawne dla każdego celu).
- Zewnętrzny audyt wcześniej przekazanych sześciu ZIP wykazał 152 FBX (105 HumanIK i 47 Mixamo). Nie oznacza, że surowe ZIP-y są zapisane w tym repo: trzeba pobrać materiały oryginalne od właściciela, zweryfikować sumy, retarget i licencję.
- Gałąź `combo-brax-bull-breaker` przechowuje `source-assets/bull-breaker/jump-retargeted.json.gz` i `source-assets/bull-breaker/provenance.json` — jeden import `Jumping_ROM_HUMANIK_WHS.fbx`, segment 3.8–5.2 s. To dowód częściowej integracji materiału Rokoko, a nie całej paczki.
- Nowe źródło: **`Headspin Start.zip` (2026-10-20)**, sha256 `913b7bf68e49b3c9f0a161d55e2eb0fca17fbe48309e9f3b153e39feece0b7d2`, rozmiar 1 593 960 bajtów, ZIP CRC PASS. W tej sesji zapisany do wspólnej biblioteki plików ChatGPT: `/BraxHorn Arena/Animations/Shared Sources/Headspin Start - 2026-10-20.zip`. Ten GitHub doc nie jest surowym uploadem ZIP do repo. Binaria repo są obsługiwane przez **Git LFS** — osobna operacja właściciela/wykonawcy po pobraniu archiwum z Library.
- Każdy z 11 FBX ma format binarny FBX 7700, 65 węzłów `LimbNode` i 315 krzywych; dwa pliki `Receiving A Big Uppercut` mają identyczny fingerprint przebiegu krzywych, choć różne pełne sha256 binarne; **10 unikatowych przebiegów animacji** w tym archiwum.

## Weryfikacja plików nowego ZIP (SHA-256 pełnych FBX)
| Plik | Bajty | SHA-256 |
|---|---:|---|
| `Headspin Start.fbx` | 753 776 | `1591a3b5ee255c905b158796a90ac29a32e803ad35d9e3ba0f4e0d48a027462f` |
| `Big Kidney Hit.fbx` | 510 976 | `50ea8ce0b33e5bfc36627c9e51c69696d1c0c14c14a65cdfdacb1d3a872e4ad0` |
| `Sweep Fall.fbx` | 696 768 | `b78ccd228050201a39fd076e8e19e7167dc0e1fd1b78d1cc530bb648ef682d36` |
| `Receiving A Big Uppercut (1).fbx` | 562 752 | `c3d69d1458c584afad5022dbf962224fa5fa27902eef8e0683fa83cdec974726` |
| `Receiving A Big Uppercut.fbx` | 562 752 | `cbd606bcf2f77f03c5ee773ac76ae5c3048ad57ed28a15884ecd6ffe5930e575` |
| `Head Hit.fbx` | 483 584 | `c1a8023eda0ac6f03dc6b305f7ae3a9a83014f638dc3640db2e97ae8dcfaf8f2` |
| `Receiving An Uppercut.fbx` | 524 480 | `8e61f09a0f26a6146cada47f767cd98211001eecfa2fba5597e0c8934801b960` |
| `Jump Attack.fbx` | 915 984 | `6d8cfc35520e5738225d387e1c378ba0757fdec4bd9bd94c3ab1c5c727ec6366` |
| `Injured Run Jump.fbx` | 412 736 | `d9f9c2e7664764d83d84248eef787f25aca0ffa405a2af10045756d3d8ab49d9` |
| `Jump From Wall.fbx` | 511 744 | `86a85009255d0b68fe5e2dcaf0f8cd7095537ff4ae3ca90876b016d5dc7e5dce` |
| `Jumping.fbx` | 640 608 | `447ba886c696d3875734f7478cc20f878910b1ed5ed5782b6afeb842fe18cc65` |

**Duplikacja:** oba `Receiving A Big Uppercut` mają różne identyfikatory i bajty kontenerów FBX, ale te same wartości KeyTime/KeyValue dla wszystkich 315 curves. Zachowaj oryginały; runtime wybiera jeden kanoniczny klip.

## Selekcja ruchów według nazwy — tylko kandydaci
- HEAD hit: `Head Hit`, `Receiving An Uppercut`, `Receiving A Big Uppercut`, `Big Kidney Hit` (korpus, NIE głowa) — wybieraj odpowiednią do konkretnego ciosu.
- FALL: `Sweep Fall` lub istniejący własny DOWN/LAND; `Injured Run Jump` może dać przejście, ale NIE jest z automatu reakcją down.
- BONUS: `Jump Attack`, `Jumping` kandydaci do skoku/ciosu w locie; `Headspin Start` do akrobacji/tauntu, a nie gwarantowana animacja uderzenia w głowę.
- `Jump From Wall` wymaga ściany; gra celowo nie ma ścian podczas COMBO — **nie przypisywać** jako odbicie od granicy areny. Nie doklejać efektu wall bounce.
- `PunchingtheGround_HUMANIK_769` (wcześniejszy Rokoko) zaczyna standing→kneeling: nie używać 'wprost' jako gniewnego ciosu z prone. Trzeba kompatybilny segment, dopasowanie i dowód.

## Procedura importu do repo / LFS
1. Właściciel/wykonawca pobiera ZIP z ChatGPT Library (powyższa ścieżka); weryfikuje sha256 archiwum; nie udostępnia publicznie bez kontroli licencji.
2. Umieszcza surowy ZIP pod `source-assets/shared-motion/2026-10-20/Headspin Start.zip` przez **Git LFS** w lokalnym klonie (w `.gitattributes` *.zip i *.fbx są śledzone przez LFS), potem `git lfs push` i osobny PR. **Nie** używać GitHub Contents API do surowego ZIP: omija filtr LFS.
3. Export tylko wybranych klipów runtime do właściwych `game/assets/{fighter}-new/` oraz aktualizacja provenance/sha; nie pakować 152 zewnętrznych długich źródeł do gry startowej. Jeśli brak archiwum na maszynie wykonawcy, STOP importu binariów; dokumentacja sama w sobie nie jest uploadem assetu.
4. Licencje: oficjalna darmowa oferta Rokoko dopuszcza komercyjne użycie tej kolekcji (https://www.rokoko.com/resources/download-263-rokoko-motion-capture-assets). Pochodzenie **konkretnych** nowych plików Headspin i wcześniej przesłanych FBX nie jest jeszcze potwierdzone licencją w samym ZIP. Weryfikować oddzielnie.