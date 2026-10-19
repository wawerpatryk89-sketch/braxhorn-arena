"""Restore existing source ambience to prepared loops; copy encoded video unchanged.

No network requests, new sound generation, preview changes, or intro changes.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse, hashlib, json, subprocess, tempfile
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RATE = 48000

def run(args):
    return subprocess.check_output(args, stderr=subprocess.PIPE)

def probe(path):
    return json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', str(path)]))['streams']

def packet_hash(path):
    return run(['ffmpeg', '-v', 'error', '-threads', '2', '-i', str(path), '-map', '0:v:0', '-c:v', 'copy', '-f', 'hash', '-hash', 'sha256', '-']).decode().strip().split('=')[1]

def pcm(path):
    return np.frombuffer(run(['ffmpeg', '-v', 'error', '-threads', '2', '-i', str(path), '-map', '0:a:0', '-ar', str(RATE), '-ac', '2', '-f', 'f32le', '-']), dtype=np.float32).reshape(-1, 2)

def repair(row, check, sources):
    original = ROOT / 'arena-media/loops' / row['file']
    source_name = {'nocny-targ': 'market-audio.289063ea7ff3.mp3', 'metro': 'metro-audio.1b15d86dfad5.mp3', 'harbor': 'harbor-audio.27e013706a8f.mp3'}.get(row['id'], check['source'])
    source = sources / source_name
    assert source.is_file(), 'Missing original source audio: ' + str(source)
    before_packet_hash = packet_hash(original)
    source_pcm = pcm(source)
    assert float(np.sqrt(np.mean(source_pcm ** 2))) > .00001, row['id'] + ' source is silent'
    start = round(check['cut']['startSeconds'] * RATE)
    end = round(check['cut']['endSeconds'] * RATE)
    fade = round(check['cut']['crossfadeSeconds'] * RATE)
    # Read the encoded frame count. A concatenated MP4 can omit the final packet
    # duration, which makes a duration-based fps filter drop its last frame.
    picture = next(s for s in probe(original) if s['codec_type'] == 'video')
    frames = int(picture['nb_frames'])
    count = round(frames / row['fps'] * RATE)
    assert len(source_pcm) >= end and end - start - fade >= count - 4
    # Match the prepared picture's tail/head overlap, then its recorded phase rotation.
    output = source_pcm[start + fade:start + fade + count].copy()
    assert len(output) == count and fade < count
    weights = np.linspace(0, 1, fade, endpoint=False, dtype=np.float32)[:, None]
    output[-fade:] = output[-fade:] * (1 - weights) + source_pcm[start:start + fade] * weights
    pivot = round(check['cut'].get('rotationFrames', 0) / row['fps'] * RATE)
    output = np.roll(output, -pivot, axis=0)
    peak = float(np.abs(output).max())
    gain = min(1.0, .98 / max(peak, 1e-12))
    output *= gain
    with tempfile.TemporaryDirectory(prefix='arena-audio-') as tmp:
        audio = Path(tmp) / 'source.f32'
        target = Path(tmp) / 'mux.mp4'
        audio.write_bytes(output.astype(np.float32).tobytes())
        # The prepared concatenated picture had missing packet durations in some files.
        # Set the existing 30fps cadence in the container, without encoding video.
        run(['ffmpeg', '-v', 'error', '-y', '-threads', '2', '-i', str(original), '-f', 'f32le', '-ar', str(RATE), '-ac', '2', '-i', str(audio),
             '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-r', str(row['fps']), '-video_track_timescale', '30000',
             '-c:a', 'aac', '-b:a', '192k', '-movie_timescale', str(RATE), '-movflags', '+faststart', str(target)])
        after_packet_hash = packet_hash(target)
        assert before_packet_hash == after_packet_hash, row['id'] + ' video packets changed'
        streams = probe(target)
        video = next(s for s in streams if s['codec_type'] == 'video')
        sound = next(s for s in streams if s['codec_type'] == 'audio')
        gap = abs(float(video['duration']) - float(sound['duration'])) * 1000
        assert gap < 1, row['id'] + ' A/V end gap'
        decoded = pcm(target)[:round(float(sound['duration']) * RATE)]
        rms = float(np.sqrt(np.mean(decoded ** 2)))
        assert rms > .00001, row['id'] + ' repaired audio is silent'
        raw = target.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        name = row['id'] + '.' + digest[:12] + '.mp4'
        (original.parent / name).write_bytes(raw)
    report = {'id': row['id'], 'beforeFile': row['file'], 'afterFile': name,
              'sourceAudio': source_name, 'sourceAudioSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
              'videoPacketSha256Before': before_packet_hash, 'videoPacketSha256After': after_packet_hash,
              'videoPacketsUnchanged': True, 'audioGain': gain, 'audioRms': rms, 'audioPeak': float(np.abs(decoded).max()),
              'audioSeamSampleDelta': float(np.abs(decoded[-1] - decoded[0]).max()),
              'audioAdjacentSampleP95': float(np.percentile(np.abs(np.diff(decoded, axis=0)), 95)),
              'audioHead100msRms': float(np.sqrt(np.mean(decoded[:RATE // 10] ** 2))),
              'audioTail100msRms': float(np.sqrt(np.mean(decoded[-RATE // 10:] ** 2))),
              'avEndDifferenceMs': gap, 'videoDuration': float(video['duration']), 'audioDuration': float(sound['duration'])}
    result = {**row, 'file': name, 'sha256': digest, 'bytes': len(raw), 'audio': True, 'duration': frames / row['fps']}
    print(row['id'] + ': source audio restored; identical video packet hash; A/V gap ' + str(round(gap, 5)) + ' ms', flush=True)
    return result, report

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sources', type=Path, required=True)
    args = parser.parse_args()
    manifest_path = ROOT / 'arena-media/manifest.json'
    manifest = json.loads(manifest_path.read_text())
    checks = {r['id']: r for r in json.loads((ROOT / 'arena-media/loop-check.json').read_text())['measurements']}
    with ThreadPoolExecutor(max_workers=3) as pool:
        result = list(pool.map(lambda row: repair(row, checks[row['id']], args.sources), manifest))
    new_rows, reports = map(list, zip(*result))
    manifest_path.write_text(json.dumps(new_rows, ensure_ascii=False, indent=2) + '\n')
    selection_path = ROOT / 'arena-media/selection-manifest.json'
    selection = json.loads(selection_path.read_text())
    selection['fight'] = new_rows
    selection_path.write_text(json.dumps(selection, ensure_ascii=False, indent=2) + '\n')
    catalog_path = ROOT / 'game/assets/arena-catalog.js'
    catalog = json.loads(catalog_path.read_text().split(' = ', 1)[1].rstrip(';\n'))
    for row in new_rows:
        catalog[row['id']]['video'] = '/api/arena-media/' + row['file']
    catalog_path.write_text('window.BRAX_ARENA_VIDEOS = ' + json.dumps(catalog, ensure_ascii=False, indent=2) + ';\n')
    out = ROOT / 'docs/verification/arena-media-checkpoint/audio-repair.json'
    out.write_text(json.dumps({'status': 'PASS', 'checks': ['existing source audio only', 'unchanged encoded video packets', 'audible soundtrack', 'A/V end difference below 1 ms'], 'videoCount': len(reports), 'measurements': reports, 'previewChanges': 0, 'introChanges': 0, 'limitations': 'No physical-phone speaker or headphone audition performed.'}, indent=2) + '\n')

if __name__ == '__main__':
    main()
