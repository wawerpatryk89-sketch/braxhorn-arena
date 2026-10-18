import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';

const base='game/assets/nina-new/',read=p=>JSON.parse(zlib.gunzipSync(fs.readFileSync(p)));
const cfg=JSON.parse(fs.readFileSync(base+'config.json')),raw=read('source-assets/nina/clips-all.json.gz');
const idle=JSON.stringify(cfg.IDLE),r=rig(new T.ObjectLoader().parse(read(base+'model.json.gz')),raw,'NINA');
const originals=structuredClone(cfg),changed=[];
function set(name,clip,label,rate,contacts,extra={}){
 const c=cfg[name];
 for(const key of ['sequence','phaseTempo','attackRangeByOpponent','comboGapByOpponent','guardLoop','freeze','gaitBlend'])delete c[key];
 Object.assign(c,{clip,label,start:0,duration:raw[clip].duration,playbackRate:rate,transitionMs:120,lockPlanarRoot:true,...extra});
 if(c.sequence)c.duration=c.sequence.reduce((n,s)=>n+s.duration,0);
 const count=Math.ceil(c.duration*60),step=c.duration/count;
 c.durations=Array(count).fill(step*1000);c.boxes=[];c.hurtCapsules=[];c.footY=[];c.pushCenters=[];c.hits={};
 for(let i=0;i<count;i++){
  r.pose(c,i*step);const pts=Object.keys(r.bones).map(n=>r.point(n));
  const box=[Math.min(...pts.map(p=>p[0]))-25,Math.min(...pts.map(p=>p[1]))-45,Math.max(...pts.map(p=>p[0]))+25,Math.max(...pts.map(p=>p[1]))+20];assert(box.every(Number.isFinite));
  c.boxes.push(box);c.footY.push(550);c.pushCenters.push([r.point('Hips')[0],40]);
  c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
  contacts.forEach(([time,bone,damage,before=.075,after=.09],group)=>{
   if(i*step>=time-before&&i*step<=time+after){const p=r.point(bone);c.hits[i]={box:[p[0]-24,p[1]-24,48,48],bone,damage,group};}
  });
 }
 c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];
 assert(Object.keys(c.hits).length);changed.push(name);
}
// Six offensive moves. Neither idle, evasion, block nor the special occupies a slot.
set('LIGHT_PUNCH','Meia Lua De Frente','Meia Lua — szeroki łuk',1.4,[[.90,'LeftFoot',7]],{attackRangePx:170});
// Macaco provides the supplied standing-to-inverted entry. No source samples are rewritten.
const entry=104/60;
set('HEAVY_PUNCH','Breakdance 1990','Obrót breakdance',1.4,[[entry+.25,'RightFoot',11]],{attackRangePx:125,sequence:[{clip:'Macaco Side',start:0,duration:entry},{clip:'Breakdance 1990',start:0,duration:raw['Breakdance 1990'].duration,blend:.18}]});
set('LIGHT_KICK','Leg Sweep (1)','Podcięcie z obrotem',1.55,[[1.367,'RightFoot',10]],{attackRangePx:170});
// Preserve the four capoeira contacts, then finish with the supplied full Armada.
const cap=raw['Capoeira (1)'].duration;
set('COMBO','Capoeira (1)','Capoeira → Armada',1.5,[[2.083,'LeftFoot',6],[3.233,'RightFoot',6],[3.483,'LeftFoot',6],[3.767,'RightFoot',6],[cap+1.267,'LeftFoot',16]],{comboGapPx:155,finisherGroup:4,sequence:[{clip:'Capoeira (1)',start:0,duration:cap},{clip:'Armada',start:0,duration:raw.Armada.duration,blend:.15}]});
assert.equal(JSON.stringify(cfg.IDLE),idle,'Do not change the approved standing motion');
for(const [name,c]of Object.entries(originals))if(!changed.includes(name))assert.deepEqual(cfg[name],c,'Unrequested state changed: '+name);
const runtime=read(base+'clips.json.gz');
for(const name of ['Meia Lua De Frente','Leg Sweep (1)','Macaco Side'])runtime[name]=raw[name];
fs.writeFileSync(base+'clips.json.gz',zlib.gzipSync(JSON.stringify(runtime),{level:9}));
fs.writeFileSync(base+'config.json',JSON.stringify(cfg));
const manifest=JSON.parse(fs.readFileSync(base+'manifest.json'));manifest.clips=Object.keys(runtime);fs.writeFileSync(base+'manifest.json',JSON.stringify(manifest));
console.log(JSON.stringify({changed,idleSha256:crypto.createHash('sha256').update(idle).digest('hex'),sourceTracksUnchanged:true,comboContacts:5,comboDamage:40}));
