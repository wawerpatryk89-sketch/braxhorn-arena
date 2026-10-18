"""Finalize separate immutable arena package and its menu catalog."""
from pathlib import Path
import json,hashlib,shutil,subprocess,re
from fractions import Fraction
ROOT=Path(__file__).resolve().parents[1]
rows=json.loads((ROOT/'arena-media/manifest.json').read_text())
for key,label in [('snow','ŚNIEŻNY DACH'),('underground','UNDERGROUND')]:
 p=ROOT/'game/assets'/f'arena-{key}.mp4'
 if p.exists():
  sha=hashlib.sha256(p.read_bytes()).hexdigest();name=f'{key}.{sha[:12]}.mp4';shutil.copy2(p,ROOT/'arena-media/loops'/name)
  streams=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(p)]))['streams'];v=next(s for s in streams if s['codec_type']=='video')
  rows=[r for r in rows if r['id']!=key]+[{'id':key,'label':label,'file':name,'sha256':sha,'bytes':p.stat().st_size,'poster':f'arena-{key}.jpeg','duration':float(v['duration']),'fps':float(Fraction(v['r_frame_rate'])),'width':v['width'],'height':v['height'],'audio':True}]
(ROOT/'arena-media/manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
assets={r['id']:r for r in json.loads((ROOT/'arena-media/assets-manifest.json').read_text())}
url=lambda name:'/api/arena-media/'+name
catalog={}
for row in rows:
 p=ROOT/'arena-media/loops'/row['file'];v=next(s for s in json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(p)]))['streams'] if s['codec_type']=='video')
 catalog[row['id']]={'src':'/assets/'+row['poster'],'video':url(row['file']),'ground':.81,'aspect':v['width']/v['height'],'remote':True,'audio':None}
for key in ['metro','harbor']:catalog[key]={'src':url(assets[key]['file']),'ground':.81,'audio':url(assets[key+'-audio']['file'])}
catalog['nocny-targ']={'src':'/assets/arena-nocny-targ.jpg','ground':780/941,'audio':url(assets['market-audio']['file'])}
(ROOT/'game/assets/arena-catalog.js').write_text('window.BRAX_ARENA_VIDEOS = '+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';\n')
p=ROOT/'game/index.html';s=p.read_text().replace("url('/assets/rooftop.gif')","url('/assets/arena-rooftop-20261018.webp')")
for key in ['metro','harbor']:s=s.replace(f'src="/assets/{key}.gif"',f'src="/assets/arena-{key}-thumb.webp"')
for row in rows:
 key=row['id'];label=row['label']
 if f'id="arena-{key}"' in s:continue
 button=f'<button id="arena-{key}" class="arena-thumb" aria-label="Wybierz arenę: {label}" aria-pressed="false" data-number="{len(re.findall(chr(105)+chr(100)+chr(61)+chr(34)+"arena-",s))+1:02}"><img src="/assets/arena-{key}-20261018-thumb.webp" alt="" loading="lazy" draggable="false"><div class="arena-card-info"><small>ARENA</small><strong>{label}</strong><span>WYBIERZ ARENĘ</span></div></button>'
 s=s.replace('</div><button id="arenaPrevious"',button+'</div><button id="arenaPrevious"')
p.write_text(s)
# Only superseded assets; no authored fighter data or unique arena is removed.
for name in ['rooftop.gif','jungle.gif','volcano.gif','arena-beach.mp4','arena-beach.jpeg','arena-snow.mp4','arena-underground.mp4','metro.gif','harbor.gif','audio/arena-rooftop.mp3','audio/arena-jungle.mp3','audio/arena-volcano.mp3','audio/arena-metro.mp3','audio/arena-harbor.mp3','audio/arena-nocny-targ.mp3']:
 (ROOT/'game/assets'/name).unlink(missing_ok=True)
print('Catalog:',len(catalog),'arenas;',len(rows),'videos;',len(assets),'auxiliary assets')
