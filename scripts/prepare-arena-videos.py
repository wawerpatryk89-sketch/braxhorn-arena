from pathlib import Path
import subprocess,json,hashlib,shutil
items=[('0781df41','rooftop','DACH · BURZA'),('a929953f','rooftop-city','DACH · METROPOLIA'),('4465b2a1','jungle','DŻUNGLA'),('85876a5f','volcano','KUŹNIA WULKANU'),('23d8168f','temple','ŚWIĄTYNIA SAKURY'),('439e8ef3','himalaya','HIMALAJE'),('3e69677b','beach','PLAŻA')]
rows=[]
for prefix,key,label in items:
 source=next(Path('../upload').glob('*'+prefix+'*.mp4'));original=Path('source-assets/arena-videos')/(key+'-original.mp4');shutil.copy2(source,original)
 output=Path('arena-media/loops')/(key+'.mp4')
 # End blends into the opening 0.7s; restart continues from 0.7s.
 filters='[0:v]trim=end=8,split[v0][v1];[v0]trim=start=0.7,setpts=PTS-STARTPTS[main];[v1]trim=end=0.7,setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration=0.7:offset=6.6,format=yuv420p[v];[0:a]atrim=end=8,asplit[a0][a1];[a0]atrim=start=0.7,asetpts=PTS-STARTPTS[am];[a1]atrim=end=0.7,asetpts=PTS-STARTPTS[ah];[am][ah]acrossfade=d=0.7:c1=tri:c2=tri[a]'
 subprocess.run(['ffmpeg','-v','error','-y','-threads','2','-filter_complex_threads','1','-i',str(original),'-filter_complex',filters,'-map','[v]','-map','[a]','-c:v','libx264','-crf','14','-preset','slow','-threads','2','-c:a','aac','-b:a','192k','-movflags','+faststart',str(output)],check=True)
 digest=hashlib.sha256(output.read_bytes()).hexdigest();final=output.with_name(key+'.'+digest[:12]+'.mp4');output.rename(final)
 poster=Path('game/assets')/('arena-'+key+'-20261018.webp');subprocess.run(['ffmpeg','-v','error','-y','-i',str(final),'-frames:v','1','-c:v','libwebp','-lossless','1',str(poster)],check=True)
 # Full-size poster doubles as the menu thumbnail; one cached image per arena.
 rows.append({'id':key,'label':label,'file':final.name,'sha256':digest,'bytes':final.stat().st_size,'originalBytes':original.stat().st_size,'poster':poster.name,'duration':7.3,'fps':30})
 print(key,final.stat().st_size,flush=True)
Path('arena-media/manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')

# PCM seam mux also validates the original audio path; avoids short-head acrossfade loss.
subprocess.run(["python", "scripts/repair-arena-audio.py"],check=True)
