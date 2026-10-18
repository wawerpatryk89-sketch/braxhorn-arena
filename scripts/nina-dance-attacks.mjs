import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';
const base='game/assets/nina-new/',rd=p=>JSON.parse(zlib.gunzipSync(fs.readFileSync(p))),raw=rd('source-assets/nina/clips-all.json.gz'),cfg=JSON.parse(fs.readFileSync(base+'config.json')),r=rig(new T.ObjectLoader().parse(rd(base+'model.json.gz')),raw,'NINA');
for(const [name,clip,label,time,bone,damage,rate] of [['LIGHT_PUNCH','Roll Kicking','Kopnięcie z przewrotu',.75,'RightFoot',7,1.4],['HEAVY_PUNCH','Breakdance 1990','Obrót breakdance',.25,'RightFoot',11,1.2]]){
 const c=cfg[name];Object.assign(c,{clip,label,start:0,duration:raw[clip].duration,playbackRate:rate,transitionMs:120,contacts:[[time,bone,damage,.08,.10]]});delete c.sequence;delete c.phaseTempo;delete c.attackRangeByOpponent;c.attackRangePx=clip==='Roll Kicking'?155:125;
}
for(const c of [cfg.LIGHT_PUNCH,cfg.HEAVY_PUNCH]){
 const frames=Math.ceil(c.duration*60),step=c.duration/frames;c.durations=Array(frames).fill(step*1000);c.boxes=[];c.hurtCapsules=[];c.footY=[];c.pushCenters=[];c.hits={};
 const airborne=[];
 for(let i=0;i<frames;i++){
  r.pose(c,i*step);const points=Object.keys(r.bones).map(n=>r.point(n));const box=[Math.min(...points.map(p=>p[0]))-25,Math.min(...points.map(p=>p[1]))-45,Math.max(...points.map(p=>p[0]))+25,Math.max(...points.map(p=>p[1]))+20];
  if(!box.every(Number.isFinite))throw Error('Invalid pose '+c.clip);c.boxes.push(box);c.footY.push(550);c.pushCenters.push([r.point('Hips')[0],40]);
  c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
  for(const [group,[time,bone,damage,before,after]]of (c.contacts||[]).entries()){const peak=Math.round(time/step),first=before===undefined?peak-2:Math.ceil((time-before)/step),last=after===undefined?peak+1:Math.floor((time+after)/step);if(i>=first&&i<=last){const p=r.point(bone),radius=bone.includes('Foot')?24:bone==='LeftArm'?30:bone.endsWith('Leg')?25:19;c.hits[i]={box:[p[0]-radius,p[1]-radius,radius*2,radius*2],bone,damage,group};}}
  if(c===cfg.JUMP&&Math.max(...['LeftFoot','RightFoot','LeftToeBase','RightToeBase'].map(n=>r.point(n)[1]))<525)airborne.push(i);
 }
 if(c===cfg.JUMP)c.airFrames=[Math.min(...airborne),Math.max(...airborne)];
 c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];delete c.contacts;
 if(false){const keys=Object.keys(c.hits).map(Number),first=Math.min(...keys),last=Math.max(...keys);if(!keys.length)throw Error('Missing attack contacts');c.phaseTempo={first,last,startup:Math.max(1,first*step/c.playbackRate/(c.clip==='Chapa-Giratoria'?.65:c.clip==='Martelo Do Chau Sem Mao'?.5:.25)),recovery:Math.max(1,(frames-last-1)*step/c.playbackRate/.4)};}
}
const clips=rd(base+'clips.json.gz');for(const n of ['Roll Kicking','Breakdance 1990'])clips[n]=raw[n];fs.writeFileSync(base+'clips.json.gz',zlib.gzipSync(JSON.stringify(clips)));fs.writeFileSync(base+'config.json',JSON.stringify(cfg));console.log('Nina: six foot attacks, roll kick and breakdance spin active, no hand strikes');
