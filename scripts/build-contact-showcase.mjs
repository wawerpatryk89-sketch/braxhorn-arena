import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import * as T from 'three';
import {rig,VIEW,SIZE} from '../game/assets/fighter-source-core.js';

// Author a matched forearm clinch on the existing rigs, without changing meshes,
// weights, materials or any attack. Source motion remains available unchanged.
const read=(dir,n)=>JSON.parse(zlib.gunzipSync(fs.readFileSync(dir+n)));
const dirFor=who=>'game/assets/'+who.toLowerCase()+'-new/';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const axis=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2);
const inverseAxis=axis.clone().invert();
const vec=(x,y,z)=>new T.Vector3(x,y,z);
const boneMap=model=>{const b={};model.traverse(o=>{if(o.isBone)b[o.name.replace(/^mixamorig/,'')]=o;});return b;};
const world=b=>b.getWorldPosition(new T.Vector3());
function rotateWorld(b,delta){
 const q=b.getWorldQuaternion(new T.Quaternion()).premultiply(delta);
 b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));
 b.updateWorldMatrix(false,true);
}
function aim(b,end,target){
 const p=world(b),old=world(end).sub(p).normalize(),next=target.clone().sub(p).normalize();
 rotateWorld(b,new T.Quaternion().setFromUnitVectors(old,next));
}
function armIK(r,side,target,weight){
 const upper=r.bones[side+'Arm'],lower=r.bones[side+'ForeArm'],hand=r.bones[side+'Hand'];
 const a=world(upper),b=world(lower),c=world(hand),handQ=hand.getWorldQuaternion(new T.Quaternion());
 const goal=c.clone().lerp(target,weight),l1=a.distanceTo(b),l2=b.distanceTo(c),d=Math.min(l1+l2-.006,Math.max(Math.abs(l1-l2)+.006,a.distanceTo(goal)));
 const direction=goal.clone().sub(a).normalize(),x=(l1*l1-l2*l2+d*d)/(2*d),y=Math.sqrt(Math.max(0,l1*l1-x*x));
 const pole=vec(-.06,-1,side==='Left'?-.45:.45);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
 const elbow=a.clone().addScaledVector(direction,x).addScaledVector(pole,y);
 aim(upper,lower,elbow);aim(lower,hand,a.clone().addScaledVector(direction,d));
 hand.quaternion.copy(hand.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(handQ));r.stage.updateMatrixWorld(true);
}
function snapshot(r){return Object.fromEntries(Object.entries(r.bones).map(([n,b])=>[n,{p:b.position.clone(),q:b.quaternion.clone()}]));}
function blend(r,from,w){for(const[n,b]of Object.entries(r.bones)){b.position.lerp(from[n].p,1-w);b.quaternion.slerp(from[n].q,1-w);}r.stage.updateMatrixWorld(true);}
function bake(r,name,duration,pose){
 const frames=Math.round(duration*60),times=Array.from({length:frames+1},(_,i)=>i/60),tracks=[];
 const values=Object.fromEntries(Object.keys(r.bones).map(n=>[n,[]])),hips=[];
 for(const time of times){pose(time);for(const[n,b]of Object.entries(r.bones)){const q=b.quaternion.clone();if(n==='Hips')q.premultiply(inverseAxis);q.normalize().toArray(values[n],values[n].length);}r.bones.Hips.position.clone().applyQuaternion(inverseAxis).toArray(hips,hips.length);}
 tracks.push(new T.VectorKeyframeTrack('mixamorigHips.position',times,hips));
 for(const[n,v]of Object.entries(values))tracks.push(new T.QuaternionKeyframeTrack('mixamorig'+n+'.quaternion',times,v));
 return T.AnimationClip.toJSON(new T.AnimationClip(name,duration,tracks));
}
function retarget(who,donor,name,out){
 const sourceDir=dirFor(donor),targetDir=dirFor(who),sm=new T.ObjectLoader().parse(read(sourceDir,'model.json.gz')),tm=new T.ObjectLoader().parse(read(targetDir,'model.json.gz'));
 const sb=boneMap(sm),tb=boneMap(tm),source=read(sourceDir,'clips.json.gz')[name],clip=T.AnimationClip.parse(source);
 const ratio=(tb.LeftLeg.position.length()+tb.LeftFoot.position.length())/(sb.LeftLeg.position.length()+sb.LeftFoot.position.length());
 for(const track of clip.tracks){const[n,p]=track.name.split('.'),key=n.replace(/^mixamorig/,'');assert(sb[key]&&tb[key],n);
  if(p==='quaternion'){const delta=tb[key].quaternion.clone().multiply(sb[key].quaternion.clone().invert());for(let i=0;i<track.values.length;i+=4)new T.Quaternion().fromArray(track.values,i).premultiply(delta).normalize().toArray(track.values,i);}
  if(p==='position'){assert.equal(key,'Hips');for(let i=0;i<track.values.length;i+=3)new T.Vector3().fromArray(track.values,i).sub(sb[key].position).multiplyScalar(ratio).add(tb[key].position).toArray(track.values,i);}
 }
 clip.name=out;return T.AnimationClip.toJSON(clip);
}
function measure(r,c){
 const frames=Math.ceil(c.duration*60),dt=c.duration/frames;
 c.durations=Array(frames).fill(dt*1000);c.boxes=[];c.hurtCapsules=[];c.pushCenters=[];c.footY=[];
 for(let i=0;i<frames;i++){r.pose(c,i*dt);const p=Object.keys(r.bones).map(n=>r.point(n));c.boxes.push([Math.min(...p.map(x=>x[0]))-25,Math.min(...p.map(x=>x[1]))-45,Math.max(...p.map(x=>x[0]))+25,Math.max(...p.map(x=>x[1]))+20]);c.pushCenters.push([r.point('Hips')[0],40]);c.footY.push(c.anchorY);
  c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
 }
 c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];return c;
}
for(const who of ['BRAX','DANNY']){
 const dir=dirFor(who),raw=read(dir,'clips.json.gz'),cfg=JSON.parse(fs.readFileSync(dir+'config.json')),model=read(dir,'model.json.gz');
 const r=rig(new T.ObjectLoader().parse(model),raw,who),idle={...cfg.IDLE,lockPlanarRoot:true};
 for(const role of ['PUSH','RECEIVE']){
  const clip='Showcase Contact '+role;
  raw[clip]=bake(r,clip,2.0,t=>{
   r.pose(idle,Math.min(t,.5));const base=snapshot(r);
   if(t>.50){const u=smooth((t-.50)/.20),step=cfg.WALK_BACK;r.pose({...step,lockPlanarRoot:true},Math.min(step.duration-.001,(t-.50)/1.15*step.duration));blend(r,base,u);}
   // A slow, damped loss of balance: hips, chest and arms counter-rotate.
   const settle=smooth((t-.54)/.18)*(1-smooth((t-1.40)/.60));
   const phase=(t-.54)*Math.PI*3.2,amount=role==='RECEIVE'?1:.75;
   const sway=Math.sin(phase)*.10*settle*amount;
   rotateWorld(r.bones.Hips,new T.Quaternion().setFromAxisAngle(vec(1,0,0),sway*.45));
   rotateWorld(r.bones.Spine,new T.Quaternion().setFromAxisAngle(vec(1,0,0),-sway));
   rotateWorld(r.bones.Spine1,new T.Quaternion().setFromAxisAngle(vec(0,0,1),-.13*settle*amount+Math.sin(phase)*.045*settle));
   for(const side of ['Left','Right'])rotateWorld(r.bones[side+'Arm'],new T.Quaternion().setFromAxisAngle(vec(1,0,0),(side==='Left'?1:-1)*.15*settle));
   const reach=smooth(t/.20)*(1-smooth((t-.57)/.28)),drive=smooth((t-.33)/.24);
   const lean=(role==='PUSH'?-.07:.07)*smooth((t-.25)/.20)*(1-smooth((t-.65)/.3));
   rotateWorld(r.bones.Spine,new T.Quaternion().setFromAxisAngle(vec(0,0,1),lean));
   const x=role==='PUSH'?.40+.19*drive:.40;
   for(const side of ['Left','Right'])armIK(r,side,vec(x,1.23,side==='Left'?-.18:.18),reach);
   if(t>1.65){const from=snapshot(r);r.pose(idle,t);blend(r,from,smooth((t-1.65)/.35));}
  });
 }
 const round='Showcase Round Victory';
 raw[round]=bake(r,round,1.5,t=>{r.pose(idle,Math.min(t,.5));const w=smooth(t/.35)*(1-smooth((t-1.03)/.47)),right=who==='BRAX';armIK(r,right?'Right':'Left',vec(.10,who==='BRAX'?1.92:1.76,right?.24:-.24),w);});
 const match='Showcase Match Victory';raw[match]=retarget(who,who==='BRAX'?'KROV':'VEXA',who==='BRAX'?'Yelling Out':'Victory',match);
 const finalRig=rig(new T.ObjectLoader().parse(model),raw,who);
 function state(key,clip,extra={}){const c={asset:who+'_SHOWCASE_'+key,character:who,label:key,sourceVersion:'contact-showcase-20261013',clip,attack:false,gain:0,cost:0,w:1024,h:640,scale:cfg.IDLE.scale,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1/1.1,duration:raw[clip].duration,transitionMs:100,lockPlanarRoot:true,hits:{},...extra};cfg[key]=measure(finalRig,c);}
 state('CONTACT_PUSH','Showcase Contact PUSH',{transitionMs:50,contactGapPx:.80*SIZE/VIEW,contactTravelPx:.19*SIZE/VIEW,contactRetreatPx:.75*SIZE/VIEW,contactBackoffPx:.60*SIZE/VIEW});
 state('CONTACT_RECEIVE','Showcase Contact RECEIVE',{transitionMs:50});
 state('WIN_ROUND',round,{label:who==='BRAX'?'Pięść w górę — runda':'Gest do publiczności — runda',stageYaw:0,faceCamera:true});
 state('WIN_MATCH',match,{label:who==='BRAX'?'Ryk zwycięzcy':'Zwycięstwo Danny’ego',stageYaw:0,faceCamera:true,playbackRate:1/1.1,plantFeet:true});
 // Distinct ring entrance for Danny using his own supplied boxing motion.
 if(who==='DANNY'){
  const clips=[{clip:'Lead Jab',duration:.72},{clip:'Punching',duration:.72,blend:.12},{clip:'Idle',duration:.40,blend:.18}];
  cfg.INTRO=measure(finalRig,{...cfg.INTRO,label:'Jab, prosty i garda',duration:1.84,sequence:clips,stageYaw:Math.PI/2,playbackRate:1/1.1,transitionMs:120,lockPlanarRoot:true,hits:{}});
 }
 fs.writeFileSync(dir+'clips.json.gz',zlib.gzipSync(JSON.stringify(raw),{level:9}));fs.writeFileSync(dir+'config.json',JSON.stringify(cfg));
 console.log(who,'contact + two celebrations ready; original mesh and combat clips preserved');
}
