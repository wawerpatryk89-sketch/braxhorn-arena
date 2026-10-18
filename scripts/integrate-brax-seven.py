from pathlib import Path
from PIL import Image
import json,base64,hashlib,io,sys,copy,shutil
root=Path(__file__).resolve().parents[1];src=Path(sys.argv[1]);p=root/'game/assets/brax-data.js'
data=json.loads(p.read_text().split('window.BRAX_DATA=')[1].strip().rstrip(';'));cfg=data['config'];refs=json.loads((root/'docs/decoded-frame-hashes.json').read_text());report=[]
specs=[('01','LIGHT_PUNCH',[70]*8+[65,45,65,65,70,80,90],[(10,.20,.48,7)],8,None),('02','LEAN',[50,50,45,45,55,85,65,55,55,60,65,80],[],0,[3,6]),('03','HEAVY_PUNCH',[50,45,45,50,55,70,50,45,40,70,60,65,75,90],[(9,.17,.48,13)],0,[3,6]),('04','UPPERCUT',[50,55,60,65,50,45,70,60,65,70,75,90],[(6,.08,.38,12)],0,[2,3]),('05','HEAVY_KICK',[50,55,65,55,55,45,80,60,65,70,80,90],[(6,.25,.55,13)],0,[1,2]),('06','MUAY_THAI_ROUNDHOUSE',[45,40,40,45,50,65,55,50,45,60,70,60,65,75,90],[(9,.20,.51,13),(10,.20,.51,13)],0,[4,6])]
for prefix,name,durations,contacts,start,evade in specs:
 path=next(src.glob(prefix+'*/*.gif'));raw=path.read_bytes();im=Image.open(io.BytesIO(raw));frames=[];boxes=[];hashes=[]
 for i in range(im.n_frames):
  im.seek(i);f=im.convert('RGBA');frames.append(f);boxes.append(list(f.getbbox()));b=bytearray(f.tobytes())
  for j in range(0,len(b),4):
   if not b[j+3]:b[j:j+3]=b'\0\0\0'
  hashes.append(hashlib.sha256(b).hexdigest())
 assert len(durations)==len(frames)
 key='BRAX_SEVEN_'+name;data['assets'][key]=base64.b64encode(raw).decode();data['sha256'][key]=hashlib.sha256(raw).hexdigest();refs[key]=hashes
 # Stable world root: do not erase the artist's body weight shift by re-centering each frame.
 foot=frames[0].getchannel('A').crop((0,boxes[0][3]-14,im.width,boxes[0][3])).getbbox();pivot=(foot[0]+foot[2])/2
 hits={}
 for fi,lo,hi,damage in contacts:
  top=int(im.height*lo);bottom=int(im.height*hi);b=frames[fi].getchannel('A').crop((0,top,im.width,bottom)).getbbox();right=b[2];left=max(b[0],right-75);hits[str(fi)]={'box':[left,top+b[1],right-left,b[3]-b[1]],'group':0,'damage':damage}
 c={'asset':key,'label':name.replace('_',' '),'attack':bool(contacts),'hits':hits,'gain':8 if contacts else 0,'cost':0,'w':im.width,'h':im.height,'boxes':boxes,'union':[min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes)],'durations':durations,'scale':356/457,'pivotX':pivot,'anchorY':boxes[0][3],'footY':[boxes[0][3]]*len(boxes),'mode':'ground','startFrame':start}
 if evade:c['evadeFrames']=evade
 cfg[name]=c;report.append({'action':name,'source':path.name,'frames':len(frames),'startFrame':start,'durationMs':sum(durations[start:]),'contactFrames':[x[0] for x in contacts],'sha256':data['sha256'][key]})
 if name=='LIGHT_PUNCH':
  idle=copy.deepcopy(c);idle.update(attack=False,hits={},gain=0,startFrame=0,durations=[160]*8,label='GARDA');cfg['IDLE']=idle
  block=copy.deepcopy(idle);block['poseFrame']=3;cfg['BLOCK']=block
selection=next(src.glob('07*/*.gif'));shutil.copyfile(selection,root/'game/assets/brax-selection.gif');report.append({'action':'CHARACTER_SELECTION','source':selection.name,'frames':53,'sha256':hashlib.sha256(selection.read_bytes()).hexdigest()})
used={v['asset'] for v in cfg.values()};removed=[]
for key in list(data['assets']):
 if key not in used:removed.append(key);data['assets'].pop(key);data['sha256'].pop(key,None);refs.pop(key,None)
p.write_text('window.BRAX_DATA='+json.dumps(data,separators=(',',':'))+';\n');(root/'docs/decoded-frame-hashes.json').write_text(json.dumps(refs,indent=2));(root/'docs/brax-seven-review.json').write_text(json.dumps({'animations':report,'removedUnusedAssets':removed},indent=2));print(json.dumps(report,indent=2))
