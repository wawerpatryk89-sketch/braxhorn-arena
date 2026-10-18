import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';
const base='game/assets/vexa-new/',rd=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(base+n))),raw=rd('clips.json.gz');
const r=rig(new T.ObjectLoader().parse(rd('model.json.gz')),raw,'VEXA'),cfg={};
const make=(name,clip,extra={})=>cfg[name]={asset:'VEXA_NEW_'+name,character:'VEXA',label:clip,sourceVersion:'vexa-20261011',clip,attack:false,gain:10,cost:0,w:1024,h:640,scale:1,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1,duration:raw[clip].duration,transitionMs:90,...extra};
make('IDLE','Boxing (1)',{lockPlanarRoot:true,guardLoop:{start:0,end:2.2,blend:.12}});
make('BLOCK','Right Block',{freeze:true,start:.65,duration:1});
make('BLOCK_LOW','Ducking',{freeze:true,start:.9,duration:1});
make('INTRO','Roundhouse Kick (1)',{lockPlanarRoot:true,playbackRate:1.15,sequence:[{clip:'Roundhouse Kick (1)',duration:raw['Roundhouse Kick (1)'].duration},{clip:'Armada',duration:raw.Armada.duration,blend:.16}],duration:raw['Roundhouse Kick (1)'].duration+raw.Armada.duration});
make('WIN','Victory',{lockPlanarRoot:true});
make('RUN','Sprint',{locomotion:true,gaitRate:.9,guardLoop:{start:0,end:raw.Sprint.duration,blend:.04}});
for(const [state,clip]of [['WALK_FORWARD','Medium Step Forward'],['WALK_BACK','Shared Step Backward']])make(state,clip,{locomotion:true,plantFeet:true,gaitRate:1.35,gaitBlend:{clip:'Boxing (1)',time:.2,weight:.4},guardLoop:{start:0,end:raw[clip].duration,blend:.06}});
make('LEAN','Ducking',{lockPlanarRoot:true,playbackRate:1.5,evadeFrames:[12,36],sequence:[{clip:'Ducking',start:.32,duration:.64},{clip:'Boxing (1)',start:.2,duration:.30,blend:.25}],duration:.94});
const attack=(name,clip,start,duration,contacts,playbackRate)=>make(name,clip,{start,duration,contacts,playbackRate,attack:true,lockPlanarRoot:true,transitionMs:70});
attack('LIGHT_PUNCH','Boxing',.25,1.15,[[.4,'RightHand',10]],1.5);
attack('HEAVY_PUNCH','Boxing (2)',.17,1.2,[[.247,'LeftHand',5],[.48,'RightHand',7]],1.6);
attack('LIGHT_KICK','Pontera',.1,1.15,[[.433,'RightFoot',10]],1.4);
attack('HEAVY_KICK','Roundhouse Kick (1)',.35,1.4,[[.65,'LeftFoot',13]],1.65);
attack('SPIN_KICK','Armada',.4,1.18,[[.85,'LeftFoot',14]],1.65);
attack('FLYING_KICK','Flying Kick',.08,1.25,[[.47,'LeftFoot',13,.15,.07]],1.4);
make('COMBO','Boxing (2)',{attack:true,lockPlanarRoot:true,playbackRate:1.45,transitionMs:70,sequence:[{clip:'Boxing (2)',start:.17,duration:1.05},{clip:'Roundhouse Kick (1)',start:.35,duration:1.12,blend:.12},{clip:'Armada',start:.4,duration:1.18,blend:.12},{clip:'Flying Kick',start:.08,duration:1.25,blend:.12}],duration:4.6,comboGapPx:155,finisherGroup:4,contacts:[[.247,'LeftHand',5],[.48,'RightHand',5],[1.70,'LeftFoot',9],[3.02,'LeftFoot',9],[3.82,'LeftFoot',16,.15,.07]]});
for(const [name,range]of Object.entries({LIGHT_PUNCH:160,HEAVY_PUNCH:145,LIGHT_KICK:180,HEAVY_KICK:190,SPIN_KICK:160,FLYING_KICK:180}))cfg[name].attackRangePx=range;
make('HIT_BODY','Hit Reaction',{playbackRate:2,lockPlanarRoot:true});make('HIT_HEAD','Receiving An Uppercut',{playbackRate:2,lockPlanarRoot:true});make('HIT_HEAVY','Receive Uppercut To The Face',{playbackRate:1.8,lockPlanarRoot:true});
function rootState(name,clip,start,duration,extra={}){const c=make(name,clip,{start,duration,...extra});r.pose(c,0);const p=r.bones.Hips.position;c.rootOffset=[-p.x,0,p.y];r.pose(c,0);const x=r.point('Hips')[0];r.pose(c,duration);c.rootTravelPx=c.freeze?0:r.point('Hips')[0]-x;return c;}
rootState('FALL','Falling Back Death',0,.75,{playbackRate:1.6});rootState('LAND','Falling Back Death',.75,1.1,{playbackRate:2});rootState('DOWN','Falling Back Death',1.85,.3,{freeze:true});
const flight=raw['Flying Back Death'].duration;
rootState('FLY','Flying Back Death',0,1.05,{playbackRate:1.4});rootState('FLY_LAND','Flying Back Death',1.05,flight-1.05,{playbackRate:2});rootState('FLY_DOWN','Flying Back Death',flight,.3,{freeze:true});rootState('KO_HOLD','Flying Back Death',flight,1,{freeze:true});cfg.KO={...cfg.FLY,asset:'VEXA_NEW_KO'};
rootState('GETUP','Shared Kip Up',0,raw['Shared Kip Up'].duration,{playbackRate:1.9,transitionMs:120});
for(const [name,clip,yaw]of [['THROW_ATTACKER','Shoulder Throw, Aggressor',Math.PI],['THROW_VICTIM','Shared Shoulder Throw, Victim',0]])rootState(name,clip,2.3,1.5,{playbackRate:2.5,stageYaw:yaw,pair:true,pairGapPx:127.75,...(name==='THROW_VICTIM'?{cameraOffsetPx:160,pivotX:352}:{})});
rootState('THROW_DOWN','Shared Shoulder Throw, Victim',3.8,.3,{freeze:true,stageYaw:0});
for(const c of Object.values(cfg)){
 const frames=Math.ceil(c.duration*60),step=c.duration/frames;c.durations=Array(frames).fill(step*1000);c.boxes=[];c.hurtCapsules=[];c.footY=[];c.pushCenters=[];c.hits={};
 const airborne=[];
 for(let i=0;i<frames;i++){
  r.pose(c,i*step);const points=Object.keys(r.bones).map(n=>r.point(n));const box=[Math.min(...points.map(p=>p[0]))-25,Math.min(...points.map(p=>p[1]))-45,Math.max(...points.map(p=>p[0]))+25,Math.max(...points.map(p=>p[1]))+20];
  if(!box.every(Number.isFinite))throw Error('Invalid pose '+c.clip);c.boxes.push(box);c.footY.push(550);c.pushCenters.push([r.point('Hips')[0],40]);
  c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
  for(const [group,[time,bone,damage,before,after]]of (c.contacts||[]).entries()){const peak=Math.round(time/step),first=before===undefined?peak-2:Math.ceil((time-before)/step),last=after===undefined?peak+1:Math.floor((time+after)/step);if(i>=first&&i<=last){const p=r.point(bone),radius=bone.includes('Foot')?24:19;c.hits[i]={box:[p[0]-radius,p[1]-radius,radius*2,radius*2],bone,damage,group};}}
  if(c===cfg.JUMP&&Math.max(...['LeftFoot','RightFoot','LeftToeBase','RightToeBase'].map(n=>r.point(n)[1]))<525)airborne.push(i);
 }
 if(c===cfg.JUMP)c.airFrames=[Math.min(...airborne),Math.max(...airborne)];
 c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];delete c.contacts;
 if(c.attack&&!c.sequence){const keys=Object.keys(c.hits).map(Number),first=Math.min(...keys),last=Math.max(...keys);if(!keys.length)throw Error('Missing attack contacts');c.phaseTempo={first,last,startup:Math.max(1,first*step/c.playbackRate/.22),recovery:Math.max(1,(frames-last-1)*step/c.playbackRate/.28)};}
}
fs.writeFileSync(base+'config.json',JSON.stringify(cfg));
fs.writeFileSync(base+'manifest.json',JSON.stringify({character:'VEXA',sourceVersion:'vexa-20261011',preservedInfluences:8,clips:Object.keys(raw),textures:{color:'color.webp',normal:'normal.webp',roughness:'roughness.webp',metalness:'metalness.webp'}}));
console.log('VEXA',Object.keys(cfg).length,'states; six basic attacks and separate five-hit combo; free jump disabled');
