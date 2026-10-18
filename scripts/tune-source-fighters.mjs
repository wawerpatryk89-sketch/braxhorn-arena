import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';import {rig} from '../game/assets/fighter-source-core.js';
// Contacts curated from side-view joint samples. Times refer to unchanged source FBX clips.
const contacts={BRAX:{
 LIGHT_PUNCH:[['LeftHand',.50,.63]],HEAVY_PUNCH:[['LeftHand',.23,.42],['RightHand',.57,.76]],DOUBLE_PUNCH:[['LeftHand',.30,.52],['RightHand',.60,.82]],ELBOW:[['RightForeArm',.68,.85]],LIGHT_KICK:[['RightFoot',.55,.75]],HEAVY_KICK:[['LeftFoot',.90,1.12]],TEEP:[['LeftFoot',1.15,1.36]],
 COMBO:[['RightLeg',1.60,1.85],['RightLeg',2.05,2.28],['RightLeg',2.65,2.90],['RightHand',3.68,3.68]],KNEE_CHAIN:[['RightLeg',1.60,1.85],['RightLeg',2.05,2.28],['RightLeg',2.65,2.90],['RightHand',3.68,3.68]]},NYXA:{LIGHT_PUNCH:[['LeftHand',.27,.45],['RightHand',.45,.68]],HEAVY_PUNCH:[['LeftHand',.91,1.12]],ELBOW:[['RightForeArm',.62,.84]],CLINCH_KNEE:[['RightLeg',.65,.93]],LIGHT_KICK:[['RightFoot',.57,.78]],HEAVY_KICK:[['RightFoot',.59,.81]],CROUCH_KICK:[['RightFoot',1.02,1.25]],COMBO:[['RightFoot',1.02,1.25]]}};
const rates={BRAX:{LIGHT_PUNCH:1.6,HEAVY_PUNCH:1.65,DOUBLE_PUNCH:1.7,ELBOW:1.7,LIGHT_KICK:1.4,HEAVY_KICK:1.65,TEEP:1.65,COMBO:2.2,KNEE_CHAIN:2.2,CAPOEIRA:1.1,HIT_BODY:1.6},NYXA:{LIGHT_PUNCH:1.5,HEAVY_PUNCH:1.7,ELBOW:1.65,CLINCH_KNEE:1.65,LIGHT_KICK:1.4,HEAVY_KICK:1.5,CROUCH_KICK:1.6,COMBO:1.6,HIT_BODY:1.8,HIT_HEAD:1.2,HIT_HEAVY:1.5,LEAN:1.5,DUCK:1.5}};
for(const who of ['BRAX','NYXA']){
 const dir='game/assets/'+who.toLowerCase()+'-new/',read=f=>JSON.parse(zlib.gunzipSync(fs.readFileSync(dir+f))),r=rig(new T.ObjectLoader().parse(read('model.json.gz')),read('clips.json.gz'),who),cfg=JSON.parse(fs.readFileSync(dir+'config.json'));
 Object.assign(cfg.IDLE,{clip:who==='BRAX'?'Knee Jabs To Uppercut(1)':'Hook',label:'Garda — fragment dostarczonej animacji',freeze:false,duration:2.1,guardLoop:who==='BRAX'?{start:4.7,end:5.6,blend:.18}:{start:0,end:.22,blend:.06},durations:Array(126).fill(1000/60)});
 for(const [name,c] of Object.entries(cfg).filter(([n,c])=>c.asset.endsWith('_'+n))){
  c.playbackRate=rates[who][name]||1;if(name==='WALK_FORWARD'||name==='WALK_BACK')c.gaitRate=who==='BRAX'?(name==='WALK_BACK'?1.5:1.85):(name==='WALK_BACK'?1.6:1.35);c.transitionMs=c.attack?60:100;c.hurtCapsules=[];c.pushCenters=[];const frames=c.durations.length,dt=c.durations[0]/1000,samples=[];
  for(let f=0;f<frames;f++){r.pose(c,f*dt);let points={};for(let n of ['Head','Neck','Spine','Spine2','Hips','LeftHand','RightHand','LeftForeArm','RightForeArm','LeftFoot','RightFoot','LeftLeg','RightLeg'])points[n]=r.point(n);samples.push(points);
   c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:points[a],b:points[b],radius})));
   c.pushCenters.push([(points.Hips[0]+points.Spine[0])/2,30]);
   if(name==='IDLE'||name==='INTRO'){const p=points;c.boxes[f]=[Math.min(p.Head[0],p.Hips[0])-45,p.Head[1]-40,Math.max(p.Head[0],p.Hips[0])+45,Math.max(p.LeftFoot[1],p.RightFoot[1])+12];}
  }
  if(c.guardLoop||name==='INTRO'){c.footY=Array(frames).fill(c.anchorY);c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];}
  if(contacts[who][name]){c.hits={};for(let [group,[bone,start,end]]of contacts[who][name].entries()){let lo=Math.round(start/dt),hi=Math.round(end/dt),peak=lo;for(let i=lo;i<=hi;i++)if(samples[i][bone][0]-samples[i].Hips[0]>samples[peak][bone][0]-samples[peak].Hips[0])peak=i;
   const radius=bone.includes('Foot')?21:bone.includes('Leg')?22:bone.includes('ForeArm')?18:16;
   for(let i=Math.max(0,peak-2);i<=Math.min(frames-1,peak+1);i++){let p=samples[i][bone];c.hits[i]={box:[p[0]-radius,p[1]-radius,radius*2,radius*2],group,damage:name==='COMBO'||name==='KNEE_CHAIN'?8:bone.includes('Foot')?11:8,bone};}
  }}
 }
 // Aliases must inherit the same timing and contact data as their source action.
 for(const [name,c] of Object.entries(cfg)){const source=Object.values(cfg).find(z=>z.asset===c.asset&&z.hurtCapsules);if(source)cfg[name]=source;}
 fs.writeFileSync(dir+'config.json',JSON.stringify(cfg));console.log(who,'guard loop',cfg.IDLE.guardLoop,'contacts',Object.entries(contacts[who]).map(([n])=>[n,[...new Set(Object.values(cfg[n].hits).map(h=>h.bone))]]));
}
