from pathlib import Path
from PIL import Image
import json,base64,hashlib,io,sys
root=Path(__file__).resolve().parents[1];src=Path(sys.argv[1])
p=root/'game/assets/brax-data.js';data=json.loads(p.read_text().split('window.BRAX_DATA=')[1].strip().rstrip(';'));cfg=data['config'];refs=json.loads((root/'docs/decoded-frame-hashes.json').read_text())
# Reviewed active contact frames, vertical zones relative to the complete frame.
specs={
'LIGHT_PUNCH':('LIGHT_PUNCH_PODGLAD',[(2,0,7,.22,.43),(3,0,7,.22,.43)]),
'HEAVY_PUNCH':('HEAVY_PUNCH_PODGLAD',[(3,0,13,.20,.40)]),
'CROUCH_PUNCH':('CROUCH_PUNCH_PODGLAD',[(2,0,7,.37,.57),(3,0,7,.37,.57)]),
'LIGHT_KICK':('LIGHT_KICK_PODGLAD',[(2,0,9,.40,.66),(3,0,9,.40,.66)]),
'HEAVY_KICK':('HEAVY_KICK_PODGLAD',[(3,0,13,.31,.55),(4,0,13,.31,.55)]),
'CROUCH_KICK':('CROUCH_KICK_PODGLAD',[(2,0,9,.65,.89),(3,0,9,.65,.89)]),
'JUMP_PUNCH':('JUMP_PUNCH_PODGLAD',[(2,0,8,.17,.38),(3,0,8,.17,.38)]),
'MUAY_THAI_ROUNDHOUSE':('ROUNDHOUSE_PODGLAD',[(3,0,13,.17,.40),(4,0,13,.17,.40),(5,0,13,.17,.40)]),
'UPPERCUT':('UPPERCUT_PODGLAD',[(3,0,12,.09,.38),(4,0,12,.09,.38)]),
'DOUBLE_PUNCH':('LEWY_PRAWY_PODGLAD',[(2,0,6,.22,.43),(3,0,6,.22,.43),(7,1,9,.20,.40)]),
'CHAIN_STRIKES':('COMBO_LEWY_PRAWY_KOPNIECIE',[(2,0,6,.22,.43),(3,0,6,.22,.43),(7,1,8,.20,.40),(11,2,10,.17,.40),(12,2,10,.17,.40),(13,2,10,.17,.40)]),
'COMBO':('COMBO_BYK_KURZ_POLACZONE',[(8,0,34,.40,.64),(9,0,34,.33,.58),(10,0,34,.40,.65),(11,0,34,.40,.65)]),
'BLOCK':('GUARD_PODGLAD',[])}
report={'integrated':[],'excluded':[{'file':'BRAX_SPINNING_HEEL_KICK_PODGLAD_01.gif','reason':'Frame 1 has opaque pixels touching x=0; tail clipped at left edge.'},{'file':'BRAX_BYK_PRZYGOTOWANIE_KURZ_01.gif','reason':'Already present in the full charge.'},{'file':'BRAX_BYK_SZARZA_KURZ_01.gif','reason':'Already present in the full charge.'}],'missing':['dedicated idle loop','hit reactions','knockdown and get up','victory and defeat','corrected spinning heel kick']}
for action,(stem,contacts) in specs.items():
 path=src/('BRAX_'+stem+'_01.gif');raw=path.read_bytes();im=Image.open(io.BytesIO(raw));frames=[];boxes=[];dur=[];pivots=[];hashes=[]
 for i in range(im.n_frames):
  im.seek(i);f=im.convert('RGBA');frames.append(f);box=f.getbbox();boxes.append(list(box));dur.append(im.info.get('duration',100));a=f.getchannel('A')
  # Root follows the midpoint of grounded shoe silhouettes; metadata only, original pixels preserved.
  foot=a.crop((0,box[3]-14,im.width,box[3])).getbbox();pivots.append(round((foot[0]+foot[2])/2,2))
  normalized=bytearray(f.tobytes())
  for j in range(0,len(normalized),4):
   if not normalized[j+3]:normalized[j:j+3]=b'\0\0\0'
  hashes.append(hashlib.sha256(normalized).hexdigest())
 key='BRAX_PACK_'+action;data['assets'][key]=base64.b64encode(raw).decode();data['sha256'][key]=hashlib.sha256(raw).hexdigest();refs[key]=hashes
 # Crouching frames remain at the same scale as standing attacks, not stretched to full height.
 scale=356/(boxes[0][3]-boxes[0][1]) if action not in ['CROUCH_KICK','CROUCH_PUNCH'] else 356/455
 hits={}
 for fi,group,damage,lo,hi in contacts:
  a=frames[fi].getchannel('A');top=int(im.height*lo);bottom=int(im.height*hi);box=a.crop((0,top,im.width,bottom)).getbbox();right=box[2];left=max(box[0],right-75)
  hits[str(fi)]={'box':[left,top+box[1],right-left,box[3]-box[1]],'group':group,'damage':damage}
 c={'asset':key,'label':action.replace('_',' '),'attack':bool(contacts),'hits':hits,'gain':8 if contacts else 0,'cost':100 if action=='COMBO' else 0,'w':im.width,'h':im.height,'boxes':boxes,'union':[min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes)],'durations':dur,'scale':scale,'pivotX':pivots[0],'pivots':pivots,'anchorY':max(b[3] for b in boxes),'footY':[b[3] for b in boxes],'mode':'air' if action=='JUMP_PUNCH' else 'ground'}
 if action=='JUMP_PUNCH':c['followJumpPhysics']=True
 cfg[action]=c;report['integrated'].append({'action':action,'file':path.name,'frames':len(frames),'sha256':data['sha256'][key]})
# Retire mismatched legacy attacks and the synthesized replacement combo.
for key in ['HORN_CHALLENGE','KNUCKLE_CRACK']:cfg.pop(key,None)
used={v['asset'] for v in cfg.values()}
removed=[k for k in data['assets'] if k not in used]
for k in removed:data['assets'].pop(k);data['sha256'].pop(k,None);refs.pop(k,None)
report['removed_legacy_assets']=removed
p.write_text('window.BRAX_DATA='+json.dumps(data,separators=(',',':'))+';\n');(root/'docs/decoded-frame-hashes.json').write_text(json.dumps(refs,indent=2));(root/'docs/brax-pack-review.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
