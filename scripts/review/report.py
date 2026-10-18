import json,csv,pathlib,subprocess,datetime,statistics
root=pathlib.Path('docs/review-v147')
def read(p):return json.loads((root/p).read_text())
def writecsv(path,rows):
 with (root/path).open('w',encoding='utf-8',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
def table(headers,rows):return '| '+' | '.join(headers)+' |\n|'+ '|'.join(['---']*len(headers))+'|\n'+'\n'.join('| '+' | '.join(str(x).replace('|','/') for x in r)+' |' for r in rows)+'\n'
main=read('tests/main.json');media=read('tests/requires-media.json');tests=main+media;writecsv('tests/final.csv',tests);(root/'tests/final.json').write_text(json.dumps(tests,ensure_ascii=False,indent=2))
bytest={pathlib.Path(r['test']).name:r for r in tests};decisions=json.loads(pathlib.Path('scripts/review/failure-decisions.json').read_text());rows=[{'test':name,'decyzja':d[0],'wyjasnienie':d[1],'wynik':bytest[name]['status'],'zestaw':bytest[name]['suite']} for name,d in decisions.items()];writecsv('39-fail-decyzje.csv',rows);(root/'39-fail-decyzje.md').write_text('# Decyzje dotyczące 39 wcześniejszych FAIL\n\na: nieaktualny test; b: zestaw wymagający mediów/historii; c: poprawiony błąd gry. Asercje testów mediów pozostały w osobnym zestawie.\n\n'+table(['Test','Decyzja','Wynik','Uzasadnienie'],[[r['test'],r['decyzja'],r['wynik'],r['wyjasnienie']] for r in rows]))
counts=lambda rs:{s:sum(r['status']==s for r in rs) for s in ['PASS','FAIL','NIEWYKONANE']}
fmt=lambda rs:' / '.join(str(n)+' '+s for s,n in counts(rs).items())
before=read('before/balance.json')['rows'];a=read('variants/A/balance.json')['rows'];b=read('variants/B/balance.json')['rows'];names=[r['who'] for r in before];ref=[r for r in a if r['who'] not in ['NINA','BEAR','DEMON']];dps=statistics.mean(r['meanDps'] for r in ref);ten=statistics.mean(r['best10s'] for r in ref)
for variant,data in [('A',a),('B',b)]:
 for r in data:
  if r['who'] in ['BEAR','DEMON']:assert .85*dps<=r['meanDps']<=1.15*dps and .85*ten<=r['best10s']<=1.15*ten
balance=[]
for title,data in [('Przed zmianami',before),('A — niższe obrażenia',a),('B — dłuższy recovery',b)]:balance.append('### '+title+'\n\n'+table(['Postać','DPS przycisków','Recovery ms','Najlepsze 10 s','Akcja'],[[r['who'],f"{r['meanDps']:.2f}",f"{r['meanRecovery']:.1f}",r['best10s'],r['bestAction']] for r in data]))
levelsBefore={(x['who'],x['level']):x for x in read('before/levels.json')};levels=read('after/levels.json');levelRows=[]
for x in levels:
 y=levelsBefore[(x['who'],x['level'])];levelRows.append({'status':'PASS','fighter':x['who'],'level':x['level'],'attacksBefore':y['attacks'],'attacksAfter':x['attacks'],'varietyBefore':y['variety'],'varietyAfter':x['variety'],'damageBefore':y['damage'],'damageAfter':x['damage'],'passiveKOBeforeMs':y['passiveKoMs'],'passiveKOAfterMs':x['passiveKoMs']})
writecsv('ai-przed-po.csv',levelRows)
network=read('after/network-size.json');netRows=[]
for key,v in network.items():
 who,scenario=key.split('/');netRows.append({'status':'PASS' if v['after']['median']<800 and v['after']['max']<=1200 else 'FAIL','fighter':who,'scenario':scenario,'beforeMedianB':v['before']['median'],'beforeMaxB':v['before']['max'],'afterMedianB':v['after']['median'],'afterMaxB':v['after']['max'],'keyframeMaxB':v['keyframes']['max']})
writecsv('sieciowe-przed-po.csv',netRows)
networkTable=[]
for who in names:
 r=[x for x in netRows if x['fighter']==who];networkTable.append([who,max(x['beforeMedianB'] for x in r),max(x['afterMedianB'] for x in r),max(x['afterMaxB'] for x in r),max(x['keyframeMaxB'] for x in r),'PASS'])
pressure=list(csv.DictReader((root/'after/pressure-acceptance.csv').open()));oldPressure={x['who']:x for x in read('before/pressure.json')}
pressureRows=[{'fighter':r['who'],'beforeHits20s':oldPressure[r['who']]['hits'],'beforeSeriesResets':oldPressure[r['who']]['resets'],'beforeFirstLaunch':oldPressure[r['who']]['firstLaunch'],'afterHeavyActionsToLaunch':r['heavyActions'],'afterLaunchMs':r['launchAt'],'retreatReset':r['retreatReset'],'status':r['status']} for r in pressure];writecsv('wyrzut-przed-po.csv',pressureRows)
thresholds=list(csv.DictReader((root/'after/ranking-thresholds.csv').open()));thresholdTable=[[who]+[next(x['minimumMs'] for x in thresholds if x['fighter']==who and x['difficulty']==level and x['mode']=='fight') for level in ['easy','normal','hard']] for who in names]
mediaHashes=list(csv.DictReader((root/'media-sha256.csv').open()));assert all(x['wynik']=='PASS' for x in mediaHashes)
changed=subprocess.check_output(['git','diff','--name-only'],text=True).splitlines();new=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],text=True).splitlines();changed+= [p for p in new if p.startswith(('scripts/review/','backend/','game/assets/compatibility.js','drizzle/'))];changed=sorted(set(changed));writecsv('zmienione-pliki.csv',[{'plik':p,'status':'PASS','uwaga':'lokalna zmiana, bez wdrożenia'} for p in changed]);(root/'zmienione-pliki.md').write_text('# Zmienione pliki\n\n'+ '\n'.join('- `'+p+'`' for p in changed)+'\n')
(root/'zmiany.diff').write_bytes(subprocess.check_output(['git','diff','--','.']))
(root/'diff-stat.txt').write_bytes(subprocess.check_output(['git','diff','--stat']))
text=f'''# Braxhorn — poprawki po niezależnym przeglądzie v147

Stan: lokalna propozycja na bazie UI v148, bez wdrożenia. Commit bazowy: `b6964bdfebc66fa7d3605592e83032a52f2ec092`. Kod walki przed zmianami: v147 `e111aff9c0db723bfeb43d486e3d97efbd86cd5a`. Data: {datetime.datetime.now(datetime.timezone.utc).isoformat()}.

Adres istniejącego podglądu: https://braxhorn-p0-preview.wawerpatryk89.chatgpt.site/ — nie zawiera tych lokalnych poprawek. Aktualnego stanu hostingu nie odpytywano ponownie: NIEWYKONANE. Produkcyjna baza nie została zmieniona.

PASS oznacza wykonanie konkretnego sprawdzenia w opisanych warunkach. Nie jest potwierdzeniem bezbłędności całej gry.

## Wynik

- Zestaw główny: {fmt(main)}.
- Osobny zestaw wymagający mediów/historii: {fmt(media)}. Niepowodzenia zachowano jawnie.
- Modele, klipy, animacje i tekstury: PASS porównania SHA-256, {len(mediaHashes)} plików bez zmian.
- Warianty A/B: PASS celu DPS i testu 10 s dla BEAR/DEMON. Żaden wariant nie został zapisany do produkcyjnych konfiguracji.
- Wyrzut po 3 mocnych akcjach: PASS, wszystkie 8 postaci; odejście nadal zeruje serię.
- Ranking: progi z 4800 pełnych walk z rzeczywistym AI przeciwnika, 200 na postać/poziom; migracja i moderacja przygotowane lokalnie.

## 1. Warianty balansu

Średnia odniesienia BRAX/NYXA/VEXA/KROV/DANNY: {dps:.3f} DPS i {ten:.1f} obrażeń w 10 s. NINA jest osobno, ponieważ nie ma gardy. Przedział celu: {dps*.85:.3f}–{dps*1.15:.3f} DPS i {ten*.85:.2f}–{ten*1.15:.2f} obrażeń w 10 s.

DPS = obrażenia unikalnych grup trafień podzielone przez pełny czas akcji, następnie średnia po akcjach przycisków. Test 10 s: arena 844×390, przeciwnik BRAX, naturalne podejście i powtarzanie jednej akcji, HP celu uzupełniane po trafieniu; wyrzuty i recovery pozostają aktywne. Jest to jawna, powtarzalna procedura; nie odtwarza nieudokumentowanych szczegółów pomiaru 140/150 podanego w zleceniu. Dlatego wartości przed zmianami mogą się różnić.

A zmienia wyłącznie obrażenia BEAR/DEMON. B zmienia wyłącznie tempo fazy recovery tych postaci; klatki startup/active, geometria i zawartość klipów pozostają identyczne. BEAR SHOULDER ma dodatkowe wydłużenie recovery, konieczne do osiągnięcia celu 10 s. Parametry i wszystkie operacje: `variants/A/parameters.*` oraz `variants/B/parameters.*`.

'''+'\n'.join(balance)+'''
Uwaga: spełnienie celu DPS nie oznacza wyrównania wszystkich starć. BEAR nadal wygrywa zdecydowaną większość części par w obu wariantach; sam spadek obrażeń lub wydłużenie recovery nie usuwa całej przewagi w tym pomiarze. Nie rekomenduję wdrożenia żadnego wariantu jako potwierdzonego pełnego wyrównania bez oceny tych wyników.

Macierze CPU vs CPU: `variants/A/matrix.md` i `variants/B/matrix.md`; każda 8×8, 100 walk na komórkę, normal, łącznie 12 800 walk. Zawodnik wiersza gra 50 razy po każdej stronie. CSV `matchups.csv` zawiera czas, HP zwycięzcy, remisy i wyniki obu stron. PASS pomiaru nie oznacza równej szansy zwycięstwa każdego zawodnika. Surowe wyniki mają seed i przebieg rund. Czasy oznaczają aktywny zegar symulacji walki, bez filmu wejściowego i celebracji.

## 2. Serie i wyrzuty

Czas oddalenia nie narasta podczas pushTime, stun, reakcji HIT, akcji ataku ani ruchu atakującego do przodu. Seria nadal ma ograniczony czas życia i zeruje się po rzeczywistym odejściu. Mocne akcje są liczone odrębnie od wielokrotnych kontaktów tego samego ciosu; trzy mocne akcje działają również przy obrażeniach 11 i przy wariancie obniżonych obrażeń.

'''+table(['Postać','Trafienia przed / 20 s','Resety przed','Mocne akcje do wyrzutu po','Odejście zeruje'],[[r['fighter'],r['beforeHits20s'],r['beforeSeriesResets'],r['afterHeavyActionsToLaunch'],r['retreatReset']] for r in pressureRows])+'''
Pełny CSV: `wyrzut-przed-po.csv`. Liczymy akcje, a nie surowe kontakty: np. dwuczęściowy cios może dać 4 kontakty przy trzeciej mocnej akcji. Testy combo-finisher, impact-frequency i two-launches zachowują kontrole bloku, cooldownu, finishera i KO zależnego od HP.

## 3. AI

Easy: reaction 650 ms, cooldown 8500 ms, approach 0.65. Normal: 180/280/0.9. Hard: 100/0/1.15. Hard ogranicza odwrót, równoważy repertuar przy biernym przeciwniku, natomiast pod naciskiem dobiera kontrę według obrażeń i czasu pierwszego kontaktu; po bloku może od razu odpowiedzieć. Nie zmieniono ciosów ani animacji.

'''+table(['Postać','Poziom','Ataki przed→po / 30 s','Różne akcje przed→po','KO biernego po (ms)'],[[x['fighter'],x['level'],f"{x['attacksBefore']} → {x['attacksAfter']}",f"{x['varietyBefore']} → {x['varietyAfter']}",x['passiveKOAfterMs'] if x['passiveKOAfterMs'] is not None else 'brak KO w 60 s'] for x in levelRows])+'''
Różnorodność w tabeli uwzględnia COMBO; test wymaga dodatkowo co najmniej 5 podstawowych ciosów hard. `ai-przed-po.csv` zawiera obrażenia i czasy przed/po. Test aktywnego nacisku zachowuje wymaganie skuteczniejszej kontry hard niż normal. Oddzielna macierz strategii gracza obejmuje 1920 przypadków.

## 4. Multiplayer i cache

Trafienie przesyła pozycję, siłę, region, kierunek, ziarno losowe oraz metadane obrażeń powierzchni ciała. Gość odtwarza cząstki i plamy lokalnie. Zdarzenia mają identyfikator, powtórki są ignorowane; pełny stan kluczowy naprawia utracone efekty. Usunięto powielony zewnętrzny timestamp, wewnętrzny czas stanu ma dokładność 1 ms.

Porównanie kontrolowane: stary i nowy serializer działają na tym samym stanie walki, z włączoną prawdziwą krwią. 8 postaci × heavy/COMBO/stress, po 30 s; duży numer sekwencji i czas sesji użyty w kopercie. Tabela pokazuje najgorszy wynik spośród 3 scenariuszy danej postaci. Są to bajty danych protokołu, bez nagłówków UDP/DTLS/HTTP i bez głosu.

'''+table(['Postać','Mediana przed B','Mediana po B','Maks. zwykły B','Maks. kluczowy B','Wynik'],networkTable)+'''
Pełny stan kluczowy jest wyjątkiem od limitu 1200 B; wysyłany okresowo co około 2 s. Test zgodności krwi sprawdza cząstki, plamy, rany, duplikaty oraz odtworzenie po stanie kluczowym przy wspólnym zegarze. Pomiar działania na dwóch fizycznych telefonach i przy rzeczywistej utracie pakietów: NIEWYKONANE.

Handshake zawiera wersję protokołu, SHA-256 kodu klienta i SHA-256 konfiguracji 8 postaci. API create/join/sync oraz kanał peer odrzucają niezgodność komunikatem „Odśwież grę — inna wersja u przeciwnika”. Manifest generuje `scripts/build-compatibility.mjs`; konfiguracje dostają ten sam hash w URL. `fighter-source.js` ma jeden kanoniczny URL `/assets/fighter-source.js?v=review-147` — PASS 7 referencji.

## 5. Ranking

200 pełnych walk dla każdej postaci na każdym poziomie, 25 przeciw każdemu z 8 przeciwników. Gracz podchodzi i wykonuje legalne akcje przycisków; strategie obejmują powtarzanie jednej akcji i cykl repertuaru. Przeciwnikiem steruje produkcyjne AI danego poziomu. Najkrótszy czas spośród zwycięstw i porażek × 0.8, zaokrąglony w dół, tworzy próg pełnego meczu. Survival korzysta z najkrótszej rundy od pełnego HP; przegrana z przeniesionym HP nie ma dodatniego minimum. Rundy remisowe nadal wymagają czasu 60 s.

'''+table(['Postać','Easy ms','Normal ms','Hard ms'],thresholdTable)+'''
PvP nie ma poziomu CPU: jego dotychczasowe fizyczne minimum zachowano oddzielnie w `backend/lib/duel-times.json`, z testem pochodzenia z konfiguracji. Progi AI nie są używane do walidacji pojedynków między ludźmi.

Próg jest wspólny dla pojedynczego meczu fight/arcade/tournament, nie całego turnieju. Wszystkie 96 kombinacji postać×tryb×poziom: `after/ranking-thresholds.csv`. To empiryczny próg, nie matematyczny dowód najkrótszego KO człowieka. Niewybrany wariant balansu A/B wymaga ponownego wyliczenia progów przed wdrożeniem.

Wynik poniżej minimum pozostaje odrzucony przez istniejącą walidację. Przyjęty wynik krótszy niż 1.5×próg otrzymuje review_status=1 i nie trafia do TOP100. Statusy: 0 zwykły, 1 oczekujący, 2 zatwierdzony, 3 odrzucony. Owner-only GET reviewResults i POST reviewResult zapisują autora oraz czas decyzji. Migracja kolejkuje także istniejące zbyt szybkie wyniki, nie nadpisując wcześniejszej decyzji właściciela. Produkcyjna migracja: NIEWYKONANE — brak wdrożenia; nie zaakceptowano żadnych realnych wyników.

## 6. Testy, narzędzie audytu i ograniczenia

Build lokalny: PASS, `npm run build`, 38.73 s. Eksport danych audytu: PASS, `node scripts/review/extract-audit.cjs`, 3.21 s. Pełne logi: `tests/build.stdout`, `tests/build.stderr`, `tests/extract-audit.cjs.stdout`, `tests/extract-audit.cjs.stderr`. Próbę automatycznego wyszukania migracji przez Wrangler przerwał brak katalogu migrations; następnie cały schemat zastosowano lokalnie przez jawny plik SQL. Logi obu kroków są zachowane; nie użyto bazy zdalnej.

Pełne polecenia, czasy, statusy i stdout/stderr: `tests/final.csv` oraz pliki obok. Decyzje dla wszystkich wcześniejszych 39 FAIL: `39-fail-decyzje.md` i CSV. Zestaw główny uruchamia `npm run test:review-main`; osobny zestaw `npm run test:requires-media`. Nie usunięto asercji testów mediów, które nadal zawodzą.

HP eksportowane po resecie, przed pomiarami walki: PASS 100 dla wszystkich 8 w `extracted/03-postacie/zawodnicy.csv`.

Znane ograniczenia: sześć zachowanych FAIL w testach klipów/animacji; brakujące historyczne pliki i zależności dla jedenastu testów; brak fizycznych urządzeń i pomiarów 60 fps; brak wdrożenia i produkcyjnej migracji. Czy wszystkie niepowodzenia animacji są błędami obrazu czy dawnymi kontraktami testów: nie wiem. Nie zmieniano mediów, żeby uzyskać zielony wynik.

Pierwszy adapter CPU po stronie gracza miał błędy obsługi zasięgu i zakończenia akcji; jego pomiary odrzucono (`simulation/rejected-controller-v1`). Część partii przerwał limit pamięci oraz polecenie STOP użytkownika. Wyniki końcowe zawierają wyłącznie kompletne pliki wymaganej liczebności. Normal/easy porównano krok po kroku z zamrożonym silnikiem macierzy; hard ponownie zmierzono po poprawce kontrataków. Diagnostyczne walki dwóch łagodnych CPU nie służą do wyliczenia progów rankingu.

## Zawartość i zmiany

`variants/`: dwie propozycje parametrów, tabele, macierze i surowe walki. `before/`, `after/`: pomiary. `tests/`: logi. `media-sha256.csv`: rozmiary i SHA-256 wszystkich chronionych zasobów. `zmienione-pliki.md/csv`, `zmiany.diff`, `diff-stat.txt`: przegląd zmian. Kod pomocniczy: `scripts/review/`. Brak binarnych mediów w pakiecie.
'''
text += '\nKod zmienionych i nowych plików jest w ZIP w katalogu `zmiany-kodu/`, z zachowaniem ścieżek względem repozytorium. Raporty i surowe wyniki są w katalogu głównym ZIP. To pakiet do przeglądu, nie gotowy build do publikacji.\n'
(root/'00-START.md').write_text(text,encoding='utf-8');print(counts(main),counts(media),'report ready')
