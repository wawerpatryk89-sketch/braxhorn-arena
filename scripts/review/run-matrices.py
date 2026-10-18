import concurrent.futures, os, subprocess, json, time
from pathlib import Path
out=Path('docs/review-v147/simulation')
env=dict(os.environ, BRAX_REVIEW_ENGINE=str(out/'combat-candidate-v2.js'))
def run(job):
 variant,slot=job
 names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON']
 dest=Path('docs/review-v147/variants')/variant/f'matrix-normal-{names[slot]}.json'
 if dest.exists() and len(json.loads(dest.read_text()))==800:return dict(variant=variant,slot=slot,exitCode=0,cached=True)
 log=out/f'matrix-{variant}-{slot}.log'; start=time.time()
 with log.open('w') as f:
  p=subprocess.run(['node','--expose-gc','scripts/review/matrix.cjs',variant,'100',str(slot),'normal'],env=env,stdout=f,stderr=subprocess.STDOUT)
 result=dict(variant=variant,slot=slot,exitCode=p.returncode,seconds=time.time()-start)
 print(json.dumps(result),flush=True)
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 results=list(pool.map(run,[(v,s) for v in ['A','B'] for s in range(8)]))
(out/'matrix-executions.json').write_text(json.dumps(results,indent=2))
raise SystemExit(any(r['exitCode'] for r in results))
