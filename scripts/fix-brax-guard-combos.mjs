import fs from'node:fs';import zlib from'node:zlib';import * as T from'three';import{rig}from'../game/assets/fighter-source-core.js';
for(const who of ['BRAX','NYXA','BEAR']){
 const dir='game/assets/'+who.toLowerCase()+'-new/',rd=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(dir+n))),raw=rd('clips.json.gz'),r=rig(new T.ObjectLoader().parse(rd('model.json.gz')),raw,who),cfg=JSON.parse(fs.readFileSync(dir+'config.json'));
 cfg.COMBO.comboGapPx={BRAX:128,NYXA:100,BEAR:172}[who];
 if(who==='BRAX'){
  const c=cfg.IDLE;Object.assign(c,{clip:'Shared Fighting Idle',label:'Bojowy balans',start:0,freeze:false,duration:raw['Shared Fighting Idle'].duration,guardLoop:{start:0,end:raw['Shared Fighting Idle'].duration,blend:.12},lockPlanarRoot:true,transitionMs:100});
  const frames=Math.ceil(c.duration*60),dt=c.duration/frames;c.durations=Array(frames).fill(dt*1000);c.boxes=[];c.hurtCapsules=[];c.footY=[];c.pushCenters=[];
  for(let i=0;i<frames;i++){r.pose(c,i*dt);const pts=Object.keys(r.bones).map(n=>r.point(n));c.boxes.push([Math.min(...pts.map(p=>p[0]))-25,Math.min(...pts.map(p=>p[1]))-45,Math.max(...pts.map(p=>p[0]))+25,Math.max(...pts.map(p=>p[1]))+20]);c.footY.push(550);c.pushCenters.push([r.point('Hips')[0],40]);c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));}
  c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];
 }
 if(who==='BRAX'||who==='BEAR'){
  const c=cfg.COMBO,dt=c.durations[0]/1000,groups=new Map();for(const[i,h]of Object.entries(c.hits)){if(!groups.has(h.group))groups.set(h.group,{...h,indices:[]});groups.get(h.group).indices.push(+i);}
  c.hits={};for(const[g,h]of groups){const radius=h.box[2]/2;for(const i of h.indices){r.pose(c,i*dt);const p=r.point(h.bone);c.hits[i]={bone:h.bone,damage:h.damage,group:g,box:[p[0]-radius,p[1]-radius,radius*2,radius*2]};}}
 }
 fs.writeFileSync(dir+'config.json',JSON.stringify(cfg));console.log('updated',who);
}
