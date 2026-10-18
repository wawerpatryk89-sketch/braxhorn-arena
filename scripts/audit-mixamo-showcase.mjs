import fs from'node:fs';import zlib from'node:zlib';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';import * as T from'three';import{rig}from'../game/assets/fighter-source-core.js';
for(const who of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY']){
 const d='game/assets/'+who.toLowerCase()+'-new/',rd=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(d+n))),raw=rd('clips.json.gz'),cfg=JSON.parse(fs.readFileSync(d+'config.json'));
 const previous=JSON.parse(zlib.gunzipSync(execFileSync('git',['show','5560fb173594c6949f7d4579986d9c5a65466c80:'+d+'clips.json.gz'],{maxBuffer:30e6})));
 for(const[n,c]of Object.entries(previous))if(!n.startsWith('Showcase '))assert.deepEqual(raw[n],c,'existing clip changed: '+who+' '+n);
 const oldCfg=JSON.parse(execFileSync('git',['show','5560fb173594c6949f7d4579986d9c5a65466c80:'+d+'config.json'],{maxBuffer:30e6}));for(const[n,c]of Object.entries(oldCfg))if(!['CONTACT_PUSH','CONTACT_RECEIVE','WIN_ROUND','WIN_MATCH'].includes(n))assert.deepEqual(cfg[n],c,'existing action changed '+who+' '+n);
 const r=rig(new T.ObjectLoader().parse(rd('model.json.gz')),raw,who),sampleBones=['Head','Hips','LeftFoot','RightFoot','LeftHand','RightHand'];
 for(const key of ['CONTACT_PUSH','CONTACT_RECEIVE','WIN_ROUND','WIN_MATCH']){
  const c=cfg[key];assert(raw[c.clip]);assert(c.duration<=4.3);let jump=0,jumpAt,prev,footMin=Infinity,footMax=-Infinity;
  for(let t=0;t<=c.duration;t+=1/60){r.pose(c,t);const points=sampleBones.map(n=>r.bones[n].getWorldPosition(new T.Vector3()));assert(points.every(p=>p.toArray().every(Number.isFinite)));if(prev){const v=Math.max(...points.map((p,i)=>p.distanceTo(prev[i])));if(v>jump){jump=v;jumpAt=t;}}prev=points;footMin=Math.min(footMin,points[2].y,points[3].y);footMax=Math.max(footMax,points[2].y,points[3].y);}
  assert(jump<.25,who+' '+key+' discontinuity '+jump+' at '+jumpAt);assert(footMin>-.03,who+' '+key+' floor penetration '+footMin);
  if(key==='CONTACT_RECEIVE'){assert(footMax-footMin>.15,'missing off-balance steps');assert(c.contactMotion.at(-1)[1]<-180&&c.contactMotion.at(-1)[1]>-290,'unbounded retreat');}
  if(key!=='WIN_MATCH'){r.pose(c,c.duration);const end=Object.fromEntries(Object.entries(r.bones).map(([n,b])=>[n,b.quaternion.clone()]));r.pose({...cfg.IDLE,lockPlanarRoot:true},0);assert(Math.max(...Object.entries(r.bones).map(([n,b])=>b.quaternion.angleTo(end[n])))<.02,'does not settle to guard');}
  console.log(who,key,JSON.stringify({maxFrameMotion:jump,footMin,footMax,duration:c.duration}));
 }
}
console.log('PASS: six rigs, supplied clips, grounded recovery, original attacks unchanged');
