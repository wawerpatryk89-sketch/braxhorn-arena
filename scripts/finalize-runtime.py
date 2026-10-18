"""Final independent packaging pass; assert literal asset URLs and remove duplicate encodings."""
from pathlib import Path
from PIL import Image
import re,json
root=Path('build');removed=[]
for p in (root/'assets').glob('*.png'):
 other=p.with_suffix('.webp')
 if not other.exists():continue
 with Image.open(p) as a,Image.open(other) as b:
  assert a.convert('RGBA').tobytes()==b.convert('RGBA').tobytes(),str(p)
 p.unlink();removed.append(p.name)
for name in ['brax-selection.gif','nyxa-selection.gif','vexa-selection.jpeg','danny-portrait.png','danny-portrait.webp']:
 p=root/'assets'/name
 if p.exists():p.unlink();removed.append(name)
missing=[]
for p in [root/'index.html',*(root/'assets').glob('*.js')]:
 for url in re.findall(r'''["'](/assets/[^"'\s?]+\.(?:js|png|webp|jpeg|jpg|gif|mp3|mp4|gz))[?"']''',p.read_text()):
  if '${' in url:continue
  if not (root/url.lstrip('/')).is_file():missing.append({'file':str(p),'url':url})
assert not missing,missing
report={'missingLiteralAssets':missing,'buildBytes':sum(p.stat().st_size for p in root.rglob('*') if p.is_file())}
Path('docs/acceptance').mkdir(parents=True,exist_ok=True)
Path('docs/acceptance/package-check.json').write_text(json.dumps(report,indent=2))
print(json.dumps({**report,'removedDuplicateEncodings':removed}))
