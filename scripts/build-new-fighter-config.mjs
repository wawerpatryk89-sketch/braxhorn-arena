import fs from'node:fs';import zlib from'node:zlib';import * as T from'three';import{rig}from'../game/assets/fighter-source-core.js';
const version='new-roster-20261011';
for(const who of ['BRAX','NYXA']){
 const base='game/assets/'+who.toLowerCase()+'-new/',rd=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(base+n))),raw=rd('clips.json.gz'),r=rig(new T.ObjectLoader().parse(rd('model.json.gz')),raw,who),old=JSON.parse(fs.readFileSync(base+'config.json')),cfg=who==='NYXA'?old:{};
 const make=(name,clip,extra={})=>cfg[name]={asset:who+'_NEW_'+name,character:who,label:clip,sourceVersion:version,clip,attack:false,gain:10,cost:0,w:1024,h:640,scale:1,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1,duration:raw[clip].duration,transitionMs:80,...extra};
 if(who==='BRAX'){
 make('IDLE','Shared Fighting Idle',{label:'Bojowy balans',duration:raw['Shared Fighting Idle'].duration,guardLoop:{start:0,end:raw['Shared Fighting Idle'].duration,blend:.12},lockPlanarRoot:true,transitionMs:100});
 make('BLOCK','Center Block',{freeze:true,start:.65,duration:1});make('BLOCK_LOW','Center Block',{freeze:true,start:.65,duration:1});
 make('INTRO','Running Forward Flip',{lockPlanarRoot:true,sequence:[{clip:'Running Forward Flip',duration:raw['Running Forward Flip'].duration},{clip:'Warming Up',duration:raw['Warming Up'].duration,blend:.16}],duration:raw['Running Forward Flip'].duration+raw['Warming Up'].duration});make('WIN','Taunt');make('RUN','Running',{locomotion:true,gaitRate:.883,guardLoop:{start:0,end:raw.Running.duration,blend:.05}});
 make('WALK_FORWARD','Medium Step Forward Retargeted',{locomotion:true,plantFeet:true,gaitRate:1.5,gaitBlend:{clip:'Center Block',time:1.2,weight:.3},guardLoop:{start:0,end:raw['Medium Step Forward Retargeted'].duration,blend:.06}});make('WALK_BACK','Step Backward',{locomotion:true,plantFeet:true,gaitRate:1.4,gaitBlend:{clip:'Center Block',time:1.2,weight:.3},guardLoop:{start:0,end:.8,blend:.06}});make('LEAN','Dodging',{lockPlanarRoot:true,playbackRate:2,evadeFrames:[10,65]});
 const atk=(name,clip,contacts,rate=1.6,extra={})=>make(name,clip,{attack:true,playbackRate:rate,transitionMs:60,lockPlanarRoot:true,contacts,...extra});
 atk('LIGHT_PUNCH','Jab Cross (1)',[[.43,'LeftHand',6],[.72,'RightHand',7]],1.9);
 atk('HEAVY_PUNCH','Hook',[[.99,'LeftHand',13]],1.8);
 atk('DOUBLE_PUNCH','Boxing',[[.483,'LeftHand',12]],1.8);
 atk('LIGHT_KICK','Mma Kick (1)',[[.6,'RightFoot',10]],1.5);
 atk('HEAVY_KICK','Kicking',[[1.383,'LeftFoot',14]],2);
 atk('TEEP','Kicking (2)',[[1.867,'RightFoot',12]],2.2);
 atk('COMBO','Uppercut Jab',[[.8,'LeftHand',6],[1.417,'RightHand',6],[1.767,'LeftHand',6],[2.017,'RightHand',6],[2.3,'LeftHand',7],[2.55,'RightHand',7],[raw['Uppercut Jab'].duration+1.383,'LeftFoot',18]],1.6,{sequence:[{clip:'Uppercut Jab',duration:raw['Uppercut Jab'].duration},{clip:'Kicking',duration:raw.Kicking.duration,blend:.12}],duration:raw['Uppercut Jab'].duration+raw.Kicking.duration,comboGapPx:128,finisherGroup:6});
 make('HIT_BODY','Hit To Body',{playbackRate:2});make('HIT_HEAD','Head Hit',{playbackRate:1.5});make('HIT_HEAVY','Big Hit To Head',{playbackRate:1.8});
 const aliases={HOOK:'HEAVY_PUNCH',UPPERCUT:'HEAVY_PUNCH',ELBOW:'HEAVY_PUNCH',COUNTER:'HEAVY_PUNCH',CHAIN_STRIKES:'DOUBLE_PUNCH',KNEE_CHAIN:'TEEP',CLINCH_KNEE:'TEEP',CAPOEIRA:'HEAVY_KICK',MUAY_THAI_ROUNDHOUSE:'HEAVY_KICK',CROUCH_KICK:'LIGHT_KICK',CROUCH_PUNCH:'LIGHT_PUNCH',HEAVY_STOMP:'TEEP'};for(const[n,a]of Object.entries(aliases))cfg[n]=cfg[a];
 }else{cfg.COMBO.comboGapPx=100;cfg.WALK_FORWARD.clip='Medium Step Forward (1)';make('BLOCK','Right Block',{freeze:true,start:.65,duration:1});}
 // A complete supplied fall, landing and get-up, using planar root extraction at state boundaries.
 const flight='Flying Back Death',end=raw[flight].duration,land=2.35;
 function rootConfig(name,clip,start,duration,extra={}){const c=make(name,clip,{start,duration,...extra});r.pose(c,0);const p=r.bones.Hips.position;c.rootOffset=[-p.x,0,p.y];r.pose(c,0);const x=r.point('Hips')[0];r.pose(c,duration);c.rootTravelPx=c.freeze?0:r.point('Hips')[0]-x;return c;}
 rootConfig('FLY',flight,0,land,{playbackRate:1.5});rootConfig('FLY_LAND',flight,land,end-land,{playbackRate:1.5});rootConfig('FLY_DOWN',flight,end,.35,{freeze:true});rootConfig('KO_HOLD',flight,end,1,{freeze:true});
 // Separate grounded collapse from the dedicated airborne launch.
 const fall=who==='BRAX'?"Rockin' Shackle B":'Dying',fallStart=who==='BRAX'?1.25:1.2,fe=who==='BRAX'?3.75:5.75;
 rootConfig('FALL',fall,fallStart,fe-fallStart-.3,{playbackRate:2.2});rootConfig('LAND',fall,fe-.3,.3,{playbackRate:1.4});rootConfig('DOWN',fall,fe,.3,{freeze:true});cfg.KO={...cfg.FLY,asset:who+'_NEW_KO'};
 rootConfig('GETUP',who==='BRAX'?'Kip Up':'Getting Up',0,raw[who==='BRAX'?'Kip Up':'Getting Up'].duration,{playbackRate:who==='BRAX'?2:3.5,transitionMs:100});
 for(const [name,clip,yaw]of [['THROW_ATTACKER','Shoulder Throw, Aggressor',Math.PI],['THROW_VICTIM','Shoulder Throw, Victim',0]])rootConfig(name,clip,2.3,1.5,{playbackRate:2.5,stageYaw:yaw,pair:true,pairGapPx:127.75,...(name==='THROW_VICTIM'?{cameraOffsetPx:160,pivotX:352}:{})});
 rootConfig('THROW_DOWN','Shoulder Throw, Victim',3.8,.3,{freeze:true,stageYaw:0});
 for(const c of new Set(Object.values(cfg))){
 c.sourceVersion=version;c.duration??=raw[c.clip].duration;const frames=Math.ceil(c.duration*60),step=c.duration/frames;c.durations=Array(frames).fill(step*1000);c.boxes=[];c.hurtCapsules=[];c.footY=[];c.pushCenters=[];
 const contacts=c.contacts||Object.entries(c.hits||{}).map(([f,h])=>[+f*(c.durations?.[0]||1000/60)/1000,h.bone,h.damage,h.group]);c.hits={};
 for(let i=0;i<frames;i++){r.pose(c,i*step);const pts=Object.keys(r.bones).map(n=>r.point(n));const box=[Math.min(...pts.map(p=>p[0]))-25,Math.min(...pts.map(p=>p[1]))-45,Math.max(...pts.map(p=>p[0]))+25,Math.max(...pts.map(p=>p[1]))+20];if(!box.every(Number.isFinite))throw Error('Invalid pose '+c.clip);c.boxes.push(box);c.footY.push(550);c.pushCenters.push([r.point('Hips')[0],42]);
 c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
 for(let j=0;j<contacts.length;j++){const[t,bone,damage,group]=contacts[j],peak=Math.round(t/step);if(c.contacts?(c===cfg.COMBO&&who==='BRAX'?i>=peak-7&&i<=peak+5:i>=peak-2&&i<=peak+1):i===peak){const p=r.point(bone),radius=bone.includes('Foot')?24:19;c.hits[i]={box:[p[0]-radius,p[1]-radius,radius*2,radius*2],bone,damage,group:group??j};}}
 }
 c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];delete c.contacts;
 if(c.attack&&!c.sequence){const keys=Object.keys(c.hits).map(Number);if(!keys.length)throw Error('Attack without contacts '+c.clip);const first=Math.min(...keys),last=Math.max(...keys);c.phaseTempo={first,last,startup:Math.max(1,first*step/c.playbackRate/.25),recovery:Math.max(1,(frames-last-1)*step/c.playbackRate/.3)};}
 }
 fs.writeFileSync(base+'config.json',JSON.stringify(cfg));fs.writeFileSync(base+'manifest.json',JSON.stringify({character:who,sourceVersion:version,preservedInfluences:8,clips:Object.keys(raw),textures:{color:'color.webp',normal:'normal.webp',roughness:'roughness.webp',metalness:'metalness.webp'}}));console.log(who,Object.keys(cfg).length,'states',Object.keys(raw).length,'source clips');
}
