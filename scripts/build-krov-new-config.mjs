import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';
const base='game/assets/krov-new/',rd=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(base+n))),raw=rd('clips.json.gz');
const r=rig(new T.ObjectLoader().parse(rd('model.json.gz')),raw,'KROV'),cfg={};
const make=(name,clip,extra={})=>cfg[name]={asset:'KROV_NEW_'+name,character:'KROV',label:clip,sourceVersion:'fighters-20261011',clip,attack:false,gain:10,cost:0,w:1024,h:640,scale:1,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1,duration:raw[clip].duration,transitionMs:90,...extra};
make('IDLE','Fighting Idle',{lockPlanarRoot:true,guardLoop:{start:0,end:raw['Fighting Idle'].duration,blend:.12}});
make('BLOCK','Center Block',{lockPlanarRoot:true,freeze:true,start:.65,duration:1});
make('INTRO','Salsa Dancing',{lockPlanarRoot:true,start:0,duration:5.5,playbackRate:1,stageYaw:0,transitionMs:160});
make('WIN','Yelling Out',{lockPlanarRoot:true});
make('RUN','Shared Sprint',{locomotion:true,gaitRate:.95,guardLoop:{start:0,end:raw['Shared Sprint'].duration,blend:.04}});
for(const [state,clip]of [['WALK_FORWARD','Short Step Forward'],['WALK_BACK','Step Backward']])make(state,clip,{locomotion:true,plantFeet:true,gaitRate:1.2,gaitBlend:{clip:'Fighting Idle',time:0,weight:.85},guardLoop:{start:0,end:raw[clip].duration,blend:.05}});
make('LEAN','Shared Dodging',{lockPlanarRoot:true,playbackRate:2.3,evadeFrames:[24,65]});
const attack=(name,clip,start,duration,contacts,playbackRate)=>make(name,clip,{start,duration,contacts,playbackRate,attack:true,lockPlanarRoot:true,transitionMs:70});
attack('LIGHT_PUNCH','Jab Cross',.2,1.15,[[.25,'LeftHand',5],[.5,'RightHand',6]],1.55);
attack('HEAVY_PUNCH','Hook Punch',.55,1.2,[[.583,'RightHand',14]],1.45);
attack('LIGHT_KICK','Mma Kick',.2,1.1,[[.483,'RightFoot',11]],1.5);
attack('HEAVY_KICK','Kicking',.6,1.65,[[.767,'RightFoot',15,.09,.10]],1.55);
attack('ELBOW','Illegal Elbow Punch',.3,1.05,[[.467,'RightForeArm',13,.09,.10]],1.5);
attack('UPPERCUT','Uppercut',.12,1.05,[[.347,'LeftHand',13,.06,.1]],1.5);
make('COMBO','Jab Cross',{attack:true,lockPlanarRoot:true,playbackRate:1.4,transitionMs:70,sequence:[{clip:'Jab Cross',start:.2,duration:.9},{clip:'Elbow Uppercut Combo',start:.2,duration:.7,blend:.1},{clip:'Illegal Elbow Punch',start:.35,duration:.75,blend:.1},{clip:'Elbow Punching',start:.3,duration:.9,blend:.1}],duration:3.25,comboGapPx:110,finisherGroup:4,finisher:'throw',contacts:[[.25,'LeftHand',5],[.5,'RightHand',5],[1.35,'LeftForeArm',6,.07,.09],[2.017,'RightForeArm',6,.07,.09],[2.867,'RightForeArm',6,.07,.09]]});
for(const [name,range]of Object.entries({LIGHT_PUNCH:155,HEAVY_PUNCH:155,LIGHT_KICK:180,HEAVY_KICK:165,ELBOW:115,UPPERCUT:145}))cfg[name].attackRangePx=range;
make('HIT_BODY','Big Kidney Hit',{playbackRate:2,lockPlanarRoot:true});make('HIT_HEAD','Medium Hit To Head',{playbackRate:1.65,lockPlanarRoot:true});make('HIT_HEAVY','Medium Hit To Head',{playbackRate:1.6,lockPlanarRoot:true});
function rootState(name,clip,start,duration,extra={}){const c=make(name,clip,{start,duration,...extra});r.pose(c,0);const p=r.bones.Hips.position;c.rootOffset=[-p.x,0,p.y];r.pose(c,0);const x=r.point('Hips')[0];r.pose(c,duration);c.rootTravelPx=c.freeze?0:r.point('Hips')[0]-x;return c;}
rootState('FALL','Shared Falling Back Death',0,.75,{playbackRate:1.6});rootState('LAND','Shared Falling Back Death',.75,1.1,{playbackRate:2});rootState('DOWN','Shared Falling Back Death',1.85,.3,{freeze:true});
const flight=raw['Flying Back Death'].duration;
rootState('FLY','Flying Back Death',0,1.05,{playbackRate:1.4});rootState('FLY_LAND','Flying Back Death',1.05,flight-1.05,{playbackRate:2});rootState('FLY_DOWN','Flying Back Death',flight,.3,{freeze:true});rootState('KO_HOLD','Flying Back Death',flight,1,{freeze:true});cfg.KO={...cfg.FLY,asset:'KROV_NEW_KO'};
rootState('GETUP','Getting Up',0,raw['Getting Up'].duration,{playbackRate:1.8,transitionMs:120});
for(const [name,clip,yaw]of [['THROW_ATTACKER','Shoulder Throw, Aggressor',Math.PI],['THROW_VICTIM','Shoulder Throw, Victim',0]])rootState(name,clip,2.3,1.5,{playbackRate:2.5,stageYaw:yaw,pair:true,pairGapPx:127.75,...(name==='THROW_VICTIM'?{cameraOffsetPx:160,pivotX:352}:{})});
rootState('THROW_DOWN','Shoulder Throw, Victim',3.8,.3,{freeze:true,stageYaw:0});
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
fs.writeFileSync(base+'manifest.json',JSON.stringify({character:'KROV',sourceVersion:'fighters-20261011',preservedInfluences:12,clips:Object.keys(raw),textures:{color:'color.webp',normal:'normal.webp',roughness:'roughness.webp',metalness:'metalness.webp'}}));
console.log('KROV',Object.keys(cfg).length,'states; six basic attacks and separate five-hit combo; free jump disabled');
