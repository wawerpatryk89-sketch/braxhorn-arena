import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';import{rig,SIZE,VIEW}from'../game/assets/fighter-source-core.js';
for(const who of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY']){const d='game/assets/'+who.toLowerCase()+'-new/',read=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(d+n))),cfg=JSON.parse(fs.readFileSync(d+'config.json')),r=rig(new T.ObjectLoader().parse(read('model.json.gz')),read('clips.json.gz'),who),c=cfg.CONTACT_PUSH;
r.pose(c,.30);const reach=(r.bones.LeftHand.getWorldPosition(new T.Vector3()).x+r.bones.RightHand.getWorldPosition(new T.Vector3()).x)/2;c.contactGapPx=1.08*SIZE/VIEW;c.label='Wzajemne odepchnięcie i upadek';c.mutualContact=true;
// Compatibility alias has the same push and retreat, never a passive victim.
cfg.CONTACT_RECEIVE={...structuredClone(c),asset:who+'_MUTUAL_CONTACT_COMPAT'};
fs.writeFileSync(d+'config.json',JSON.stringify(cfg));console.log(who,{reach,gap:c.contactGapPx});}
