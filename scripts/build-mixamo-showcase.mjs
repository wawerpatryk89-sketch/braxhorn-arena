import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import * as T from 'three';
import {rig,VIEW,SIZE} from '../game/assets/fighter-source-core.js';

// Retarget the user-supplied Brax FBX pack to six rigs, bake short paired
// contact and victory clips, and preserve meshes and all existing attacks.
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
 const saved=[upper,lower,hand].map(b=>b.quaternion.clone());
 const a=world(upper),b=world(lower),c=world(hand),handQ=hand.getWorldQuaternion(new T.Quaternion());
 const goal=target.clone(),l1=a.distanceTo(b),l2=b.distanceTo(c),d=Math.min(l1+l2-.006,Math.max(Math.abs(l1-l2)+.006,a.distanceTo(goal)));
 const direction=goal.clone().sub(a).normalize(),x=(l1*l1-l2*l2+d*d)/(2*d),y=Math.sqrt(Math.max(0,l1*l1-x*x));
 const pole=vec(-.06,-1,side==='Left'?-.45:.45);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
 const elbow=a.clone().addScaledVector(direction,x).addScaledVector(pole,y);
 aim(upper,lower,elbow);aim(lower,hand,a.clone().addScaledVector(direction,d));
 hand.quaternion.copy(hand.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(handQ));[upper,lower,hand].forEach((b,i)=>b.quaternion.slerp(saved[i],1-weight));r.stage.updateMatrixWorld(true);
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
 const frames=Math.round(duration*30),times=Array.from({length:frames+1},(_,i)=>duration*i/frames),tracks=[];
 const values=Object.fromEntries(Object.keys(r.bones).map(n=>[n,[]])),hips=[];
 for(const time of times){pose(time);r.stage.updateMatrixWorld(true);const floor=Math.min(...['LeftToeBase','RightToeBase'].map(n=>world(r.bones[n]).y));if(floor<.02){const hp=world(r.bones.Hips);hp.y+=.02-floor;r.bones.Hips.position.copy(r.bones.Hips.parent.worldToLocal(hp));}for(const[n,b]of Object.entries(r.bones)){const q=b.quaternion.clone();if(n==='Hips')q.premultiply(inverseAxis);q.normalize().toArray(values[n],values[n].length);}r.bones.Hips.position.clone().applyQuaternion(inverseAxis).toArray(hips,hips.length);}
 tracks.push(new T.VectorKeyframeTrack('mixamorigHips.position',times,hips));
 for(const[n,v]of Object.entries(values))tracks.push(new T.QuaternionKeyframeTrack('mixamorig'+n+'.quaternion',times,v));
 return T.AnimationClip.toJSON(new T.AnimationClip(name,duration,tracks).optimize());
}
function measure(r,c){
 const frames=Math.ceil(c.duration*60),dt=c.duration/frames;
 c.durations=Array(frames).fill(dt*1000);c.boxes=[];c.hurtCapsules=[];c.pushCenters=[];c.footY=[];
 for(let i=0;i<frames;i++){r.pose(c,i*dt);const p=Object.keys(r.bones).map(n=>r.point(n));c.boxes.push([Math.min(...p.map(x=>x[0]))-25,Math.min(...p.map(x=>x[1]))-45,Math.max(...p.map(x=>x[0]))+25,Math.max(...p.map(x=>x[1]))+20]);c.pushCenters.push([r.point('Hips')[0],40]);c.footY.push(c.anchorY);
  c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
 }
 c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];return c;
}

