import subprocess, hashlib, csv
from pathlib import Path
extensions={'.gz','.glb','.gltf','.bin','.fbx','.obj','.png','.webp','.jpg','.jpeg','.gif','.avif','.mp4','.webm','.mp3','.wav','.ogg','.m4a','.aac'}
base='e111aff9c0db723bfeb43d486e3d97efbd86cd5a'
files=subprocess.check_output(['git','ls-files','-z']).decode().split('\0')
rows=[]
for f in files:
 p=Path(f)
 if p.suffix.lower() not in extensions or not p.is_file(): continue
 current=p.read_bytes(); old=subprocess.run(['git','show',f'{base}:{f}'],capture_output=True)
 a=hashlib.sha256(old.stdout).hexdigest() if old.returncode==0 else 'nie wiem'
 b=hashlib.sha256(current).hexdigest()
 rows.append([f,len(current),a,b,'PASS' if a==b else 'FAIL'])
out=Path('docs/review-v147/media-sha256.csv')
with out.open('w') as f:
 w=csv.writer(f);w.writerow(['plik','bajty','sha256_v147','sha256_roboczy','wynik']);w.writerows(rows)
print(len(rows),'files',sum(r[-1]=='FAIL' for r in rows),'FAIL')

raise SystemExit(any(r[-1]=='FAIL' for r in rows))
