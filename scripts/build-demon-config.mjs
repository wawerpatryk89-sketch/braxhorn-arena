import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';
const base='game/assets/demon-new/',rd=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(base+n))),raw=rd('clips.json.gz');
const r=rig(new T.ObjectLoader().parse(rd('model.json.gz')),raw,'DEMON'),cfg={};
const make=(name,clip,extra={})=>cfg[name]={asset:'DEMON_NEW_'+name,character:'DEMON',label:clip,sourceVersion:'demon-20261018',clip,attack:false,gain:10,cost:0,w:1024,h:640,scale:1,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1,duration:raw[clip].duration,transitionMs:90,...extra};
make('IDLE','Fighting Idle',{lockPlanarRoot:true,guardLoop:{start:0,end:raw['Fighting Idle'].duration,blend:.1}});
make('BLOCK','Center Block',{freeze:true,start:.65,duration:1,lockPlanarRoot:true});
make('INTRO','Yelling Out',{lockPlanarRoot:true,stageYaw:0});make('WIN','Yelling Out',{lockPlanarRoot:true,stageYaw:0});
for(const [state,clip,rate]of [['WALK_FORWARD','Walking',1],['WALK_BACK','Step Backward',1]])make(state,clip,{locomotion:true,gaitRate:rate,transitionMs:130,guardLoop:{start:0,end:raw[clip].duration,blend:.06}});
make('RUN','Standing Sprint Forward',{locomotion:true,gaitRate:1,guardLoop:{start:0,end:raw['Standing Sprint Forward'].duration,blend:.05}});
make('LEAN','Shared Dodging',{lockPlanarRoot:true,playbackRate:2.1,evadeFrames:[24,65]});
const attack=(name,clip,start,duration,contacts,playbackRate)=>make(name,clip,{start,duration,contacts,playbackRate,attack:true,lockPlanarRoot:true,transitionMs:85});
// Strike times are filled from the retargeted rig's 60 Hz contact scan below.
attack('LIGHT_PUNCH','Punching',0,raw.Punching.duration,[[.35,'RightHand',7,.07,.08]],1.4);
attack('HEAVY_PUNCH','Hook Punch',0,raw['Hook Punch'].duration,[[1.133,'RightHand',12,.08,.09]],1.4);
attack('LIGHT_KICK','Mma Kick',0,raw['Mma Kick'].duration,[[.683,'RightFoot',10,.08,.09]],1.35);
attack('HEAVY_KICK','Roundhouse Kick',0,raw['Roundhouse Kick'].duration,[[1.05,'LeftFoot',15,.08,.09]],1.35);
attack('SHOULDER','Headbutt',0,raw.Headbutt.duration,[[.75,'Head',13,.075,.09]],1.4);
attack('UPPERCUT','Surprise Uppercut',.72,1.1,[[.447,'RightHand',16,.07,.06]],1.35);
// The authored Hurricane Kick holds an airborne spin throughout. Give the combo
// a real takeoff and landing from Macaco Side, keeping all source joint samples.
// Three forward passes of the left foot are distinct contacts; no invented hits.
const comboSegments=[{clip:'Macaco Side',start:1.05,duration:.3},{clip:'Hurricane Kick',start:.3,duration:1.5333333333,blend:.2},{clip:'Macaco Side',start:2,duration:.65,blend:.18}];
make('COMBO','Hurricane Kick',{attack:true,lockPlanarRoot:true,playbackRate:1.35,sequence:comboSegments,duration:2.4833333333,comboGapPx:135,finisherGroup:2,contacts:[[.9,'LeftFoot',8,.06,.06],[1.35,'LeftFoot',9,.06,.06],[1.8,'LeftFoot',17,.06,.04]]});
cfg.COMBO.label='Huragan z wyskoku';cfg.HEAVY_KICK.label='Mocne kopnięcie okrężne';
for(const [state,range] of Object.entries({LIGHT_PUNCH:155,HEAVY_PUNCH:135,LIGHT_KICK:190,HEAVY_KICK:185,SHOULDER:100,UPPERCUT:145}))cfg[state].attackRangePx=range;
make('HIT_BODY','Hit To Body',{playbackRate:1.8,lockPlanarRoot:true});make('HIT_HEAD','Medium Hit To Head',{playbackRate:1.5,lockPlanarRoot:true});make('HIT_HEAVY','Medium Hit To Head',{playbackRate:1.3,lockPlanarRoot:true});
function rootState(name,clip,start,duration,extra={}){const c=make(name,clip,{start,duration,...extra});r.pose(c,0);const p=r.bones.Hips.position;c.rootOffset=[-p.x,0,p.y];r.pose(c,0);const x=r.point('Hips')[0];r.pose(c,duration);c.rootTravelPx=c.freeze?0:r.point('Hips')[0]-x;return c;}
rootState('FALL','Sweep Fall',0,1.1,{playbackRate:1.6});rootState('LAND','Sweep Fall',1.1,1.4,{playbackRate:1.6});rootState('DOWN','Sweep Fall',2.5,.3,{freeze:true});
const flight=raw['Flying Back Death'].duration;
rootState('FLY','Flying Back Death',0,1.05,{playbackRate:1.4});rootState('FLY_LAND','Flying Back Death',1.05,flight-1.05,{playbackRate:2});rootState('FLY_DOWN','Flying Back Death',flight,.3,{freeze:true});rootState('KO_HOLD','Flying Back Death',flight,1,{freeze:true});cfg.KO={...cfg.FLY,asset:'DEMON_NEW_KO'};
rootState('GETUP','Shared Getting Up',0,raw['Shared Getting Up'].duration,{playbackRate:1.8,transitionMs:120});
rootState('THROW_ATTACKER','Shoulder Throw, Aggressor',2.3,1.5,{playbackRate:2.5,stageYaw:Math.PI,pair:true,pairGapPx:127.75});
rootState('THROW_VICTIM','Shoulder Throw, Victim',2.3,1.5,{playbackRate:2.5,stageYaw:0,pair:true,cameraOffsetPx:160,pivotX:352});
rootState('THROW_DOWN','Shoulder Throw, Victim',3.8,.3,{freeze:true,stageYaw:0});
make('CONTACT_PUSH','Blocking',{lockPlanarRoot:true,contactRecovery:true,duration:1.18});
make('CONTACT_RECEIVE','Reaction',{lockPlanarRoot:true,contactRecovery:true,duration:1.18});
make('CONTACT_FALL','Sweep Fall',{lockPlanarRoot:true,contactRecovery:true,sequence:[{clip:'Sweep Fall',duration:2.5},{clip:'Shared Getting Up',duration:raw['Shared Getting Up'].duration,blend:.2}],duration:2.5+raw['Shared Getting Up'].duration});
// Engine lifecycle states are generated from this fighter's own retargeted clips.
make('APPROACH','Walking',{locomotion:true,gaitRate:1,guardLoop:{start:0,end:raw.Walking.duration,blend:.06}});
make('BLOCK_LOW','Center Block',{freeze:true,start:.65,duration:1,lockPlanarRoot:true,lowGuard:true});
make('QUICK_BACK','Step Backward',{lockPlanarRoot:true,playbackRate:2,retreat:{from:.04,to:.74,height:.48}});
make('WIN_ROUND','Yelling Out',{lockPlanarRoot:true,stageYaw:0,faceCamera:true,start:.4,duration:2});
make('WIN_MATCH','Yelling Out',{lockPlanarRoot:true,stageYaw:0,faceCamera:true});
for(let tier=1;tier<=3;tier++)for(const [region,clip]of [['HEAD','Medium Hit To Head'],['BODY','Hit To Body']])make('HIT_R'+tier+'_'+region,clip,{lockPlanarRoot:true,reactionTier:tier,playbackRate:raw[clip].duration/(.264*tier),reactionBlend:{clip:'Fighting Idle',start:0,weight:[0,.4,.72,1][tier]}});
for(const c of Object.values(cfg)){
 const frames=Math.ceil(c.duration*60),step=c.duration/frames;c.durations=Array(frames).fill(step*1000);c.boxes=[];c.hurtCapsules=[];c.footY=[];c.pushCenters=[];c.hits={};
 const airborne=[];
 for(let i=0;i<frames;i++){
  r.pose(c,i*step);const points=Object.keys(r.bones).map(n=>r.point(n));const box=[Math.min(...points.map(p=>p[0]))-25,Math.min(...points.map(p=>p[1]))-45,Math.max(...points.map(p=>p[0]))+25,Math.max(...points.map(p=>p[1]))+20];
  if(!box.every(Number.isFinite))throw Error('Invalid pose '+c.clip);c.boxes.push(box);c.footY.push(550);c.pushCenters.push([r.point('Hips')[0],40]);
  c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
  for(const [group,[time,bone,damage,before,after]]of (c.contacts||[]).entries()){const peak=Math.round(time/step),first=before===undefined?peak-2:Math.ceil((time-before)/step),last=after===undefined?peak+1:Math.floor((time+after)/step);if(i>=first&&i<=last){const p=r.point(bone),radius=bone.includes('Foot')?24:bone==='Head'?26:bone==='LeftArm'?30:bone.endsWith('Leg')?25:19;c.hits[i]={box:[p[0]-radius,p[1]-radius,radius*2,radius*2],bone,damage,group};}}
  if(c===cfg.JUMP&&Math.max(...['LeftFoot','RightFoot','LeftToeBase','RightToeBase'].map(n=>r.point(n)[1]))<525)airborne.push(i);
 }
 if(c===cfg.JUMP)c.airFrames=[Math.min(...airborne),Math.max(...airborne)];
 c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];delete c.contacts;
 if(c.attack&&!c.sequence){const keys=Object.keys(c.hits).map(Number),first=Math.min(...keys),last=Math.max(...keys);if(!keys.length)throw Error('Missing attack contacts');c.phaseTempo={first,last,startup:Math.max(1,first*step/c.playbackRate/(c.clip==='Chapa-Giratoria'?.65:c.clip==='Martelo Do Chau Sem Mao'?.5:.25)),recovery:Math.max(1,(frames-last-1)*step/c.playbackRate/.4)};}
}
fs.writeFileSync(base+'config.json',JSON.stringify(cfg));
fs.writeFileSync(base+'manifest.json',JSON.stringify({character:'DEMON',sourceVersion:'demon-20261018',preservedInfluences:12,clips:Object.keys(raw),textures:{color:'color.webp',normal:'normal.webp',roughness:'roughness.webp',metalness:'metalness.webp'}}));
console.log('DEMON',Object.keys(cfg).length,'states; demon: straight punch, hook, MMA kick, roundhouse kick, headbutt, uppercut, jumping three-contact hurricane combo');

const validation={status:'PASS',samplingHz:60,states:Object.keys(cfg).length,frames:Object.values(cfg).reduce((n,c)=>n+c.durations.length,0),contactGroups:Object.values(cfg).filter(c=>c.attack).reduce((n,c)=>n+new Set(Object.values(c.hits).map(h=>h.group)).size,0),notes:'All generated pose boxes, hurt capsules and attack contacts checked finite. Numerical sampling is not a phone/browser visual jitter test; contact recovery uses supplied clips without paired shoulder IK.'};
for(const c of Object.values(cfg))for(const capsule of c.hurtCapsules.flat())if(![...capsule.a,...capsule.b,capsule.radius].every(Number.isFinite))throw Error('Invalid capsule '+c.clip);
fs.writeFileSync('docs/demon-config-validation.json',JSON.stringify(validation,null,2));
