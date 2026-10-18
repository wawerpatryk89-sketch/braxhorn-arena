"""Measure media seam independently of the mock player; no device playback claim."""
from pathlib import Path
import json,subprocess,numpy as np
root=Path(__file__).resolve().parents[1];rows=[]
for r in json.loads((root/'arena-media/manifest.json').read_text()):
 p=root/'arena-media/loops'/r['file']
 streams=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(p)]))['streams']
 v=next(s for s in streams if s['codec_type']=='video');a=next(s for s in streams if s['codec_type']=='audio');gap=abs(float(v['duration'])-float(a['duration']))*1000
 assert gap<1,r['id']+' unequal audio/video end'
 pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-map','0:a','-ar','8000','-ac','1','-f','f32le','-']),dtype=np.float32)
 # AAC decode can include encoder padding beyond the MP4 edit-list duration.
 pcm=pcm[:round(float(a['duration'])*8000)]
 frames=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-vf','scale=160:90,format=gray','-f','rawvideo','-']),dtype=np.uint8).reshape(-1,90,160).astype(float)
 delta=np.abs(np.diff(frames,axis=0)).mean(axis=(1,2))
 rows.append({'id':r['id'],'avEndDifferenceMs':round(gap,5),'seamLumaDifference':round(float(np.abs(frames[-1]-frames[0]).mean()),3),'adjacentFrameP95':round(float(np.percentile(delta,95)),3),'audioSeamSampleDelta':round(float(abs(pcm[-1]-pcm[0])),6),'audioHead100msRms':round(float(np.sqrt(np.mean(pcm[:800]**2))),6),'audioTail100msRms':round(float(np.sqrt(np.mean(pcm[-800:]**2))),6)})
out={'status':'PASS','checks':['audio/video ends differ less than 1 ms'],'measurements':rows,'limitations':'Seam differences measured, not guaranteed imperceptible. Decoder seek latency, real audio output and phone Safari not measured.'}
(root/'docs/verification/arena-loop-media.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
