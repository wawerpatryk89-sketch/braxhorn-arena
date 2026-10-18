"""Upload secret and Sites service credential arrive only over hidden stdin."""
import sys,json,termios,hashlib,subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
if sys.stdin.isatty():
 t=termios.tcgetattr(sys.stdin);t[3]&=~termios.ECHO;termios.tcsetattr(sys.stdin,termios.TCSANOW,t)
print('Ready for upload configuration on hidden stdin.',flush=True)
config=json.loads(sys.stdin.readline())
def request(url,path=None,headers=None):
 args=['curl','--silent','--show-error','--max-time','120','--config','-','--write-out','\n%{http_code}',url]
 if path:args+=['--upload-file',str(path)]
 settings=''.join('header = '+json.dumps(k+': '+v)+'\n' for k,v in (headers or {}).items())
 result=subprocess.run(args,input=settings.encode(),stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True)
 body,code=result.stdout.rsplit(b'\n',1);return int(code),body
def upload(row):
 path=Path('fighter-package')/row['file'];url=config['origin']+'/api/fighter-media/'+row['file'];body=path.read_bytes()
 status,_=request(url,path,{'Authorization':'Bearer '+config['token'],'OAI-Sites-Authorization':'Bearer '+config['siteAuth'],'Content-Type':{'gz':'application/gzip','webp':'image/webp'}[path.suffix[1:]]})
 if status not in (201,409):raise RuntimeError('Upload '+row['who']+'/'+row['name']+' HTTP '+str(status))
 code,check=request(url,headers={'Range':'bytes=0-1023'});assert code==206,(row['who']+'/'+row['name'],code);assert check==body[:1024]
 code,full=request(url);assert code==200;assert hashlib.sha256(full).hexdigest()==row['sha256']
 print(json.dumps({'fighter':row['who']+'/'+row['name'],'uploaded':status,'range':'PASS','sha256':'PASS','bytes':len(body)}),flush=True)
with ThreadPoolExecutor(max_workers=3) as pool:
 rows=json.loads(Path('fighter-package/manifest.json').read_text())
 if config.get('fighters'):rows=[r for r in rows if r['who'] in config['fighters']]
 list(pool.map(upload,rows))
print('ALL FIGHTER MEDIA VERIFIED',flush=True)
