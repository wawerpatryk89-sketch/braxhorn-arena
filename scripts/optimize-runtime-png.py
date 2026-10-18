"""Lossless PNG re-encoding for the deployment size limit; verify every pixel."""
from pathlib import Path
from PIL import Image
import io
saved = 0
for p in Path('build/assets').glob('*.png'):
    original = p.read_bytes()
    with Image.open(io.BytesIO(original)) as im:
        pixels = im.convert('RGBA').tobytes()
        out = io.BytesIO()
        im.save(out, format='PNG', optimize=True, compress_level=9)
    data = out.getvalue()
    with Image.open(io.BytesIO(data)) as check:
        assert check.convert('RGBA').tobytes() == pixels, str(p)
    if len(data) < len(original):
        p.write_bytes(data)
        saved += len(original) - len(data)
print({'losslessPngBytesSaved': saved})