import {FBXLoader} from './source-import/FBXLoaderEight.mjs';
globalThis.window={URL:{createObjectURL:()=>''}};
const sourceRoot=process.argv[2]||'../mixamo-brax';
const names=['Pushing','Stumble Backwards','Dodging Back','Rallying','Victory','Breakdance Footwork To Freeze','House Dancing','Hip Hop Dancing','Dancing'];
const sources=Object.fromEntries(names.map(name=>{const b=fs.readFileSync(sourceRoot+'/'+name+'.fbx'),m=new FBXLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');assert(m.animations[0]);return[name,m.animations[0]];}));
const donor=boneMap(new T.ObjectLoader().parse(read(dirFor('BRAX'),'model.json.gz')));
const picks={
 BRAX:{match:['Rallying',.35,4.6,3.45],round:['Rallying',.55,2.05]},
 NYXA:{match:['Victory',1.05,5.35,3.5],round:['Victory',1.25,2.75]},
 VEXA:{match:['House Dancing',.4,4.8,3.6],round:['Victory',3.15,4.65]},
 KROV:{match:['Hip Hop Dancing',.2,4.8,3.7],round:['Rallying',1.0,2.5]},
 NINA:{match:['Breakdance Footwork To Freeze',0,3.65,3.5],round:['Victory',.3,1.8]},
 DANNY:{match:['Dancing',.15,4.65,3.6],round:['Rallying',3.2,4.7]}
};
// Imported clips use Mixamo's Y-up coordinates. Model roots are Z-up; do not
// apply the model-root quarter turn to an animation a second time.
function imported(who,model,name){
 const tb=boneMap(model),clip=sources[name].clone(),leg=b=>b.LeftLeg.position.length()+b.LeftFoot.position.length(),ratio=leg(tb)/leg(donor);
 const from=donor.Hips.position.clone().applyQuaternion(inverseAxis),to=tb.Hips.position.clone().applyQuaternion(inverseAxis);
 for(const tr of clip.tracks){const[n,p]=tr.name.split('.'),key=n.replace(/^mixamorig/,'');assert(tb[key]&&donor[key],who+' '+n);
  if(who!=='BRAX'&&p==='quaternion'){const delta=tb[key].quaternion.clone().multiply(donor[key].quaternion.clone().invert());if(key==='Hips')delta.premultiply(inverseAxis).multiply(axis);for(let i=0;i<tr.values.length;i+=4)new T.Quaternion().fromArray(tr.values,i).premultiply(delta).normalize().toArray(tr.values,i);}
  if(who!=='BRAX'&&p==='position'){assert.equal(key,'Hips');for(let i=0;i<tr.values.length;i+=3)new T.Vector3().fromArray(tr.values,i).sub(from).multiplyScalar(ratio).add(to).toArray(tr.values,i);}
 }clip.name='Import '+name;return T.AnimationClip.toJSON(clip);
}
for(const who of Object.keys(picks)){
 const dir=dirFor(who),raw=read(dir,'clips.json.gz'),cfg=JSON.parse(fs.readFileSync(dir+'config.json')),model=read(dir,'model.json.gz');
 const imports={};for(const n of names)imports['Import '+n]=imported(who,new T.ObjectLoader().parse(model),n);
 const r=rig(new T.ObjectLoader().parse(model),{...raw,...imports},who),idle={...cfg.IDLE,lockPlanarRoot:true};
 const motion=(name,t)=>r.pose({clip:'Import '+name,lockPlanarRoot:true},Math.max(0,t));
 const duration=1.8,curves={PUSH:[],RECEIVE:[]};
 const at=(name,t)=>{r.pose({clip:'Import '+name},t);return world(r.bones.Hips).x;};
 const stumbleEnd=at('Stumble Backwards',.67),dodgeStart=at('Dodging Back',.68),backStart=at('Dodging Back',1.5);
 for(const role of ['PUSH','RECEIVE']){
  const clip='Mixamo Contact '+role;
  raw[clip]=bake(r,clip,duration,t=>{
   r.pose(idle,0);const guard=snapshot(r);
   let root=0;
   if(role==='PUSH'){
    if(t<.46){motion('Pushing',Math.min(.55,t*1.7));blend(r,guard,.65*smooth(t/.20));
     // A short forearm contact follows the supplied push, with a decisive release.
     const reach=smooth(t/.18)*(1-smooth((t-.27)/.16)),drive=smooth((t-.14)/.12);
     for(const side of ['Left','Right'])armIK(r,side,vec(.40+.17*drive,1.23,side==='Left'?-.18:.18),reach);
     blend(r,guard,1-smooth((t-.28)/.18));
    }else{
     const local=Math.min(2.65,1.5+(t-.46)/1.1*1.15);root=at('Dodging Back',local)-backStart;motion('Dodging Back',local);
     blend(r,guard,smooth((t-.46)/.16)*(1-smooth((t-1.45)/.35)));
    }

   }else{
    if(t<.18){r.pose(idle,0);for(const side of ['Left','Right'])armIK(r,side,vec(.40,1.23,side==='Left'?-.18:.18),smooth(t/.18));}
    else if(t<.62){for(const side of ['Left','Right'])armIK(r,side,vec(.40,1.23,side==='Left'?-.18:.18),1);const brace=snapshot(r),local=(t-.18)/.44*.67;root=at('Stumble Backwards',local);motion('Stumble Backwards',local);blend(r,brace,smooth((t-.18)/.22));}
    else{
     const local=Math.min(2.5,.68+(t-.62)/1.03*1.82);motion('Dodging Back',local);
     if(t<.78){const incoming=snapshot(r);motion('Stumble Backwards',.67);blend(r,incoming,1-smooth((t-.62)/.16));}
     const pose=snapshot(r);root=stumbleEnd+at('Dodging Back',local)-dodgeStart;
     for(const[n,b]of Object.entries(r.bones)){b.position.copy(pose[n].p);b.quaternion.copy(pose[n].q);}
     blend(r,guard,1-smooth((t-1.5)/.3));
    }
   }
   // Root travel belongs to combat physics, including wall confinement; the
   // same time samples drive animation and displacement, avoiding double motion.
   if(role==='RECEIVE'){
    // Shorten the authored travelling stride in world space, including each
    // foot target, rather than letting full-length steps slide under a shorter root.
    root*=.52;const w=smooth((t-.18)/.20)*(1-smooth((t-1.5)/.3));
    for(const side of ['Left','Right']){const joints=['UpLeg','Leg','Foot'].map(n=>r.bones[side+n]),saved=joints.map(b=>b.quaternion.clone()),foot=r.bones[side+'Foot'],goal=world(foot),q=foot.getWorldQuaternion(new T.Quaternion());goal.x*=.52;legIK(r,side,goal,q);joints.forEach((b,i)=>b.quaternion.slerp(saved[i],1-w));r.stage.updateMatrixWorld(true);}
   }
   curves[role].push([t,root*SIZE/VIEW]);
  });
 }
 for(const type of ['round','match']){
  const [name,start,end,seconds]=picks[who][type],entry=type==='round'?.18:who==='NINA'?.42:.26,hold=type==='round'?1.3:seconds,tail=type==='round'?.32:.18,total=entry+hold+tail;
  const clip='Mixamo '+(type==='round'?'Round':'Match')+' Victory';
  raw[clip]=bake(r,clip,total,t=>{
   r.pose(idle,0);const guard=snapshot(r);motion(name,start+(end-start)*Math.min(1,Math.max(0,(t-entry)/hold)));
   blend(r,guard,smooth(t/entry)*(type==='round'?1-smooth((t-entry-hold)/tail):1));
  });
 }
 // Replace only unused previous showcase assets; original attacks stay bit-identical.
 for(const key of ['CONTACT_PUSH','CONTACT_RECEIVE','WIN_ROUND','WIN_MATCH'])delete cfg[key];
 for(const name of Object.keys(raw).filter(n=>n.startsWith('Showcase '))){if(!Object.values(cfg).some(c=>c.clip===name||c.sequence?.some(s=>s.clip===name)))delete raw[name];}
 const finalRig=rig(new T.ObjectLoader().parse(model),raw,who);
 function state(key,clip,extra={}){cfg[key]=measure(finalRig,{asset:who+'_MIXAMO_'+key,character:who,label:key,sourceVersion:'mixamo-brax-20261013',clip,attack:false,gain:0,cost:0,w:1024,h:640,scale:cfg.IDLE.scale,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1/1.1,duration:raw[clip].duration,transitionMs:80,lockPlanarRoot:true,hits:{},...extra});}
 state('CONTACT_PUSH','Mixamo Contact PUSH',{transitionMs:35,contactGapPx:.8*SIZE/VIEW,contactTravelPx:.19*SIZE/VIEW,contactRetreatPx:.75*SIZE/VIEW,contactBackoffPx:.52*SIZE/VIEW,contactMotion:curves.PUSH,contactImpact:.18,contactStepTimes:[.87,1.15,1.5]});
 state('CONTACT_RECEIVE','Mixamo Contact RECEIVE',{transitionMs:35,contactMotion:curves.RECEIVE});
 state('WIN_ROUND','Mixamo Round Victory',{stageYaw:0,faceCamera:true,animationSource:picks[who].round[0]});
 state('WIN_MATCH','Mixamo Match Victory',{stageYaw:0,faceCamera:true,animationSource:picks[who].match[0]});
 fs.writeFileSync(dir+'clips.json.gz',zlib.gzipSync(JSON.stringify(raw),{level:9}));fs.writeFileSync(dir+'config.json',JSON.stringify(cfg));
 console.log(who,JSON.stringify({round:picks[who].round[0],match:picks[who].match[0],receiveTravelPx:curves.RECEIVE.at(-1)[1],bytes:fs.statSync(dir+'clips.json.gz').size}));
}
