"""Upload secret and Sites service credential arrive only over hidden stdin."""
import sys,json,termios,hashlib,subprocess,argparse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
if sys.stdin.isatty():
 t=termios.tcgetattr(sys.stdin);t[3]&=~termios.ECHO;termios.tcsetattr(sys.stdin,termios.TCSANOW,t)
print('Ready for upload configuration on hidden stdin.',flush=True)
config=json.loads(sys.stdin.readline())
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--manifest',type=Path)
args=parser.parse_args()
def request(url,path=None,headers=None):
 args=['curl','--silent','--show-error','--max-time','120','--config','-','--write-out','\n%{http_code}',url]
 if path:args+=['--upload-file',str(path)]
 settings=''.join('header = '+json.dumps(k+': '+v)+'\n' for k,v in (headers or {}).items())
 result=subprocess.run(args,input=settings.encode(),stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True)
 body,code=result.stdout.rsplit(b'\n',1);return int(code),body
def upload(row):
 path=Path('arena-media/loops')/row['file'];url=config['origin']+'/api/arena-media/'+row['file'];body=path.read_bytes()
 assert len(body)==row['bytes'] and hashlib.sha256(body).hexdigest()==row['sha256'],row['id']+' local media mismatch'
 headers={'Authorization':'Bearer '+config['token'],'Content-Type':{'mp4':'video/mp4','gif':'image/gif','mp3':'audio/mpeg','webp':'image/webp'}[path.suffix[1:]]}
 if config.get('siteAuth'):headers['OAI-Sites-Authorization']='Bearer '+config['siteAuth']
 status,_=request(url,path,headers)
 if status not in (201,409):raise RuntimeError('Upload '+row['id']+' HTTP '+str(status))
 code,check=request(url,headers={'Range':'bytes=0-1023'});assert code==206,(row['id'],code);assert check==body[:1024]
 code,full=request(url);assert code==200;assert hashlib.sha256(full).hexdigest()==row['sha256']
 print(json.dumps({'arena':row['id'],'uploaded':status,'range':'PASS','sha256':'PASS','bytes':len(body)}),flush=True)
rows=json.loads(args.manifest.read_text()) if args.manifest else json.loads(Path('arena-media/manifest.json').read_text()) + json.loads(Path('arena-media/assets-manifest.json').read_text())
with ThreadPoolExecutor(max_workers=3) as pool:
 list(pool.map(upload,rows))
print('ALL ARENA MEDIA VERIFIED',flush=True)
