import * as T from 'three';
export const SIZE=640,WIDTH=1024,GROUND=550,VIEW=3.25;
// Published clips store the original Float32 samples as binary to avoid large
// decimal JSON payloads. This changes encoding only, never animation samples.
export function unpackClip(data){
 const unpack=a=>{if(!a?.f32)return a;const bytes=Uint8Array.from(atob(a.f32),c=>c.charCodeAt(0));const view=new DataView(bytes.buffer);return Float32Array.from({length:bytes.length/4},(_,i)=>view.getFloat32(i*4,true));};
 return {...data,tracks:data.tracks.map(t=>({...t,times:unpack(t.times),values:unpack(t.values)}))};
}
// Keep layered running feet above the floor without moving the authored punch.
function floorLeg(upper,lower,foot,toe){
 const world=b=>b.getWorldPosition(new T.Vector3()),a=world(upper),b=world(lower),c=world(foot),floor=.065;
 const lift=floor-Math.min(c.y,toe?world(toe).y:c.y);if(lift<=0)return;
 const goal=c.clone();goal.y+=lift;const q=foot.getWorldQuaternion(new T.Quaternion());
 const l1=a.distanceTo(b),l2=b.distanceTo(c),d=Math.max(Math.abs(l1-l2)+.001,Math.min(l1+l2-.001,a.distanceTo(goal))),dir=goal.clone().sub(a).normalize();
 const x=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-x*x));
 const pole=b.clone().sub(a).addScaledVector(dir,-b.clone().sub(a).dot(dir));
 if(pole.lengthSq()<1e-8)pole.set(0,0,1).applyQuaternion(upper.getWorldQuaternion(new T.Quaternion())).addScaledVector(dir,-pole.dot(dir));pole.normalize();
 const aim=(joint,end,target)=>{const p=world(joint),delta=new T.Quaternion().setFromUnitVectors(world(end).sub(p).normalize(),target.clone().sub(p).normalize()),next=joint.getWorldQuaternion(new T.Quaternion()).premultiply(delta);joint.quaternion.copy(joint.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(next));joint.updateWorldMatrix(false,true);};
 aim(upper,lower,a.clone().addScaledVector(dir,x).addScaledVector(pole,height));aim(lower,foot,a.clone().addScaledVector(dir,d));foot.quaternion.copy(foot.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));foot.updateWorldMatrix(false,true);
}
function contactArm(upper,lower,hand,target,weight){
 const world=b=>b.getWorldPosition(new T.Vector3()),a=world(upper),b=world(lower),c=world(hand),saved=[upper,lower,hand].map(b=>b.quaternion.clone()),q=hand.getWorldQuaternion(new T.Quaternion());
 const l1=a.distanceTo(b),l2=b.distanceTo(c),d=Math.max(Math.abs(l1-l2)+.002,Math.min(l1+l2-.008,a.distanceTo(target))),dir=target.clone().sub(a).normalize();
 const x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x)),pole=new T.Vector3(0,-1,0);pole.addScaledVector(dir,-pole.dot(dir)).normalize();
 const aim=(joint,end,target)=>{const p=world(joint),delta=new T.Quaternion().setFromUnitVectors(world(end).sub(p).normalize(),target.clone().sub(p).normalize()),next=joint.getWorldQuaternion(new T.Quaternion()).premultiply(delta);joint.quaternion.copy(joint.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(next));joint.updateWorldMatrix(false,true);};
 aim(upper,lower,a.clone().addScaledVector(dir,x).addScaledVector(pole,h));aim(lower,hand,a.clone().addScaledVector(dir,d));hand.quaternion.copy(hand.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));
 [upper,lower,hand].forEach((b,i)=>b.quaternion.slerp(saved[i],1-weight));upper.updateWorldMatrix(false,true);
}
export function rig(model,raw,who){
 const axis=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2);
 model.rotation.x=-Math.PI/2;model.scale.setScalar(who==='BRAX'?.019:.0185);
 const stage=new T.Group();stage.rotation.y=Math.PI/2;stage.add(model);
 const clips=new Map();
 for(const [name,data] of Object.entries(raw)){
  const clip=T.AnimationClip.parse(unpackClip(data));
  for(const track of clip.tracks){
   if(track.name==='mixamorigHips.quaternion')for(let i=0;i<track.values.length;i+=4)new T.Quaternion().fromArray(track.values,i).premultiply(axis).toArray(track.values,i);
   if(track.name==='mixamorigHips.position'){
    const x=track.values[0],z=track.values[2];
    for(let i=0;i<track.values.length;i+=3){track.values[i]-=x;track.values[i+2]-=z;new T.Vector3().fromArray(track.values,i).applyQuaternion(axis).toArray(track.values,i);}
   }
  }clips.set(name,clip);
 }
 const mixer=new T.AnimationMixer(model),actions=new Map();for(const[n,c]of clips){let a=mixer.clipAction(c);a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true;actions.set(n,a);}
 const bones={};model.traverse(o=>{if(o.isBone)bones[o.name.replace(/^mixamorig/,'')]=o;});
 const camera=new T.OrthographicCamera(-VIEW*WIDTH/SIZE/2,VIEW*WIDTH/SIZE/2,VIEW/2,-VIEW/2,.1,30);camera.position.set(0,(GROUND/SIZE-.5)*VIEW,8);camera.lookAt(0,camera.position.y,0);camera.updateMatrixWorld();
 function sample(c,time){mixer.stopAllAction();const a=actions.get(c.clip);if(!a)throw Error('Missing clip '+c.clip);a.reset().play();a.time=Math.min(clips.get(c.clip).duration,Math.max(0,time));mixer.update(0);}
 function pose(c,t,face=1){
  model.position.y=0;
  if(c.sequence){
   let elapsed=0,index=c.sequence.length-1;for(let i=0;i<c.sequence.length;i++){if(t<elapsed+c.sequence[i].duration||i===c.sequence.length-1){index=i;break;}elapsed+=c.sequence[i].duration;}
   const seg=c.sequence[index],local=Math.max(0,t-elapsed);sample(seg,local+(seg.start||0));
   if(index>0&&local<(seg.blend||.1)){const incoming=Object.values(bones).map(b=>({p:b.position.clone(),q:b.quaternion.clone()})),prev=c.sequence[index-1];sample(prev,(prev.start||0)+prev.duration);const u=local/(seg.blend||.1),w=u*u*(3-2*u);Object.values(bones).forEach((b,i)=>{b.position.lerp(incoming[i].p,w);b.quaternion.slerp(incoming[i].q,w);});}
  }else if(c.guardLoop){
   // Use only the supplied clip's settled guard, retaining its original joint poses.
   const {start,end,blend}=c.guardLoop,span=end-start-blend,period=c.duration;
   const u=((t%period)+period)%period/period*span;
   sample(c,start+u);
   if(u<blend){const incoming=Object.values(bones).map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));sample(c,end-blend+u);const w=u/blend,smooth=w*w*(3-2*w);Object.values(bones).forEach((b,i)=>{b.position.lerp(incoming[i].p,smooth);b.quaternion.slerp(incoming[i].q,smooth);});}
  }else sample(c,c.freeze?c.start||0:t+(c.start||0));
  // Blend the authored hit toward the fighter's own guard for three readable strengths.
  if(c.reactionBlend){const incoming=Object.values(bones).map(b=>({p:b.position.clone(),q:b.quaternion.clone()})),r=c.reactionBlend;sample({clip:r.clip},r.start||0);Object.values(bones).forEach((b,i)=>{b.position.lerp(incoming[i].p,r.weight);b.quaternion.slerp(incoming[i].q,r.weight);});}
  // Short combat steps blend toward the supplied guard without changing the rig or mesh.
  if(c.gaitBlend){const moving=Object.values(bones).map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));sample({clip:c.gaitBlend.clip},c.gaitBlend.time);Object.values(bones).forEach((b,i)=>{b.position.lerp(moving[i].p,c.gaitBlend.weight);b.quaternion.slerp(moving[i].q,c.gaitBlend.weight);});}
  // Layer only leg rotations: the original punch, torso and hit timing remain intact.
  if(c.movingGait){const g=c.movingGait,saved=Object.values(bones).map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));
   const gait=g.config,total=gait.duration||gait.durations.reduce((a,b)=>a+b,0)/1000;
   sample(gait,(g.time%total)+(gait.start||0));
   const legs={};for(const side of ['Left','Right'])for(const part of ['UpLeg','Leg','Foot','ToeBase']){const n=side+part;if(bones[n])legs[n]=bones[n].quaternion.clone();}
   Object.values(bones).forEach((b,i)=>{b.position.copy(saved[i].p);b.quaternion.copy(saved[i].q);});
   for(const [n,q]of Object.entries(legs))bones[n].quaternion.slerp(q,g.weight);
  }
  // Extract planar root motion only for locomotion. Combat retains the supplied motion.
  if(c.locomotion||c.lockPlanarRoot){const p=bones.Hips.position;p.x=0;p.y=0;}
  if(c.rootOffset){const v=new T.Vector3(...c.rootOffset).applyQuaternion(axis);bones.Hips.position.add(v);}
  stage.rotation.y=(c.stageYaw??Math.PI/2)+(face<0&&!c.faceCamera?Math.PI:0);stage.updateMatrixWorld(true);
  if(c.lowGuard){
   // Lower the base and solve the feet back to the floor; keep the same skeleton.
   const hip=bones.Hips.getWorldPosition(new T.Vector3());hip.y-=.10;bones.Hips.position.copy(bones.Hips.parent.worldToLocal(hip));stage.updateMatrixWorld(true);
   for(const side of ['Left','Right']){floorLeg(bones[side+'UpLeg'],bones[side+'Leg'],bones[side+'Foot'],bones[side+'ToeBase']);const target=bones[side+'Hand'].getWorldPosition(new T.Vector3());target.y-=.13;contactArm(bones[side+'Arm'],bones[side+'ForeArm'],bones[side+'Hand'],target,.85);}stage.updateMatrixWorld(true);
  }
  if(c.contactOpponent?.shoulders&&t<.65){
   const o=c.contactOpponent,frames=o.shoulders,at=Math.min(frames.length-1,t*30),i=Math.floor(at),j=Math.min(i+1,frames.length-1),u=at-i;
   const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},weight=smooth(t/.15)*(1-smooth((t-.49)/.16)),direction=face<0?-1:1;
   for(const [side,index] of [['Left',1],['Right',0]]){const p=new T.Vector3(...frames[i][index]).lerp(new T.Vector3(...frames[j][index]),u).multiplyScalar(o.ratio);const goal=new T.Vector3((o.gap-p.x-.18)*direction,Math.min(p.y-.07,bones[side+'Arm'].getWorldPosition(new T.Vector3()).y+.04),-p.z*direction);contactArm(bones[side+'Arm'],bones[side+'ForeArm'],bones[side+'Hand'],goal,weight);}
   stage.updateMatrixWorld(true);
  }
  if(c.movingGait)for(const side of ['Left','Right'])floorLeg(bones[side+'UpLeg'],bones[side+'Leg'],bones[side+'Foot'],bones[side+'ToeBase']);
  if(c.plantFeet){const support=Math.min(...['LeftFoot','RightFoot','LeftToeBase','RightToeBase'].map(n=>bones[n].getWorldPosition(new T.Vector3()).y));model.position.y+=.05-support;stage.updateMatrixWorld(true);}
  // Raise the actual punching arm into a high jab, with a smooth return to guard.
  // Metadata and rendering share this pose; the hitbox is never lifted alone.
  if(c.headPunch){const a=c.headPunch,smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},weight=smooth((t-a.from)/(a.peak-a.from))*(1-smooth((t-a.end)/(a.to-a.end))),side=a.side;const goal=bones[side+'Hand'].getWorldPosition(new T.Vector3());goal.y+=a.lift;contactArm(bones[side+'Arm'],bones[side+'ForeArm'],bones[side+'Hand'],goal,weight);stage.updateMatrixWorld(true);}
  const cameraX=(c.cameraOffsetPx||0)*VIEW/SIZE*(face<0?-1:1);camera.position.x=cameraX;camera.lookAt(cameraX,camera.position.y,0);camera.updateMatrixWorld(true);
 }
 function point(name){const b=bones[name];if(!b)throw Error('Missing bone '+name);const p=b.getWorldPosition(new T.Vector3()).project(camera);return[(p.x+1)*WIDTH/2,(1-p.y)*SIZE/2];}
 return{model,stage,clips,mixer,bones,camera,pose,point};
}
