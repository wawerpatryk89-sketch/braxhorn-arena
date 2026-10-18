# BRAXHORN ARENA

Eksport projektu z 2026-10-18. Kod gry pozostaje niezmieniony. Repozytorium docelowe: prywatne `wawerpatryk89-sketch/braxhorn-arena` (nie utworzone przez ten eksport).

## Historia i wersje

Oryginalna historia: 196 commitów, nie jest shallow. Hosting 147: `e111aff9c0db723bfeb43d486e3d97efbd86cd5a`. Hosting 148, aktualna potwierdzona publikacja: `b6964bdfebc66fa7d3605592e83032a52f2ec092`.

`braxhorn-original.bundle` zachowuje oryginalne SHA i pełną historię. `braxhorn.bundle` zawiera całą historię po migracji mediów do Git LFS oraz osobny commit eksportowy (dokumentacja, reguły pracy, .env.example, dodatkowe źródła mediów). Migracja LFS zmienia SHA, ale nie bajty odtworzonych plików gry. Mapa: `docs/migration/commit-map.csv`; wersje hostingu: `docs/migration/hosting-versions.json`.

## Odtworzenie eksportu LFS

Wymagane Git, Git LFS, Python 3. Rozpakuj wszystkie archiwa `braxhorn-lfs-objects-*.zip` w katalogu sklonowanego repo: archiwa zachowują `.git/lfs/objects/...`. Media z `braxhorn-media-*.zip` zachowują oryginalne ścieżki projektu.

```sh
GIT_LFS_SKIP_SMUDGE=1 git clone braxhorn.bundle braxhorn-arena
cd braxhorn-arena
git lfs install --local
# Rozpakuj tutaj wszystkie archiwa braxhorn-lfs-objects-*.zip.
git lfs checkout
git lfs fsck
```

Oryginalny bundle jest samowystarczalny dla wszystkich historycznie śledzonych plików i nie potrzebuje LFS. Nie zawiera nowych plików dokumentacyjnych ani wcześniej ignorowanych surowych materiałów.

```sh
git clone braxhorn-original.bundle braxhorn-original
```

## Instalacja

Node.js >=22.13.0, npm, pnpm 11.25.0, Python 3 i Pillow. Zainstaluj Git LFS i pobierz wszystkie jego obiekty przed buildem. Backend ma własny pnpm-lock.yaml.

```sh
npm ci
python3 -m pip install Pillow
cd backend
pnpm install --frozen-lockfile
cd ..
```

Nie aktualizuj zależności ani lockfile przy wdrażaniu wskazanego commita. Dokumentacja opisuje istniejące skrypty; eksport nie stanowi potwierdzenia działania wszystkich testów ani instalacji na nowej maszynie.

## Sekrety i środowisko

`.env.example` zawiera wyłącznie nazwy i puste wartości. TURN/Metered jest opcjonalny; bez konfiguracji relay API zwraca `relay_not_configured`. Backend czyta zmienne środowiska Workera. Dla lokalnego Wranglera ustaw je w ignorowanym `backend/.dev.vars`. Na hostingu ustaw je w konfiguracji środowiska, nigdy w kodzie ani w plikach publicznych. `DB` i `BUCKET` to bindingi D1/R2, nie hasła. Dane produkcyjnej bazy i dane logowania użytkowników nie są częścią eksportu źródeł.

## Gra i backend lokalnie

```sh
npm run dev
```

Komenda synchronizuje `game/index.html` do `backend/game.html` i uruchamia serwer backendu. Użyj adresu wypisanego w terminalu. Szczegóły profili wykonania i lokalnego logowania opisuje `backend/README.md`.

## Build i lokalna D1

```sh
npm run build
cd backend
for migration in drizzle/*.sql; do
  node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file "$migration" || exit 1
done
npm start
```

Pętlę migracji wykonuj tylko na NOWEJ lokalnej bazie. Na istniejącej bazie stosuj wyłącznie niezaaplikowane migracje w kolejności. Nigdy nie zastępuj `--local` przez `--remote` podczas lokalnego uruchamiania. `npm run build:game` buduje samą grę, a `npm run build` także backend. Wynik pełnego buildu znajduje się w `dist/`.

## Testy

Z katalogu głównego:

```sh
npm test
npm run test:repairs
npm run test:audit
npm run test:147
```

Dodatkowe testy API: `npm run test:duel-api` i `npm run test:online`; drugi wymaga zbudowanego backendu i lokalnej D1. W migracji nie naprawiano testów ani kodu gry.

## Media

Konfiguracje JSON, manifesty, JS, CSS, HTML i SQL pozostają zwykłymi plikami Git. Modele i animacje .gz, tekstury, wideo, audio, FBX oraz archiwa binarne są w LFS. Pełna lista i rozmiary są w `docs/migration/lfs-files.json`. Pakiety zachowują również `fighter-package/` oraz `source-assets/new-fighters-input/`, wcześniej ignorowane w Git. Archiwa z obiektami LFS obejmują także historyczne wersje mediów, nie tylko aktualny checkout.

## Utworzenie prywatnego repozytorium i push

Po odtworzeniu eksportu i zalogowaniu lokalnego GitHub CLI:

```sh
gh repo create wawerpatryk89-sketch/braxhorn-arena --private
git remote remove origin
git remote add origin https://github.com/wawerpatryk89-sketch/braxhorn-arena.git
git lfs push --all origin
git push -u origin main
git push origin --tags
```

Nie wysyłaj oryginalnego bundle jako pliku do repozytorium. To osobne archiwum bezpieczeństwa z pierwotnymi SHA. Nie mieszaj oryginalnych gałęzi z gałęziami po migracji LFS.

## Zasady dalszej pracy

Obowiązuje AGENTS.md: wyłącznie wdrażanie wskazanego przez właściciela commita z main, bez zmian w kodzie. Raport wdrożenia: wersja hostingu, SHA commita, SHA-256 serwowanych JS/CSS/HTML porównane z artefaktem z tego commita. Dla kompilowanych plików trzeba porównywać wynik buildu, a nie udawać, że plik źródłowy jest identyczny z bundlowanym wynikiem. Przy błędzie: zgłoś go i niczego nie poprawiaj samodzielnie.
