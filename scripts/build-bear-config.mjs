import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';
const base='game/assets/bear-new/',rd=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(base+n))),raw=rd('clips.json.gz');
const r=rig(new T.ObjectLoader().parse(rd('model.json.gz')),raw,'BEAR'),cfg={};
const make=(name,clip,extra={})=>cfg[name]={asset:'BEAR_NEW_'+name,character:'BEAR',label:clip,sourceVersion:'bear-20261011',clip,attack:false,gain:10,cost:0,w:1024,h:640,scale:1,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1,duration:raw[clip].duration,transitionMs:90,...extra};
make('IDLE','Fighting Idle',{lockPlanarRoot:true,guardLoop:{start:0,end:raw['Fighting Idle'].duration,blend:.12}});
make('BLOCK','Center Block',{lockPlanarRoot:true,freeze:true,start:.65,duration:1});
make('INTRO','Rallying',{lockPlanarRoot:true,start:0,duration:3.6,playbackRate:1,stageYaw:0,transitionMs:160});
make('WIN','Cheering',{lockPlanarRoot:true});
make('RUN','Standing Sprint Forward',{locomotion:true,gaitRate:.95,guardLoop:{start:0,end:raw['Standing Sprint Forward'].duration,blend:.04}});
for(const [state,clip]of [['WALK_FORWARD','Short Step Forward'],['WALK_BACK','Shared Step Backward']])make(state,clip,{locomotion:true,plantFeet:true,gaitRate:1.2,gaitBlend:{clip:'Fighting Idle',time:0,weight:.85},guardLoop:{start:0,end:raw[clip].duration,blend:.05}});
make('LEAN','Shared Dodging',{lockPlanarRoot:true,playbackRate:2.3,evadeFrames:[24,65]});
const attack=(name,clip,start,duration,contacts,playbackRate)=>make(name,clip,{start,duration,contacts,playbackRate,attack:true,lockPlanarRoot:true,transitionMs:70});
attack('LIGHT_PUNCH','Jab Cross',.2,1.15,[[.233,'LeftHand',4,.05,.07],[.5,'RightHand',5,.05,.07]],1.35);
attack('HEAVY_PUNCH','Smash',.65,1.4,[[.367,'RightHand',8,.07,.07],[1.05,'LeftHand',7,.06,.08]],1.35);
attack('LIGHT_KICK','Bencao',.1,1.2,[[.55,'RightFoot',12,.07,.09]],1.3);
attack('HEAVY_KICK','Knee Jab',1.9,1.35,[[.8,'RightLeg',14,.08,.1]],1.35);
attack('SHOULDER','Standing Sprint Forward',0,.56,[[.3,'LeftArm',16,.12,.13]],1.1);cfg.SHOULDER.advance={from:0,to:.32,px:100};
attack('UPPERCUT','Surprise Uppercut',.72,1.1,[[.413,'RightHand',16,.07,.06]],1.35);
make('COMBO','Standing Sprint Forward',{attack:true,lockPlanarRoot:true,playbackRate:1.35,transitionMs:80,advance:{from:0,to:.32,px:55},sequence:[{clip:'Standing Sprint Forward',start:0,duration:.56},{clip:'Smash',start:.72,duration:1.25,blend:.12},{clip:'Surprise Uppercut',start:.16,duration:1.35,blend:.12}],duration:3.16,comboGapPx:172,finisherGroup:4,contacts:[[.3,'LeftArm',8,.12,.13],[.857,'RightHand',8,.08,.08],[1.54,'LeftHand',6,.07,.09],[2,'LeftHand',6,.06,.08],[2.783,'RightHand',13,.07,.06]]});
for(const [name,range]of Object.entries({LIGHT_PUNCH:155,HEAVY_PUNCH:130,LIGHT_KICK:180,HEAVY_KICK:105,SHOULDER:185,UPPERCUT:145}))cfg[name].attackRangePx=range;
make('HIT_BODY','Kidney Hit',{playbackRate:2,lockPlanarRoot:true});make('HIT_HEAD','Medium Hit To Head',{playbackRate:1.65,lockPlanarRoot:true});make('HIT_HEAVY','Medium Hit To Head',{playbackRate:1.6,lockPlanarRoot:true});
function rootState(name,clip,start,duration,extra={}){const c=make(name,clip,{start,duration,...extra});r.pose(c,0);const p=r.bones.Hips.position;c.rootOffset=[-p.x,0,p.y];r.pose(c,0);const x=r.point('Hips')[0];r.pose(c,duration);c.rootTravelPx=c.freeze?0:r.point('Hips')[0]-x;return c;}
rootState('FALL','Shared Falling Back Death',0,.75,{playbackRate:1.6});rootState('LAND','Shared Falling Back Death',.75,1.1,{playbackRate:2});rootState('DOWN','Shared Falling Back Death',1.85,.3,{freeze:true});
const flight=raw['Shared Flying Back Death'].duration;
rootState('FLY','Shared Flying Back Death',0,1.05,{playbackRate:1.4});rootState('FLY_LAND','Shared Flying Back Death',1.05,flight-1.05,{playbackRate:2});rootState('FLY_DOWN','Shared Flying Back Death',flight,.3,{freeze:true});rootState('KO_HOLD','Shared Flying Back Death',flight,1,{freeze:true});cfg.KO={...cfg.FLY,asset:'BEAR_NEW_KO'};
rootState('GETUP','Shared Getting Up',0,raw['Shared Getting Up'].duration,{playbackRate:1.8,transitionMs:120});
for(const [name,clip,yaw]of [['THROW_ATTACKER','Shoulder Throw, Aggressor',Math.PI],['THROW_VICTIM','Shoulder Throw, Victim',0]])rootState(name,clip,2.3,1.5,{playbackRate:2.5,stageYaw:yaw,pair:true,pairGapPx:127.75,...(name==='THROW_VICTIM'?{cameraOffsetPx:160,pivotX:352}:{})});
rootState('THROW_DOWN','Shoulder Throw, Victim',3.8,.3,{freeze:true,stageYaw:0});
for(const c of Object.values(cfg)){
 const frames=Math.ceil(c.duration*60),step=c.duration/frames;c.durations=Array(frames).fill(step*1000);c.boxes=[];c.hurtCapsules=[];c.footY=[];c.pushCenters=[];c.hits={};
 const airborne=[];
 for(let i=0;i<frames;i++){
  r.pose(c,i*step);const points=Object.keys(r.bones).map(n=>r.point(n));const box=[Math.min(...points.map(p=>p[0]))-25,Math.min(...points.map(p=>p[1]))-45,Math.max(...points.map(p=>p[0]))+25,Math.max(...points.map(p=>p[1]))+20];
  if(!box.every(Number.isFinite))throw Error('Invalid pose '+c.clip);c.boxes.push(box);c.footY.push(550);c.pushCenters.push([r.point('Hips')[0],40]);
  c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
  for(const [group,[time,bone,damage,before,after]]of (c.contacts||[]).entries()){const peak=Math.round(time/step),first=before===undefined?peak-2:Math.ceil((time-before)/step),last=after===undefined?peak+1:Math.floor((time+after)/step);if(c===cfg.COMBO?i>=[11,45,87,114,160][group]&&i<=[23,57,99,126,172][group]:i>=first&&i<=last){const p=r.point(bone),radius=bone.includes('Foot')?24:bone==='LeftArm'?30:bone.endsWith('Leg')?25:19;c.hits[i]={box:[p[0]-radius,p[1]-radius,radius*2,radius*2],bone,damage,group};}}
  if(c===cfg.JUMP&&Math.max(...['LeftFoot','RightFoot','LeftToeBase','RightToeBase'].map(n=>r.point(n)[1]))<525)airborne.push(i);
 }
 if(c===cfg.JUMP)c.airFrames=[Math.min(...airborne),Math.max(...airborne)];
 c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];delete c.contacts;
 if(c.attack&&!c.sequence){const keys=Object.keys(c.hits).map(Number),first=Math.min(...keys),last=Math.max(...keys);if(!keys.length)throw Error('Missing attack contacts');c.phaseTempo={first,last,startup:Math.max(1,first*step/c.playbackRate/.22),recovery:Math.max(1,(frames-last-1)*step/c.playbackRate/.28)};}
}
fs.writeFileSync(base+'config.json',JSON.stringify(cfg));
fs.writeFileSync(base+'manifest.json',JSON.stringify({character:'BEAR',sourceVersion:'bear-20261011',preservedInfluences:12,clips:Object.keys(raw),textures:{color:'color.webp',normal:'normal.webp',roughness:'roughness.webp',metalness:'metalness.webp'}}));
console.log('BEAR',Object.keys(cfg).length,'states; six basic attacks and separate five-hit combo; free jump disabled');
