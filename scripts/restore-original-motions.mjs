import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';

// Rebuild collision samples whenever the source timeline changes. Source models,
// textures, skeletons and animation samples are never written by this repair.
const report=[];
for(const who of ['BRAX','NYXA','VEXA','KROV','BEAR','NINA','DANNY']){
 const base=`game/assets/${who.toLowerCase()}-new/`;
 const raw=JSON.parse(zlib.gunzipSync(fs.readFileSync(`source-assets/${who.toLowerCase()}/clips-all.json.gz`)));
 const cfg=JSON.parse(fs.readFileSync(base+'config.json'));
 const r=rig(new T.ObjectLoader().parse(JSON.parse(zlib.gunzipSync(fs.readFileSync(base+'model.json.gz')))),raw,who);
 const changed=[];
 const full=(c,clip)=>{c.clip=clip;c.label=clip;c.start=0;c.duration=raw[clip].duration;delete c.freeze;delete c.sequence;delete c.guardLoop;};
 function windows(c){const groups=new Map();for(const[f,h]of Object.entries(c.hits||{})){const t=Number(f)*c.durations[0]/1000;let g=groups.get(h.group);if(!g){g={...h,from:t,to:t};groups.set(h.group,g);}g.from=Math.min(g.from,t);g.to=Math.max(g.to,t);}return [...groups.values()];}
 function rebuild(c,hits){
  const count=Math.ceil(c.duration*60),dt=c.duration/count;
  c.durations=Array(count).fill(dt*1000);c.boxes=[];c.hurtCapsules=[];c.footY=[];c.pushCenters=[];c.hits={};
  for(let i=0;i<count;i++){
   r.pose(c,i*dt);const p=Object.keys(r.bones).map(n=>r.point(n));assert(p.flat().every(Number.isFinite));
   c.boxes.push([Math.min(...p.map(v=>v[0]))-25,Math.min(...p.map(v=>v[1]))-45,Math.max(...p.map(v=>v[0]))+25,Math.max(...p.map(v=>v[1]))+20]);
   c.footY.push(550);c.pushCenters.push([r.point('Hips')[0],who==='BRAX'||who==='NYXA'?42:40]);
   c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
   for(const h of hits){if(i*dt<h.from-dt/2||i*dt>h.to+dt/2)continue;const p=r.point(h.bone),radius=h.box?h.box[2]/2:h.bone.includes('Foot')?24:19;c.hits[i]={bone:h.bone,damage:h.damage,group:h.group,box:[p[0]-radius,p[1]-radius,2*radius,2*radius]};}
  }
  c.union=[Math.min(...c.boxes.map(v=>v[0])),Math.min(...c.boxes.map(v=>v[1])),Math.max(...c.boxes.map(v=>v[2])),Math.max(...c.boxes.map(v=>v[3]))];
 }
 for(const [name,c] of Object.entries(cfg)){
  let hits=windows(c),dirty=false;
  if(c.gaitBlend){delete c.gaitBlend;dirty=true;}
  // Constant playback speed preserves the acceleration of the supplied motion.
  if(c.phaseTempo){delete c.phaseTempo;changed.push(name+': uniform playback');}
  if(who==='BRAX'&&name==='IDLE'){
   full(c,'Boxing (2)');c.lockPlanarRoot=true;c.guardLoop={start:0,end:c.duration,blend:.08};dirty=true;
  }
  if(who==='BRAX'&&(name==='WALK_FORWARD'||name==='APPROACH')){
   full(c,'Long Step Forward');c.locomotion=true;c.guardLoop={start:0,end:c.duration,blend:.05};dirty=true;
  }
  if(['NYXA','VEXA','BEAR'].includes(who)&&name==='APPROACH'){
   const walk=cfg.WALK_FORWARD;full(c,walk.clip);c.locomotion=true;c.guardLoop={start:0,end:c.duration,blend:.05};dirty=true;
  }
  if(who==='KROV'&&name==='APPROACH'){
   full(c,'Walking');c.locomotion=true;c.guardLoop={start:0,end:c.duration,blend:.05};dirty=true;
  }
  if(who==='NINA'&&['LIGHT_PUNCH','HEAVY_PUNCH'].includes(name)){
   const light=name==='LIGHT_PUNCH';full(c,light?'Chapa 2':'Meia Lua De Frente');
   const time=light?.65:.9;hits=[{group:0,bone:light?'RightFoot':'LeftFoot',damage:light?10:12,from:time-.075,to:time+.09}];c.attackRangePx=180;dirty=true;
  }else if(who==='BEAR'&&name==='SHOULDER'){
   full(c,'Rifle Punch');delete c.advance;hits=[{group:0,bone:'RightHand',damage:16,from:1.10,to:1.32}];c.attackRangePx=160;dirty=true;
  }else if(c.attack&&!c.sequence){
   const offset=c.start||0;
   if(offset||Math.abs(c.duration-raw[c.clip].duration)>.001){hits=hits.map(h=>({...h,from:h.from+offset,to:h.to+offset}));full(c,c.clip);dirty=true;}
  }
  if(c.attack&&c.sequence){
   const old=c.sequence.map(s=>({...s}));let oldAt=0,newAt=0;const translated=[];
   for(let index=0;index<old.length;index++){
    const seg=old[index],replace=who==='BEAR'&&index===0;
    const clip=replace?'Rifle Punch':seg.clip;
    for(const h of hits.filter(h=>h.from>=oldAt-.02&&h.from<oldAt+seg.duration-.001)){
     translated.push(replace?{...h,bone:'RightHand',from:1.10,to:1.32,box:undefined}:{...h,from:newAt+(seg.start||0)+h.from-oldAt,to:newAt+(seg.start||0)+h.to-oldAt});
    }
    c.sequence[index]={clip,start:0,duration:raw[clip].duration,...(index?{blend:seg.blend||.12}:{})};
    oldAt+=seg.duration;newAt+=raw[clip].duration;
   }
   c.duration=newAt;c.clip=c.sequence[0].clip;hits=translated;dirty=true;
   if(who==='BEAR')delete c.advance;
  }
  if(dirty){rebuild(c,hits);changed.push(name+': '+c.clip);}
 }
 fs.writeFileSync(base+'config.json',JSON.stringify(cfg));report.push({who,changed});
}
fs.writeFileSync('docs/original-motion-repair.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
