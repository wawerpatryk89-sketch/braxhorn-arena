import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';
const base='game/assets/nina-new/',rd=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(base+n))),raw=JSON.parse(zlib.gunzipSync(fs.readFileSync('source-assets/nina/clips-all.json.gz')));
const r=rig(new T.ObjectLoader().parse(rd('model.json.gz')),raw,'NINA'),cfg={};
const make=(name,clip,extra={})=>cfg[name]={asset:'NINA_NEW_'+name,character:'NINA',label:clip,sourceVersion:'nina-20261011',clip,attack:false,gain:10,cost:0,w:1024,h:640,scale:1,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1,duration:raw[clip].duration,transitionMs:90,...extra};
make('IDLE','Ginga Variation 3',{lockPlanarRoot:true,guardLoop:{start:0,end:raw['Ginga Variation 3'].duration,blend:.12},defense:'evasion'});
// No stationary boxing guard: BLOCK exists only as metadata compatibility.
make('BLOCK','Ginga Variation 3',{lockPlanarRoot:true,guardLoop:{start:0,end:raw['Ginga Variation 3'].duration,blend:.12}});
make('INTRO','Breakdance 1990',{lockPlanarRoot:true,playbackRate:1,stageYaw:0,transitionMs:150});
make('WIN','Breakdance Ending 2',{lockPlanarRoot:true});
// Use the complete supplied forward walk, without mixing a stationary boxing guard.
for(const [state,clip,rate]of [['WALK_FORWARD','Shared Approach Walk',.864],['APPROACH','Shared Approach Walk',.864],['WALK_BACK','Standing Walk Back',.967]])make(state,clip,{locomotion:true,gaitRate:rate,transitionMs:150,guardLoop:{start:0,end:raw[clip].duration,blend:.05}});
make('LEAN','Esquiva 3',{start:.15,duration:1.8,lockPlanarRoot:true,playbackRate:2.2,evadeFrames:[17,65],transitionMs:85});
const attack=(name,clip,start,duration,contacts,playbackRate)=>make(name,clip,{start,duration,contacts,playbackRate,attack:true,lockPlanarRoot:true,transitionMs:80});
attack('LIGHT_PUNCH','Rifle Punch',.78,1.35,[[.537,'RightHand',7,.065,.08]],1.55);
attack('HEAVY_PUNCH','Illegal Elbow Punch',.25,1.3,[[.5,'RightForeArm',11,.075,.09]],1.4);
attack('LIGHT_KICK','Martelo 2',.05,1.2,[[.417,'LeftFoot',10,.07,.085]],1.4);
attack('HEAVY_KICK','Martelo Do Chau Sem Mao',0,raw['Martelo Do Chau Sem Mao'].duration,[[1.217,'RightFoot',14,.08,.10]],1.2);
attack('CRESCENT_KICK','Chapa-Giratoria',0,3,[[2.30,'LeftFoot',13,.085,.10]],1.35);
attack('SPIN_KICK','Armada',.05,1.5,[[1.217,'LeftFoot',14,.075,.08]],1.4);
// Five real foot contacts in the supplied acrobatic sequence and its rotating finisher.
make('COMBO','Capoeira (1)',{attack:true,lockPlanarRoot:true,playbackRate:1.5,transitionMs:110,sequence:[{clip:'Capoeira (1)',duration:4.8},{clip:'Chapa-Giratoria',duration:3,blend:.15}],duration:7.8,comboGapPx:155,finisherGroup:4,contacts:[[2.083,'LeftFoot',6,.08,.085],[3.233,'RightFoot',6,.08,.08],[3.483,'LeftFoot',6,.07,.075],[3.767,'RightFoot',6,.065,.075],[7.1,'LeftFoot',16,.08,.10]]});
for(const [name,range]of Object.entries({LIGHT_PUNCH:155,HEAVY_PUNCH:110,LIGHT_KICK:180,HEAVY_KICK:175,CRESCENT_KICK:165,SPIN_KICK:170}))cfg[name].attackRangePx=range;
make('HIT_BODY','Shared Hit Body',{playbackRate:2,lockPlanarRoot:true});make('HIT_HEAD','Shared Hit Head',{playbackRate:1.65,lockPlanarRoot:true});make('HIT_HEAVY','Shared Hit Head',{playbackRate:1.6,lockPlanarRoot:true});
function rootState(name,clip,start,duration,extra={}){const c=make(name,clip,{start,duration,...extra});r.pose(c,0);const p=r.bones.Hips.position;c.rootOffset=[-p.x,0,p.y];r.pose(c,0);const x=r.point('Hips')[0];r.pose(c,duration);c.rootTravelPx=c.freeze?0:r.point('Hips')[0]-x;return c;}
rootState('FALL','Shared Falling Back Death',0,.75,{playbackRate:1.6});rootState('LAND','Shared Falling Back Death',.75,1.1,{playbackRate:2});rootState('DOWN','Shared Falling Back Death',1.85,.3,{freeze:true});
const flight=raw['Shared Flying Back Death'].duration;
rootState('FLY','Shared Flying Back Death',0,1.05,{playbackRate:1.4});rootState('FLY_LAND','Shared Flying Back Death',1.05,flight-1.05,{playbackRate:2});rootState('FLY_DOWN','Shared Flying Back Death',flight,.3,{freeze:true});rootState('KO_HOLD','Shared Flying Back Death',flight,1,{freeze:true});cfg.KO={...cfg.FLY,asset:'NINA_NEW_KO'};
rootState('GETUP','Shared Getting Up',0,raw['Shared Getting Up'].duration,{playbackRate:1.8,transitionMs:120});
rootState('THROW_VICTIM','Shared Throw Victim',2.3,1.5,{playbackRate:2.5,stageYaw:0,pair:true,cameraOffsetPx:160,pivotX:352});
rootState('THROW_DOWN','Shared Throw Victim',3.8,.3,{freeze:true,stageYaw:0});
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
fs.writeFileSync(base+'manifest.json',JSON.stringify({character:'NINA',sourceVersion:'nina-20261011',preservedInfluences:12,clips:Object.keys(raw),textures:{color:'color.webp',normal:'normal.webp',roughness:'roughness.webp',metalness:'metalness.webp'}}));
console.log('NINA',Object.keys(cfg).length,'states; two upper-body strikes, four kicks, capoeira combo, evade and throw victim');
