import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';
const base='game/assets/danny-new/',rd=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(base+n))),raw=JSON.parse(zlib.gunzipSync(fs.readFileSync('source-assets/danny/clips-all.json.gz')));
const r=rig(new T.ObjectLoader().parse(rd('model.json.gz')),raw,'DANNY'),cfg={};
const make=(name,clip,extra={})=>cfg[name]={asset:'DANNY_NEW_'+name,character:'DANNY',label:clip,sourceVersion:'danny-20261011',clip,attack:false,gain:10,cost:0,w:1024,h:640,scale:1,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1,duration:raw[clip].duration,transitionMs:90,...extra};
make('IDLE','Idle',{lockPlanarRoot:true,guardLoop:{start:0,end:raw.Idle.duration,blend:.1}});
make('BLOCK','Left Block',{freeze:true,start:.6,duration:1,lockPlanarRoot:true});
make('INTRO','Taunt',{lockPlanarRoot:true,stageYaw:0});make('WIN','Taunt',{lockPlanarRoot:true,stageYaw:0});
for(const [state,clip,rate]of [['WALK_FORWARD','Shared Approach Walk',.85],['APPROACH','Shared Approach Walk',.85],['WALK_BACK','Walking Backwards',1.0]])make(state,clip,{locomotion:true,gaitRate:rate,transitionMs:130,guardLoop:{start:0,end:raw[clip].duration,blend:.045}});
make('LEAN','Dodging',{start:.1,duration:2.1,lockPlanarRoot:true,playbackRate:1.8,evadeFrames:[12,66]});
const attack=(name,clip,start,duration,contacts,playbackRate)=>make(name,clip,{start,duration,contacts,playbackRate,attack:true,lockPlanarRoot:true,transitionMs:85});
attack('LIGHT_PUNCH','Lead Jab',0,1.0667,[[.45,'LeftHand',7,.08,.09]],1.5);
attack('HEAVY_PUNCH','Punching',0,.9833,[[.4,'RightHand',11,.08,.09]],1.45);
attack('LIGHT_KICK','Mma Kick',0,1.5,[[.6,'RightFoot',10,.08,.09]],1.35);
attack('HEAVY_KICK','Kicking',0,2.2667,[[1.3,'LeftFoot',14,.09,.12]],1.4);
attack('HOOK','Hook',0,1.8833,[[.883,'LeftHand',12,.075,.09]],1.5);
attack('SIDE_KICK','Side Kick',0,2,[[.7,'RightFoot',13,.08,.10]],1.4);
make('COMBO','Boxing',{attack:true,lockPlanarRoot:true,playbackRate:1.45,sequence:[{clip:'Boxing',duration:1.25},{clip:'Hook',start:.2,duration:1.6833,blend:.13},{clip:'Mma Kick',duration:1.5,blend:.13},{clip:'Side Kick',duration:2,blend:.13}],duration:6.4333,comboGapPx:135,finisherGroup:4,contacts:[[.417,'LeftHand',6,.085,.10],[.65,'RightHand',6,.085,.10],[1.9333,'LeftHand',8,.085,.10],[3.5333,'RightFoot',9,.085,.10],[5.1333,'RightFoot',16,.085,.10]]});
for(const [state,range] of Object.entries({LIGHT_PUNCH:160,HEAVY_PUNCH:145,LIGHT_KICK:195,HEAVY_KICK:190,HOOK:105,SIDE_KICK:190}))cfg[state].attackRangePx=range;
make('HIT_BODY','Shared Hit Body',{playbackRate:1.8,lockPlanarRoot:true});make('HIT_HEAD','Head Hit',{playbackRate:1.5,lockPlanarRoot:true});make('HIT_HEAVY','Head Hit',{playbackRate:1.3,lockPlanarRoot:true});
function rootState(name,clip,start,duration,extra={}){const c=make(name,clip,{start,duration,...extra});r.pose(c,0);const p=r.bones.Hips.position;c.rootOffset=[-p.x,0,p.y];r.pose(c,0);const x=r.point('Hips')[0];r.pose(c,duration);c.rootTravelPx=c.freeze?0:r.point('Hips')[0]-x;return c;}
rootState('FALL','Sweep Fall',0,1.1,{playbackRate:1.6});rootState('LAND','Sweep Fall',1.1,1.4,{playbackRate:1.6});rootState('DOWN','Sweep Fall',2.5,.3,{freeze:true});
const flight=raw['Shared Flying Back Death'].duration;
rootState('FLY','Shared Flying Back Death',0,1.05,{playbackRate:1.4});rootState('FLY_LAND','Shared Flying Back Death',1.05,flight-1.05,{playbackRate:2});rootState('FLY_DOWN','Shared Flying Back Death',flight,.3,{freeze:true});rootState('KO_HOLD','Shared Flying Back Death',flight,1,{freeze:true});cfg.KO={...cfg.FLY,asset:'DANNY_NEW_KO'};
rootState('GETUP','Shared Getting Up',0,raw['Shared Getting Up'].duration,{playbackRate:1.8,transitionMs:120});
rootState('THROW_VICTIM','Shoulder Throw, Victim',2.3,1.5,{playbackRate:2.5,stageYaw:0,pair:true,cameraOffsetPx:160,pivotX:352});
rootState('THROW_DOWN','Shoulder Throw, Victim',3.8,.3,{freeze:true,stageYaw:0});
for(const c of Object.values(cfg)){
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
 if(c.attack&&!c.sequence){const keys=Object.keys(c.hits).map(Number),first=Math.min(...keys),last=Math.max(...keys);if(!keys.length)throw Error('Missing attack contacts');c.phaseTempo={first,last,startup:Math.max(1,first*step/c.playbackRate/(c.clip==='Chapa-Giratoria'?.65:c.clip==='Martelo Do Chau Sem Mao'?.5:.25)),recovery:Math.max(1,(frames-last-1)*step/c.playbackRate/.4)};}
}
fs.writeFileSync(base+'config.json',JSON.stringify(cfg));
fs.writeFileSync(base+'manifest.json',JSON.stringify({character:'DANNY',sourceVersion:'danny-20261011',preservedInfluences:12,clips:Object.keys(raw),textures:{color:'color.webp',normal:'normal.webp',roughness:'roughness.webp',metalness:'metalness.webp'}}));
console.log('DANNY',Object.keys(cfg).length,'states; kickboxing: jab, cross, hook, low kick, high kick, side kick, five-contact combo');
