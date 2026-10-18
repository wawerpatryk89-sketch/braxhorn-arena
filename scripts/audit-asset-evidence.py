#!/usr/bin/env python3
"""Reproducible byte hashes from Git; deleted arena reference audit of working source/build."""
import hashlib,json,pathlib,re,subprocess,sys,collections
ROOT=pathlib.Path(__file__).resolve().parents[1]
V138='0de66717a64064f303f36e5b67b0259cd372c73f'
V141='220e7e2298099e798ac7ebc0867fe537bc6a44fc'
V143='90f65b34d3b0a01566d24b51c6de32accd227d10'
def run(*args): return subprocess.check_output(args,cwd=ROOT)
def tracked(v): return run('git','ls-tree','-r','--name-only',v).decode().splitlines()
def scope(p): return (p.startswith('source-assets/') and not p.startswith('source-assets/arena-videos/')) or bool(re.match(r'game/assets/[^/]+-new/',p))
a,b=map(lambda v:set(filter(scope,tracked(v))),[V138,V143])
rows=[]
for p in sorted(a|b):
    hashes=[hashlib.sha256(run('git','show',f'{v}:{p}')).hexdigest() if p in names else None for v,names in [(V138,a),(V143,b)]]
    rows.append(dict(path=p,sha256_138=hashes[0],sha256_143=hashes[1],status='IDENTICAL' if hashes[0]==hashes[1] else 'ADDED' if hashes[0] is None else 'REMOVED' if hashes[1] is None else 'CHANGED'))
DOC=ROOT/'docs';DOC.mkdir(exist_ok=True)
(DOC/'hashes143-v138.json').write_text(json.dumps(dict(version138=V138,version143=V143,scope='All tracked non-arena source-assets plus all game/assets/*-new files (including configs/manifests).',files=rows),indent=2)+'\n')
(DOC/'hashes143-v138.tsv').write_text('path\tsha256_138\tsha256_143\tstatus\n'+''.join('\t'.join(str(r[k] or 'MISSING') for k in ['path','sha256_138','sha256_143','status'])+'\n' for r in rows))
deleted=[p for p in run('git','diff','--no-renames','--diff-filter=D','--name-only',V141,V143,'--','game/assets').decode().splitlines()]
manifests=json.loads((ROOT/'arena-media/manifest.json').read_text())+json.loads((ROOT/'arena-media/assets-manifest.json').read_text())
byhash={r['sha256']:r['file'] for r in manifests}
classify={'arena-beach.jpeg':'Zastąpiony nowym posterem beach; nie duplikat bitowy.', 'arena-beach.mp4':'Zastąpiony nowym filmem beach; nie duplikat bitowy.', 'jungle.gif':'Zastąpiony filmem jungle; nie duplikat bitowy.', 'rooftop.gif':'Zastąpiony filmem rooftop; nie duplikat bitowy.', 'volcano.gif':'Zastąpiony filmem volcano; nie duplikat bitowy.'}
records=[]
# Exact basename scans include CSS, HTML and JS and unminified/minified build code.
for p in deleted:
    name=pathlib.Path(p).name
    digest=hashlib.sha256(run('git','show',f'{V141}:{p}')).hexdigest()
    dest=byhash.get(digest)
    kind='Przeniesiony bez zmiany bajtów: '+dest if dest else classify.get(name,'Zastąpiony ścieżką dźwiękową wewnątrz MP4.' if '/audio/' in p else 'Przeniesiony do paczki MP4 z obróbką audio; nieidentyczne bajty.')
    scans={}
    for folder in ['game','build','dist']:
        path=ROOT/folder
        if not path.exists(): scans[folder]={'status':'NOT_BUILT','matches':[]};continue
        cmd=['rg','-n','-l','-F','--glob','*.js','--glob','*.mjs','--glob','*.html','--glob','*.css','--glob','*.json',name,folder]
        proc=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True)
        if proc.returncode not in (0,1):raise RuntimeError(proc.stderr)
        scans[folder]={'status':'PASS' if proc.returncode==1 else 'FOUND','matches':proc.stdout.splitlines()}
    records.append(dict(path=p,sha256_141=digest,classification=kind,scans=scans))
(DOC/'deleted-assets-143.json').write_text(json.dumps(records,indent=2)+'\n')
counts=collections.Counter(r['status'] for r in rows)
report=['# Dowody plikowe: wersje 138 i 143','',f'138: `{V138}`. 141 (przed rozdzieleniem paczek): `{V141}`. 143: `{V143}`.','', '## SHA-256','', 'Zakres: wszystkie śledzone pliki `source-assets/` poza `arena-videos/`, oraz wszystkie `game/assets/*-new/` — mastery FBX/klipy, modele, tekstury, a dodatkowo konfiguracje i manifesty. Jest to tabela bajtów przechowywanych w Git, nie dowód identyczności całej logiki renderowania.', '',str(dict(counts)), '', 'Pełne dwie kolumny SHA-256 obok siebie: [TSV](hashes143-v138.tsv), [JSON](hashes143-v138.json).', '', '## Każdy usunięty lokalny plik areny (141 → 143)','', '„Zastąpiony” oznacza usunięcie starego wariantu tej areny. GIF i nowy MP4 nie są identycznymi plikami. Przeniesienie do paczki nie oznacza usunięcia areny.', '', '| Usunięta lokalna ścieżka | Co się stało | rg kod / build / dist |','|---|---|---|']
for r in records: report.append('| `'+r['path']+'` | '+r['classification']+' | '+' / '.join(r['scans'][f]['status'] for f in ['game','build','dist'])+' |')
report += ['', 'Polecenie dla każdego basename: `rg -n -l -F --glob "*.js" --glob "*.mjs" --glob "*.html" --glob "*.css" --glob "*.json" NAZWA game build dist`. PASS oznacza zero trafień (kod wyjścia rg=1), NOT_BUILT brak katalogu. Szczegóły i SHA-256 usuniętych plików: [JSON](deleted-assets-143.json).', '', '## Nazwy dynamiczne', '', 'Sam grep nie dowodzi braku dynamicznie skonstruowanego URL. Dodatkowy `node scripts/audit-deleted-arena-paths.cjs` wykonuje wybór i start każdej z 19 aren w istniejącym harnessie gry, przechwytuje URL przygotowania filmu oraz końcowe src/poster/źródło audio, i porównuje je z usuniętymi ścieżkami. Sprawdza również wszystkie URL-e katalogu i zgodność z manifestami paczki. To pokrywa faktyczną ścieżkę wyboru/startu aren w mock DOM, nie każdą możliwą ścieżkę wykonania w przeglądarce ani stare cache/service worker.', '', 'Powtórzenie: `python3 scripts/audit-asset-evidence.py` oraz `node scripts/audit-deleted-arena-paths.cjs`. Uruchomić ponownie po buildzie, aby uzupełnić jego kolumnę.']
report += ['', '## Pełna tabela SHA-256', '', '| Plik | Wersja 138 | Wersja 143 | Wynik |', '|---|---|---|---|']
for r in rows: report.append('| `'+r['path']+'` | `'+str(r['sha256_138'] or 'MISSING')+'` | `'+str(r['sha256_143'] or 'MISSING')+'` | '+r['status']+' |')
(DOC/'asset-evidence-143.md').write_text('\n'.join(report)+'\n')
print(json.dumps({'hashes':dict(counts),'deletedFiles':len(records),'scans':{f:dict(collections.Counter(r['scans'][f]['status'] for r in records)) for f in ['game','build','dist']}}))
if any(s['status']=='FOUND' for r in records for s in r['scans'].values()):sys.exit(1)
