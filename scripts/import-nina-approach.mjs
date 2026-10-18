import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';
import {FBXLoader} from './source-import/FBXLoaderEight.mjs';
import {rig} from '../game/assets/fighter-source-core.js';
globalThis.window={URL:{createObjectURL:()=>''}};
globalThis.document={createElementNS:()=>({addEventListener(){},removeEventListener(){},set src(v){}})};
const load=p=>{const b=fs.readFileSync(p);return new FBXLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const bones=m=>{const b={};m.traverse(o=>{if(o.isBone)b[o.name]=o;});return b;};
const saved='source-assets/approach-20261011/';fs.mkdirSync(saved,{recursive:true});
const candidates={};for(const name of ['Walking','Happy Walk','Taunt']){const file=name+'.fbx';fs.copyFileSync('../upload/'+file,saved+file);const m=load(saved+file),c=m.animations[0];candidates[name]=m;const hip=c.tracks.find(t=>t.name==='mixamorigHips.position');console.log(JSON.stringify({name,duration:c.duration,tracks:c.tracks.length,rootStart:Array.from(hip.values.slice(0,3)),rootEnd:Array.from(hip.values.slice(-3))}));}
const selected=process.env.APPROACH_CLIP;if(!selected)process.exit(0);
if(!['Walking','Happy Walk'].includes(selected))throw Error('Select a supplied walking clip');
const source=candidates[selected],sb=bones(source),audit=[];
for(const [who,bind]of [['NINA','nina-new/Ginga Variation 2.fbx']]){
 const target=bones(load('../incoming/'+bind)),clip=source.animations[0].clone(),length=b=>b.mixamorigLeftLeg.position.length()+b.mixamorigLeftFoot.position.length(),ratio=length(target)/length(sb);
 for(const track of clip.tracks){const [n,prop]=track.name.split('.');if(!sb[n]||!target[n])throw Error('Missing joint '+n);
  if(prop==='quaternion'){const delta=target[n].quaternion.clone().multiply(sb[n].quaternion.clone().invert());for(let i=0;i<track.values.length;i+=4)new T.Quaternion().fromArray(track.values,i).premultiply(delta).normalize().toArray(track.values,i);}
  else if(prop==='position'){for(let i=0;i<track.values.length;i+=3)new T.Vector3().fromArray(track.values,i).sub(sb[n].position).multiplyScalar(ratio).add(target[n].position).toArray(track.values,i);}
 }
 clip.name='Shared Approach Walk';const dir='game/assets/'+who.toLowerCase()+'-new/',raw=JSON.parse(zlib.gunzipSync(fs.readFileSync(dir+'clips.json.gz')));raw[clip.name]=T.AnimationClip.toJSON(clip);
 fs.writeFileSync(dir+'clips.json.gz',zlib.gzipSync(JSON.stringify(raw),{level:9}));
 const full='source-assets/'+who.toLowerCase()+'/clips-all.json.gz';if(fs.existsSync(full)){const all=JSON.parse(zlib.gunzipSync(fs.readFileSync(full)));all[clip.name]=raw[clip.name];fs.writeFileSync(full,zlib.gzipSync(JSON.stringify(all),{level:9}));}
 const cfg=JSON.parse(fs.readFileSync(dir+'config.json')),r=rig(new T.ObjectLoader().parse(JSON.parse(zlib.gunzipSync(fs.readFileSync(dir+'model.json.gz')))),raw,who);
 const c={asset:who+'_NEW_APPROACH',character:who,label:'Podejście',sourceVersion:'bear-20261011',clip:clip.name,attack:false,gain:0,cost:0,w:1024,h:640,scale:1,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1,duration:clip.duration,transitionMs:160,locomotion:true,plantFeet:true,guardLoop:{start:0,end:clip.duration,blend:.06}};
 const hip=clip.tracks.find(t=>t.name==='mixamorigHips.position'),a=new T.Vector3().fromArray(hip.values),b=new T.Vector3().fromArray(hip.values,hip.values.length-3),meters=Math.hypot(b.x-a.x,b.z-a.z)*(who==='BRAX'?.019:.0185),speed={BRAX:.60,NYXA:.67,VEXA:.73,KROV:.58,BEAR:.54,NINA:.70}[who]*1.7;
 c.gaitRate=meters>.1?speed/(meters/clip.duration):1;
 const frames=Math.ceil(c.duration*60),dt=c.duration/frames;c.durations=Array(frames).fill(dt*1000);c.boxes=[];c.hurtCapsules=[];c.footY=[];c.pushCenters=[];c.hits={};
 for(let i=0;i<frames;i++){r.pose(c,i*dt);const pts=Object.keys(r.bones).map(n=>r.point(n));c.boxes.push([Math.min(...pts.map(p=>p[0]))-25,Math.min(...pts.map(p=>p[1]))-45,Math.max(...pts.map(p=>p[0]))+25,Math.max(...pts.map(p=>p[1]))+20]);c.footY.push(550);c.pushCenters.push([r.point('Hips')[0],40]);c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));}
 c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];cfg.APPROACH=c;fs.writeFileSync(dir+'config.json',JSON.stringify(cfg));
 const manifest=JSON.parse(fs.readFileSync(dir+'manifest.json'));manifest.clips=Object.keys(raw);fs.writeFileSync(dir+'manifest.json',JSON.stringify(manifest));audit.push({who,source:selected,legRatio:ratio,period:clip.duration,gaitRate:c.gaitRate,rootTravelMeters:meters});
}
fs.writeFileSync('docs/nina-approach-walk-audit.json',JSON.stringify(audit,null,2));console.log(JSON.stringify(audit));
