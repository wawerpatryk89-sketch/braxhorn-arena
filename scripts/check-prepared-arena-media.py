"""Verify actual decoded frames, sound and hashed assets; never invent missing arenas."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import csv, hashlib, json, subprocess
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
def run(args):return subprocess.check_output(args,stderr=subprocess.PIPE)
def check(row):
    path=ROOT/'arena-media/loops'/row['file'];data=path.read_bytes()
    assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256'],row['id']+' SHA/size'
    streams=json.loads(run(['ffprobe','-v','error','-show_streams','-of','json',str(path)]))['streams']
    video=next(s for s in streams if s['codec_type']=='video');audio=[s for s in streams if s['codec_type']=='audio']
    raw=run(['ffmpeg','-v','error','-threads','2','-i',str(path),'-map','0:v:0','-vf','scale=160:90,format=rgb24','-fps_mode','passthrough','-f','rawvideo','-'])
    frames=np.frombuffer(raw,np.uint8).reshape(-1,90,160,3).astype(np.float32)
    seam=float(np.abs(frames[-1]-frames[0]).mean());p95=float(np.percentile(np.abs(np.diff(frames,axis=0)).mean(axis=(1,2,3)),95))
    assert seam<=p95,row['id']+' seam larger than normal frame movement'
    report={'id':row['id'],'file':row['file'],'bytes':len(data),'sha256':row['sha256'],'frames':len(frames),'duration':float(video['duration']),'width':video['width'],'seamMeanRGBDelta':round(seam,4),'normalP95RGBDelta':round(p95,4),'seamToP95':round(seam/max(.0001,p95),4),'passes':True}
    if row.get('kind')=='preview':
        assert video['width']==640 and len(data)<=1000000 and not audio,row['id']+' lightweight silent preview'
        report['silent']=True
    else:
        assert len(audio)==1,row['id']+' original soundtrack missing'
        gap=abs(float(video['duration'])-float(audio[0]['duration']))*1000;assert gap<1,row['id']+' A/V end gap'
        pcm=np.frombuffer(run(['ffmpeg','-v','error','-threads','2','-i',str(path),'-map','0:a:0','-ar','8000','-ac','1','-f','f32le','-']),np.float32)[:round(float(audio[0]['duration'])*8000)]
        rms=float(np.sqrt(np.mean(pcm**2)));assert rms>.00001,row['id']+' silent soundtrack'
        report.update(audioRms=rms,avEndDifferenceMs=round(gap,5))
        for name in [row['poster'],row['poster'].replace('.webp','-thumb.webp')]:
            image=(ROOT/'game/assets'/name).read_bytes();assert image[:4]==b'RIFF' and image[8:12]==b'WEBP',name+' not a real WebP'
    print('PASS '+row['id']+' native frame seam / SHA / media',flush=True);return report

fight=json.loads((ROOT/'arena-media/manifest.json').read_text());selection=json.loads((ROOT/'arena-media/selection-manifest.json').read_text());pending=json.loads((ROOT/'arena-media/pending-sources.json').read_text())['arenas']
with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(check,fight+selection['previews']))
out=ROOT/'docs/verification/arena-live';out.mkdir(parents=True,exist_ok=True)
proof={'status':'prepared-media-checks-pass','catalogueComplete':len(fight)==21,'expectedArenas':21,'preparedArenas':len(fight),'missingSources':pending,'method':'Native decoded frames in playback order, scaled to 160x90 RGB. Last-to-first mean absolute difference <= adjacent-frame P95. No duration-based frame omission.','measurements':results,'limitations':['Numeric image seam check; visual playback is recorded separately.','Not a physical-device or Safari test.','Not deployed.']}
(out/'media-check.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
before={r['id']:r for r in json.loads((ROOT/'arena-media/loop-check.json').read_text())['measurements']}
with (out/'loop-table.csv').open('w') as fp:
    writer=csv.writer(fp);writer.writerow(['arena','status','before_seam_to_p95','after_seam_to_p95','duration_seconds','cut_start_seconds','cut_end_seconds','crossfade_seconds'])
    for row in fight:
        m=before[row['id']];after=next(r for r in results if r['id']==row['id']);writer.writerow([row['label'],'PREPARED',m['before']['seamToP95'],after['seamToP95'],after['duration'],m['cut']['startSeconds'],m['cut']['endSeconds'],m['cut']['crossfadeSeconds']])
    for row in pending:writer.writerow([row['label'],'MISSING SOURCE','','','','','',''])
print(json.dumps({'prepared':len(fight),'missing':len(pending),'checks':len(results),'published':False}))
