from pathlib import Path
import subprocess,zipfile,hashlib,csv,io
root=Path('docs/review-v147');dest=Path('Braxhorn-poprawki-v147-do-przegladu.zip');items=[]
for p in root.rglob('*'):
 if not p.is_file() or p.suffix=='.zip':continue
 rel=p.relative_to(root).as_posix()
 if rel in ['tests/all.json','tests/all.csv']:continue
 items.append((p,rel))
changed=subprocess.check_output(['git','diff','--name-only'],text=True).splitlines();new=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],text=True).splitlines()
changed += [p for p in new if p.startswith(('scripts/review/','backend/','game/assets/compatibility.js','drizzle/'))]
allowed={'.js','.cjs','.mjs','.ts','.tsx','.json','.sql','.py','.md','.txt','.html','.css','.toml','.yaml','.yml'}
for name in sorted(set(changed)):
 p=Path(name)
 if p.is_file() and p.suffix in allowed and not name.startswith('docs/review-v147/'):items.append((p,'zmiany-kodu/'+name))
rows=[]
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p,name in items:
  data=p.read_bytes();z.writestr(name,data);rows.append([name,len(data),hashlib.sha256(data).hexdigest()])
 text=io.StringIO();w=csv.writer(text);w.writerow(['plik','bajty','sha256']);w.writerows(rows);z.writestr('manifest-pakietu.csv',text.getvalue())
with zipfile.ZipFile(dest) as z:
 assert z.testzip() is None
 assert all(Path(n).suffix not in {'.gz','.glb','.gltf','.fbx','.png','.webp','.jpg','.jpeg','.gif','.mp4','.mp3','.ogg','.wav'} for n in z.namelist())
assert dest.stat().st_size<30_000_000
print(dest.resolve(),dest.stat().st_size,'bytes',len(items),'files',hashlib.sha256(dest.read_bytes()).hexdigest())
