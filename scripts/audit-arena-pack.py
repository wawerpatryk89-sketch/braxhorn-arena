"""Validate deployable arena bytes, soundtrack signal and original dimensions/rate."""
from pathlib import Path
import json,subprocess,hashlib
import numpy as np
root=Path(__file__).resolve().parents[1]
def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(p)]))['streams']
report=[]
for row in json.loads((root/'arena-media/manifest.json').read_text()):
 p=root/'arena-media/loops'/row['file']; assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256']; assert p.stat().st_size<24*1024*1024
 streams=probe(p);v=next(s for s in streams if s['codec_type']=='video');a=next(s for s in streams if s['codec_type']=='audio')
 source=root/'source-assets/arena-videos'/f"{row['id']}-original.mp4"
 if source.exists():
  ov=next(s for s in probe(source) if s['codec_type']=='video');assert (v['width'],v['height'],v['r_frame_rate'])==(ov['width'],ov['height'],ov['r_frame_rate'])
 pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-map','0:a:0','-ar','8000','-ac','1','-f','f32le','-']),dtype=np.float32);rms=float(np.sqrt(np.mean(pcm**2)));assert rms>0.00001, row['id']+' silent'
 # Tiny luma decode gives seam discontinuity beside typical per-frame motion.
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-vf','scale=160:90,format=gray','-f','rawvideo','-']);frames=np.frombuffer(raw,dtype=np.uint8).reshape(-1,90,160).astype(float)
 seam=float(np.abs(frames[-1]-frames[0]).mean());adj=np.abs(np.diff(frames,axis=0)).mean(axis=(1,2))
 report.append({'id':row['id'],'status':'PASS','width':v['width'],'height':v['height'],'fps':v['r_frame_rate'],'audioRms':round(rms,5),'seamLumaDifference':round(seam,3),'adjacentFrameP95':round(float(np.percentile(adj,95)),3),'bytes':p.stat().st_size})
for row in json.loads((root/'arena-media/assets-manifest.json').read_text()):
 p=root/'arena-media/loops'/row['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256']
 if row['kind']=='audio':assert any(s['codec_type']=='audio' for s in probe(p))
(root/'arena-media/validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'status':'PASS','videoCount':len(report),'checks':['SHA256','24MiB ceiling','audio present and non-silent','original source dimensions and frame rate','GIF/audio immutable hashes'],'seams':'measured, not a guarantee of invisible transition'},indent=2))
