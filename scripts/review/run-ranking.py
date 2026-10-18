import concurrent.futures, os, subprocess, json,time
from pathlib import Path
out=Path('docs/review-v147/simulation');env=dict(os.environ,BRAX_REVIEW_ENGINE=str(out/'combat-candidate-v6.js'))
def run(job):
 level,slot=job;start=time.time()
 names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON']
 dest=Path('docs/review-v147/variants/CURRENT')/f'matrix-{level}-{names[slot]}.json'
 if dest.exists() and len(json.loads(dest.read_text()))==200:return dict(level=level,slot=slot,exitCode=0,cached=True)
 with (out/f'ranking-{level}-{slot}.log').open('w') as f:p=subprocess.run(['node','scripts/review/ranking-simulation.cjs',str(slot),level],env=env,stdout=f,stderr=subprocess.STDOUT)
 r=dict(level=level,slot=slot,exitCode=p.returncode,seconds=time.time()-start);print(json.dumps(r),flush=True);return r
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(run,[(l,s) for l in ['normal','hard','easy'] for s in range(8)]))
(out/'ranking-executions.json').write_text(json.dumps(results,indent=2))
raise SystemExit(any(r['exitCode'] for r in results))
