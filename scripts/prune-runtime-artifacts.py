"""Prune only obsolete encodings in deployment staging immediately before packaging."""
from pathlib import Path
root=Path('build')
code='\n'.join(p.read_text() for p in root.rglob('*') if p.suffix in ('.html','.js','.css'))
retired=['brax-selection.gif','nyxa-selection.gif','vexa-selection.jpeg','danny-portrait.png']
for name in retired:
 assert name not in code,name
 (root/'assets'/name).unlink(missing_ok=True)
for p in (root/'assets').glob('*.png'):
 if p.with_suffix('.webp').exists():
  assert p.name not in code,p.name
  p.unlink()
size=sum(p.stat().st_size for p in root.rglob('*') if p.is_file())
assert size<267000000,size
print('Verified staging bytes:',size)
