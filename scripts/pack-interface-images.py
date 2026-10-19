"""Encode deployment images; retain exact pixels except new menu photography."""
from pathlib import Path
from PIL import Image
import io, json
saved=0
replacements={}
for p in Path('build/assets').glob('*.png'):
 with Image.open(p) as im:
  rgba=im.convert('RGBA');out=io.BytesIO()
  photo=p.name=='multiplayer-duel-premium.png'
  if photo:rgba.save(out,format='WEBP',quality=96,method=6)
  else:rgba.save(out,format='WEBP',lossless=True,method=6,exact=True)
  data=out.getvalue()
  with Image.open(io.BytesIO(data)) as check:
   assert check.size==rgba.size,str(p)
   if not photo:assert check.convert('RGBA').tobytes()==rgba.tobytes(),str(p)
 if len(data)>=p.stat().st_size:continue
 target=p.with_suffix('.webp');target.write_bytes(data);saved+=p.stat().st_size-len(data);replacements[p.name]=target.name;p.unlink()
for p in Path('build').rglob('*'):
 if p.suffix not in ('.html','.css','.js','.json'):continue
 text=p.read_text()
 for old,new in replacements.items():text=text.replace(old,new)
 p.write_text(text)
# Remove any source encoding retained by the workspace copy layer.
for name in replacements:
 p=Path('build/assets')/name
 if p.exists():p.unlink()
print(json.dumps({'losslessWebpBytesSaved':saved,'files':len(replacements),'replacements':replacements}))
