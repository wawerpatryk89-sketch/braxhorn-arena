import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';import {rig} from '../game/assets/fighter-source-core.js';
const read=p=>JSON.parse(zlib.gunzipSync(fs.readFileSync(p))),model=n=>new T.ObjectLoader().parse(read(`game/assets/${n}-new/model.json.gz`));
function retarget(from,to,clipName,name){
 const s=model(from),d=model(to),bones=m=>{const b={};m.traverse(o=>{if(o.isBone)b[o.name]=o});return b},sb=bones(s),db=bones(d);
 const raw=read(`source-assets/${from}/clips-all.json.gz`),clip=T.AnimationClip.parse(raw[clipName]);
 const length=b=>b.mixamorigLeftLeg.position.length()+b.mixamorigLeftFoot.position.length(),ratio=length(db)/length(sb);
 for(const track of clip.tracks){const [n,prop]=track.name.split('.');if(!sb[n]||!db[n])throw Error('Missing joint '+n);
 if(prop==='quaternion'){const delta=db[n].quaternion.clone().multiply(sb[n].quaternion.clone().invert());for(let i=0;i<track.values.length;i+=4)new T.Quaternion().fromArray(track.values,i).premultiply(delta).normalize().toArray(track.values,i);}
 if(prop==='position')for(let i=0;i<track.values.length;i+=3)new T.Vector3().fromArray(track.values,i).sub(sb[n].position).multiplyScalar(ratio).add(db[n].position).toArray(track.values,i);
 }
 clip.name=name;return T.AnimationClip.toJSON(clip);
}
function update(who,newClip,states){
 const base=`game/assets/${who}-new/`,raw=read(base+'clips.json.gz'),cfg=JSON.parse(fs.readFileSync(base+'config.json'));raw[newClip.name]=newClip;
 const r=rig(model(who),raw,who.toUpperCase());
 for(const [name,extra,contacts]of states){const c=cfg[name];for(const k of ['sequence','gaitBlend','guardLoop','attackRangeByOpponent','phaseTempo','freeze'])delete c[k];Object.assign(c,extra,{clip:newClip.name,duration:newClip.duration});
 const count=Math.ceil(c.duration*60),step=c.duration/count;c.durations=Array(count).fill(step*1000);c.boxes=[];c.hurtCapsules=[];c.pushCenters=[];c.footY=[];c.hits={};
 for(let i=0;i<count;i++){r.pose(c,i*step);const pts=Object.keys(r.bones).map(n=>r.point(n));c.boxes.push([Math.min(...pts.map(p=>p[0]))-25,Math.min(...pts.map(p=>p[1]))-45,Math.max(...pts.map(p=>p[0]))+25,Math.max(...pts.map(p=>p[1]))+20]);c.pushCenters.push([r.point('Hips')[0],40]);c.footY.push(550);
 c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
 contacts.forEach(([time,bone,damage],group)=>{if(Math.abs(i*step-time)<=.085){const p=r.point(bone);c.hits[i]={box:[p[0]-24,p[1]-24,48,48],bone,damage,group}}});
 }
 c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];
 }
 fs.writeFileSync(base+'config.json',JSON.stringify(cfg));fs.writeFileSync(base+'clips.json.gz',zlib.gzipSync(JSON.stringify(raw),{level:9}));const manifest=JSON.parse(fs.readFileSync(base+'manifest.json'));manifest.clips=Object.keys(raw);fs.writeFileSync(base+'manifest.json',JSON.stringify(manifest));
 // Keep original archives intact; the derived clip has explicit provenance in this script.
 console.log(who,states.map(s=>s[0]),newClip.name);
}
const walk=retarget('krov','danny','Short Step Forward','Danny Fighting Step');
update('danny',walk,['WALK_FORWARD','APPROACH'].map(name=>[name,{label:'Krótki krok w gardzie',start:0,locomotion:true,gaitRate:1.15,transitionMs:130,plantFeet:true,guardLoop:{start:0,end:walk.duration,blend:.10}},[]]));
const kick=retarget('danny','brax','Side Kick','Brax Side Kick');
update('brax',kick,[['HEAVY_KICK',{label:'Kopnięcie boczne',start:0,playbackRate:1.6,transitionMs:100,lockPlanarRoot:true,attackRangePx:190},[[.7,'RightFoot',14]]]]);
