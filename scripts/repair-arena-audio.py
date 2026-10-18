"""Mux original source sound with deterministic PCM overlap; copy video losslessly.
ffmpeg acrossfade may return no samples when its second input equals its overlap.
"""
from pathlib import Path
import numpy as np
import json,subprocess,hashlib,tempfile
ROOT=Path(__file__).resolve().parents[1];manifest=ROOT/'arena-media/manifest.json';rows=json.loads(manifest.read_text());rate=48000
for row in rows:
 source=ROOT/'source-assets/arena-videos'/f"{row['id']}-original.mp4"
 if not source.exists():continue
 video=ROOT/'arena-media/loops'/row['file'];streams=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(video)]))['streams'];v=next(s for s in streams if s['codec_type']=='video');duration=float(v['duration']);n=round(duration*rate);fade=round(.7*rate)
 pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-map','0:a:0','-ar',str(rate),'-ac','2','-f','f32le','-']),dtype=np.float32).reshape(-1,2)
 # Video starts at source .7s and ends by blending the source opening .7s.
 output=pcm[fade:fade+n].copy()
 if len(output)<n:output=np.pad(output,((0,n-len(output)),(0,0)))
 w=np.linspace(0,1,fade,endpoint=False,dtype=np.float32)[:,None];output[-fade:]=output[-fade:]*(1-w)+pcm[:fade]*w
 # Raise the exceptionally quiet original temple recording by 30 dB.
 if row['id']=='temple':output*=10**(30/20)
 assert np.max(np.abs(output))<1, row['id']+' clipping'
 with tempfile.TemporaryDirectory() as tmp:
  audio=Path(tmp)/'sound.f32';audio.write_bytes(output.astype(np.float32).tobytes());dest=Path(tmp)/'mux.mp4'
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(video),'-f','f32le','-ar',str(rate),'-ac','2','-i',str(audio),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(dest)],check=True)
  data=dest.read_bytes();sha=hashlib.sha256(data).hexdigest();target=video.with_name(f"{row['id']}.{sha[:12]}.mp4");target.write_bytes(data)
  if target!=video:video.unlink()
  row.update(file=target.name,sha256=sha,bytes=len(data),audio=True)
 print(row['id'],'sound muxed',flush=True)
manifest.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
