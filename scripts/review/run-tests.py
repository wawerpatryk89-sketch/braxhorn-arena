import sys,json,subprocess,time,pathlib,concurrent.futures,csv,datetime
suite=sys.argv[1] if len(sys.argv)>1 else 'all'
rows=json.loads(pathlib.Path('scripts/review/tests.json').read_text())
if suite!='all':rows=[r for r in rows if r['suite']==suite]
out=pathlib.Path('docs/review-v147/tests');out.mkdir(exist_ok=True)
def run(r):
 name=pathlib.Path(r['test']).name;start=time.time();started=datetime.datetime.now(datetime.timezone.utc).isoformat()
 try:
  p=subprocess.run(r['command'],capture_output=True,timeout=1200);code=p.returncode;stdout=p.stdout;stderr=p.stderr
 except subprocess.TimeoutExpired as e:code=124;stdout=e.stdout or b'';stderr=e.stderr or b''
 (out/(name+'.stdout')).write_bytes(stdout);(out/(name+'.stderr')).write_bytes(stderr)
 missing=any(x in stderr.decode(errors='replace') for x in ['ENOENT','exists on disk, but not in','Not a valid object name','invalid object name','Cannot find module','Cannot find package'])
 result={**r,'status':'PASS' if code==0 else 'NIEWYKONANE' if missing else 'FAIL','reason':'' if code==0 else 'Brak wymaganej zależności, pliku lub obiektu historii.' if missing else 'Zachowana asercja nie przeszła; pełny stderr obok.','exit':code,'seconds':round(time.time()-start,3),'startedUTC':started,'stdout':name+'.stdout','stderr':name+'.stderr'}
 print(result['status'],r['test'],result['seconds'],flush=True);return result
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(run,rows))
(out/(suite+'.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2))
with (out/(suite+'.csv')).open('w') as f:
 w=csv.DictWriter(f,fieldnames=list(results[0]));w.writeheader();w.writerows(results)
print(json.dumps({s:sum(r['status']==s for r in results) for s in ['PASS','FAIL','NIEWYKONANE']}))
raise SystemExit(any(r['status']=='FAIL' and r['suite']=='main' for r in results))
