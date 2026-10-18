from PIL import Image
from pathlib import Path
import shutil,json
for d in sorted(Path('game/assets').glob('*-new')):
 if not (d/'model.json.gz').exists():continue
 for n in ['color','normal','roughness','metalness']:
  p=d/(n+'.png');q=d/(n+'.webp')
  if not p.exists():continue
  im=Image.open(p).convert('RGBA');im.save(q,format='WEBP',lossless=True,quality=100,method=4,exact=True)
  out=Image.open(q).convert('RGBA');assert im.size==out.size and im.tobytes()==out.tobytes(),str(p)
  backup=Path('source-assets')/d.name/'textures';backup.mkdir(parents=True,exist_ok=True);shutil.move(p,backup/p.name)
  print(d.name,n,q.stat().st_size,flush=True)
