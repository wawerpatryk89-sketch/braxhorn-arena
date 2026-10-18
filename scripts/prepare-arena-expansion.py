"""Add seven source-resolution, source-rate loops; retain original embedded sound.
No scaling or fps conversion. 0.7 s overlap at the seam; CRF 14 matches existing pack.
"""
from pathlib import Path
import subprocess,json,hashlib,shutil
ROOT=Path(__file__).resolve().parents[1]
ITEMS=[('0ab33751','carrier','LOTNISKOWIEC'),('7f1b5369','canyon','WIELKI KANION'),('b82e7a59','reactor','REAKTOR'),('c0dcf1f8','savanna','SAWANNA'),('dd428520','brooklyn','BROOKLYN'),('e2bf6649','dragon','SMOCZA TWIERDZA'),('ea5ff01e','aquarium','AKWARIUM')]
def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
def run(args):subprocess.run(['ffmpeg','-v','error','-y',*args],check=True)
rows=json.loads((ROOT/'arena-media/manifest.json').read_text())
for prefix,key,label in ITEMS:
 source=next((ROOT.parent/'upload').glob('*'+prefix+'*.mp4'))
 original=ROOT/'source-assets/arena-videos'/f'{key}-original.mp4';shutil.copy2(source,original)
 meta=probe(source);v=next(s for s in meta['streams'] if s['codec_type']=='video');a=next(s for s in meta['streams'] if s['codec_type']=='audio')
 duration=min(float(v['duration']),float(a['duration']));fade=.7;offset=duration-2*fade
 output=ROOT/'arena-media/loops'/f'{key}.mp4'
 filters=f'[0:v]trim=end={duration},split[v0][v1];[v0]trim=start={fade},setpts=PTS-STARTPTS[main];[v1]trim=end={fade},setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration={fade}:offset={offset},format=yuv420p[v];[0:a]atrim=end={duration},asplit[a0][a1];[a0]atrim=start={fade},asetpts=PTS-STARTPTS[am];[a1]atrim=end={fade},asetpts=PTS-STARTPTS[ah];[am][ah]acrossfade=d={fade}:c1=tri:c2=tri[a]'
 run(['-threads','2','-filter_complex_threads','1','-i',str(source),'-filter_complex',filters,'-map','[v]','-map','[a]','-c:v','libx264','-crf','14','-preset','slow','-threads','2','-c:a','aac','-b:a','192k','-movflags','+faststart',str(output)])
 digest=hashlib.sha256(output.read_bytes()).hexdigest();final=output.with_name(f'{key}.{digest[:12]}.mp4');output.rename(final)
 poster=ROOT/'game/assets'/f'arena-{key}-20261018.webp';thumb=poster.with_name(poster.stem+'-thumb.webp')
 run(['-i',str(final),'-frames:v','1','-c:v','libwebp','-lossless','1',str(poster)])
 run(['-i',str(final),'-frames:v','1','-vf','scale=480:-1','-c:v','libwebp','-quality','90',str(thumb)])
 out=probe(final);ov=next(s for s in out['streams'] if s['codec_type']=='video')
 rows=[r for r in rows if r['id']!=key]+[{'id':key,'label':label,'file':final.name,'sha256':digest,'bytes':final.stat().st_size,'originalBytes':source.stat().st_size,'poster':poster.name,'duration':float(ov['duration']),'fps':30,'width':v['width'],'height':v['height'],'audio':True,'overlapSeconds':fade}]
 (ROOT/'arena-media/manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 print(key,final.stat().st_size,flush=True)

# PCM seam mux also validates the original audio path; avoids short-head acrossfade loss.
subprocess.run(["python", "scripts/repair-arena-audio.py"],check=True)
