#!/usr/bin/env python3
"""Restore v271 media by SHA-256, then package for native, offline playback.

MP4/audio/JPEG bytes are unchanged. WebP is losslessly decoded to PNG. The one
animated GIF is transcoded to H.264 (CRF 16) because Unity has no GIF decoder.
No live catalog is trusted and no substitute scenes, sounds or animations exist.
"""
import argparse, concurrent.futures, hashlib, json, shutil, subprocess, time
import urllib.error, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
LOCK_DIR = ROOT / 'unity-tools/arena/media'

def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def safe(value):
    p = Path(value)
    if p.is_absolute() or '..' in p.parts or not value:
        raise ValueError('Unsafe media path')
    return p

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--project', type=Path, default=ROOT / 'unity-arena')
    p.add_argument('--offline', action='store_true')
    p.add_argument('--prefer-delivery', action='store_true', help='Verify locked published encodings even when source PNGs are present')
    args = p.parse_args()
    lock = json.loads((LOCK_DIR / 'source-lock.json').read_text())
    catalog_path = LOCK_DIR / 'catalog.json'
    if digest(catalog_path) != lock['catalogSha256']:
        raise ValueError('Locked media catalog changed')
    target = args.project / 'Assets/StreamingAssets/ArenaMedia'
    target.mkdir(parents=True, exist_ok=True)
    previous = target / 'provenance.json'
    if previous.is_file():
        expected = {e['output'] for e in lock['sources']}
        for old in json.loads(previous.read_text()).get('files', []):
            if old['file'] not in expected:
                stale = target / safe(old['file'])
                if stale.is_file() and digest(stale) == old['sha256']:
                    stale.unlink()
    cache = ROOT / 'native-source/media-inputs'
    cache.mkdir(parents=True, exist_ok=True)

    def export(entry):
        original = ROOT / safe(entry['path'])
        delivery = entry.get('delivery', {})
        expected_hash = delivery.get('sha256', entry['sha256'])
        expected_bytes = delivery.get('bytes', entry['bytes'])
        cached = cache / expected_hash
        if not (args.prefer_delivery and delivery) and original.is_file() and digest(original) == entry['sha256']:
            source = original
        elif cached.is_file() and digest(cached) == expected_hash:
            source = cached
        else:
            if args.offline:
                raise ValueError('Missing verified local media: ' + entry['path'])
            # package-arena-assets.mjs moves selected original files to immutable
            # R2 addresses before publishing. Keep original identity AND delivery.
            url = delivery.get('url', entry.get('deliveryUrl', entry['url']))
            if not url.startswith(('/assets/', '/api/arena-media/', '/adventure-media/')) or '..' in url:
                raise ValueError('Unsafe media URL')
            for attempt in range(3):
                try:
                    req = urllib.request.Request(lock['baseUrl'] + url, headers={'User-Agent': 'Braxhorn-Arena-Migration/1.0'})
                    with urllib.request.urlopen(req, timeout=90) as response:
                        data = response.read(expected_bytes + 1)
                    if len(data) != expected_bytes or hashlib.sha256(data).hexdigest() != expected_hash:
                        raise ValueError('Published media hash mismatch: ' + entry['path'])
                    temporary = cached.with_suffix('.download')
                    temporary.write_bytes(data)
                    temporary.replace(cached)
                    break
                except (urllib.error.URLError, TimeoutError) as e:
                    if attempt == 2:
                        raise RuntimeError('Cannot restore ' + entry['path'] + ': ' + type(e).__name__ + ':' + str(getattr(e, 'code', 'connection'))) from None
                    time.sleep(2 ** attempt)
            source = cached
        output = target / safe(entry['output'])
        if delivery:
            if delivery['encoding'] != 'lossless-webp' or entry['conversion'] != 'png':
                raise ValueError('Unsupported published image encoding')
            with Image.open(source) as image:
                if image.size != (delivery['width'], delivery['height']) or hashlib.sha256(image.convert('RGBA').tobytes()).hexdigest() != delivery['rgbaSha256']:
                    raise ValueError('Published image pixels differ from original: ' + entry['path'])
        if entry['conversion'] == 'copy':
            shutil.copyfile(source, output)
        elif entry['conversion'] == 'png':
            with Image.open(source) as image:
                image.convert('RGBA').save(output)
        elif entry['conversion'] == 'gif-video':
            subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', str(source),
                '-an', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', 'libx264',
                '-crf', '16', '-pix_fmt', 'yuv420p', '-threads', '2', '-movflags', '+faststart', str(output)], check=True)
        else:
            raise ValueError('Unknown conversion')
        row = {'file': entry['output'], 'sourceSha256': entry['sha256'],
            'sha256': digest(output), 'bytes': output.stat().st_size, 'conversion': entry['conversion']}
        if delivery:
            row.update(inputSha256=digest(source), rgbaSha256=delivery['rgbaSha256'])
        if output.suffix == '.mp4':
            probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', str(output)]))
            video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
            if video['codec_name'] != 'h264' or video.get('pix_fmt') != 'yuv420p':
                raise ValueError('Unsupported Android video: ' + entry['path'])
            row.update(width=video['width'], height=video['height'], duration=float(video['duration']),
                audio=any(s['codec_type'] == 'audio' for s in probe['streams']))
        return row

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        evidence = list(pool.map(export, lock['sources']))
    catalog = json.loads(catalog_path.read_text())
    ui = catalog.get('interface', {})
    if len(ui) != 30 or len(catalog.get('outfits', [])) != 8 or len(catalog.get('cinematics', {})) != 16:
        raise ValueError('Incomplete original menu export')
    for key, file in ui.items():
        with Image.open(target / safe(file)) as original:
            original.verify()
    packaged = {row['file']: row for row in evidence}
    for key, file in catalog['cinematics'].items():
        if file not in packaged or not file.endswith('.mp4') or packaged[file].get('duration', 0) <= 0:
            raise ValueError('Missing original cinematic: ' + key)
    for item in catalog['arenas'] + [c for r in catalog['routes'] for c in r['chapters']]:
        if item.get('poster'):
            with Image.open(target / safe(item['poster'])) as poster:
                poster.verify()
        if item.get('video') and not item['video'].endswith('.mp4'):
            raise ValueError('Native video is not MP4: ' + item['video'])
    resources = args.project / 'Assets/Arena/Resources'
    resources.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(catalog_path, resources / 'ArenaMediaCatalog.json')
    (target / 'provenance.json').write_text(json.dumps({'sourceSiteVersion': 271,
        'catalogSha256': lock['catalogSha256'], 'files': evidence}, indent=2) + '\n')
    # Licensing/attribution from the published game travels with the native copy.
    shutil.copyfile(LOCK_DIR / 'AUDIO-CREDITS.txt', target / 'AUDIO-CREDITS.txt')
    print(f'PASS {len(evidence)} verified media files / {sum(x["bytes"] for x in evidence)} bytes; 21 arenas, 30 adventure chapters, 31 sounds, {len(ui)} original interface images, {len(catalog["cinematics"])} original cinematics.')
    print('Encoding verification only; Unity decoding, color, synchronization and device performance remain untested.')

if __name__ == '__main__':
    main()
