import sys,csv,json,subprocess,time,pathlib,ast,concurrent.futures
source=pathlib.Path('/workspace/scratch/de5ed6fc2c9c/audit-package/09-testy/wyniki-koncowe.csv')
rows=[r for r in csv.DictReader(source.open()) if r['status']=='FAIL']
out=pathlib.Path('docs/review-v147/'+(sys.argv[1] if len(sys.argv)>1 else 'after'));out.mkdir(parents=True,exist_ok=True)
def run(r):
 cmd=ast.literal_eval(r['command']);name=pathlib.Path(r['test']).name;t=time.time()
 try:
  p=subprocess.run(cmd,capture_output=True,timeout=120);code=p.returncode;stdout=p.stdout;stderr=p.stderr
 except subprocess.TimeoutExpired as e:code=124;stdout=e.stdout or b'';stderr=e.stderr or b''
 (out/(name+'.stdout')).write_bytes(stdout);(out/(name+'.stderr')).write_bytes(stderr)
 return {'test':r['test'],'command':cmd,'exit':code,'seconds':round(time.time()-t,3),'status':'PASS' if code==0 else 'FAIL','stderr':stderr.decode(errors='replace')[:3000]}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 results=list(pool.map(run,rows))
(out/'failures.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps({'count':len(results),'pass':sum(r['exit']==0 for r in results)}))
