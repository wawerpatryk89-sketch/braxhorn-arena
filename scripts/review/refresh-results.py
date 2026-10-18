# Re-run selected commands while retaining complete logs from the prior run.
import json,sys,pathlib,subprocess,time,datetime,csv
out=pathlib.Path('docs/review-v147/tests');manifest=json.loads(pathlib.Path('scripts/review/tests.json').read_text());existing=json.loads((out/'main.json').read_text());bytest={r['test']:r for r in existing}
selected=sys.argv[1:]
for r in manifest:
 if r['test'] not in selected:continue
 start=time.time();p=subprocess.run(r['command'],capture_output=True,timeout=1200);name=pathlib.Path(r['test']).name
 (out/(name+'.stdout')).write_bytes(p.stdout);(out/(name+'.stderr')).write_bytes(p.stderr)
 missing=any(x in p.stderr.decode(errors='replace') for x in ['ENOENT','exists on disk, but not in','Not a valid object name','invalid object name','Cannot find module','Cannot find package'])
 status='PASS' if p.returncode==0 else 'NIEWYKONANE' if missing else 'FAIL'
 bytest[r['test']]={**r,'status':status,'reason':'' if status=='PASS' else 'Brak wymaganej zależności, pliku lub obiektu historii.' if missing else 'Niespełniona asercja; szczegóły w stderr.','exit':p.returncode,'seconds':round(time.time()-start,3),'startedUTC':datetime.datetime.fromtimestamp(start,datetime.timezone.utc).isoformat(),'stdout':name+'.stdout','stderr':name+'.stderr'}
 print(status,r['test'],flush=True)
 results=list(bytest.values());(out/'main.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
 with (out/'main.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=list(results[0]));w.writeheader();w.writerows(results)
