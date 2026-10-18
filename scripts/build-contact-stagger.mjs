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
function legIK(r,side,target,footQ){
 const upper=r.bones[side+'UpLeg'],lower=r.bones[side+'Leg'],foot=r.bones[side+'Foot'];
 const a=world(upper),b=world(lower),c=world(foot),l1=a.distanceTo(b),l2=b.distanceTo(c);
 const d=Math.min(l1+l2-.004,Math.max(Math.abs(l1-l2)+.004,a.distanceTo(target)));
 const direction=target.clone().sub(a).normalize(),x=(l1*l1-l2*l2+d*d)/(2*d),y=Math.sqrt(Math.max(0,l1*l1-x*x));
 const pole=vec(1,0,side==='Left'?-.10:.10);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
 aim(upper,lower,a.clone().addScaledVector(direction,x).addScaledVector(pole,y));
 aim(lower,foot,a.clone().addScaledVector(direction,d));
 foot.quaternion.copy(foot.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(footQ));r.stage.updateMatrixWorld(true);
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
for(const who of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY']){
 const dir=dirFor(who),raw=read(dir,'clips.json.gz'),cfg=JSON.parse(fs.readFileSync(dir+'config.json')),model=read(dir,'model.json.gz');
 const r=rig(new T.ObjectLoader().parse(model),raw,who),idle={...cfg.IDLE,lockPlanarRoot:true};
 for(const role of ['PUSH','RECEIVE']){
  const clip='Showcase Contact '+role;
  raw[clip]=bake(r,clip,1.5,t=>{
   r.pose(idle,0);
   const feet=Object.fromEntries(['Left','Right'].map(side=>[side,{p:world(r.bones[side+'Foot']),q:r.bones[side+'Foot'].getWorldQuaternion(new T.Quaternion())}]));
   const receive=role==='RECEIVE',distance=receive?.94:.60;
   const steps=.42*smooth((t-.28)/.30)+.36*smooth((t-.60)/.30)+.22*smooth((t-.94)/.28);
   const retreat=receive?.19*smooth((t-.12)/.16)+.75*steps:.60*steps;
   const envelope=smooth((t-.18)/.13)*(1-smooth((t-1.10)/.40));
   const sway=(.105*Math.sin((t-.28)*Math.PI*3.4)+.035*Math.sin((t-.28)*Math.PI*6.8))*envelope;
   const amount=receive?1:.78;
   const brace=smooth(t/.10)*(1-smooth((t-.12)/.16));
   const thrust=smooth((t-.12)/.10)*(1-smooth((t-.32)/.16));
   rotateWorld(r.bones.Spine2,new T.Quaternion().setFromAxisAngle(vec(0,0,1),receive?.12*thrust:.08*brace-.16*thrust));
   // The pelvis shifts over the support leg; the chest counterbalances it.
   rotateWorld(r.bones.Hips,new T.Quaternion().setFromAxisAngle(vec(1,0,0),sway*amount));
   rotateWorld(r.bones.Spine,new T.Quaternion().setFromAxisAngle(vec(0,0,1),.22*envelope*amount));
   rotateWorld(r.bones.Spine1,new T.Quaternion().setFromAxisAngle(vec(1,0,0),-sway*1.4*amount));
   const hip=world(r.bones.Hips);hip.y-=.065*envelope;hip.z+=.035*Math.sin((t-.28)*Math.PI*3.4)*envelope;
   r.bones.Hips.position.copy(r.bones.Hips.parent.worldToLocal(hip));r.stage.updateMatrixWorld(true);
   for(const side of ['Left','Right']){
    const left=side==='Left';
    const u1=Math.max(0,Math.min(1,(t-.28)/.30)),u2=Math.max(0,Math.min(1,(t-.60)/.30)),u3=Math.max(0,Math.min(1,(t-.94)/.28));
    const progress=left?.65*smooth(u1)+.35*smooth(u3):smooth(u2);
    const lift=left?.12*Math.sin(Math.PI*u1)**2+.075*Math.sin(Math.PI*u3)**2:.105*Math.sin(Math.PI*u2)**2;
    const goal=feet[side].p.clone();goal.x+=retreat-distance*progress;goal.y+=lift;
    goal.z+=(left?-.045:.045)*envelope;
    legIK(r,side,goal,feet[side].q);
    rotateWorld(r.bones[side+'Arm'],new T.Quaternion().setFromAxisAngle(vec(1,0,0),(left?1:-1)*.32*envelope));
   }
   const reach=smooth(t/.12)*(1-smooth((t-.28)/.14)),drive=smooth((t-.12)/.16);
   for(const side of ['Left','Right'])armIK(r,side,vec(role==='PUSH'?.40+.19*drive:.40,1.23,side==='Left'?-.18:.18),reach);

  });
 }
 const finalRig=rig(new T.ObjectLoader().parse(model),raw,who);
 function state(key,clip,extra={}){const c={asset:who+'_SHOWCASE_'+key,character:who,label:key,sourceVersion:'all-fighter-push-20261013',clip,attack:false,gain:0,cost:0,w:1024,h:640,scale:cfg.IDLE.scale,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1/1.1,duration:raw[clip].duration,transitionMs:100,lockPlanarRoot:true,hits:{},...extra};cfg[key]=measure(finalRig,c);}
 state('CONTACT_PUSH','Showcase Contact PUSH',{transitionMs:35,contactGapPx:.80*SIZE/VIEW,contactTravelPx:.19*SIZE/VIEW,contactRetreatPx:.75*SIZE/VIEW,contactBackoffPx:.60*SIZE/VIEW});
 state('CONTACT_RECEIVE','Showcase Contact RECEIVE',{transitionMs:35});
 fs.writeFileSync(dir+'clips.json.gz',zlib.gzipSync(JSON.stringify(raw),{level:9}));fs.writeFileSync(dir+'config.json',JSON.stringify(cfg));
 console.log(who,'fast contact and planted stagger steps ready; other clips preserved');
}
