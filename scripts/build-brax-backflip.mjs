import fs from 'node:fs';
import zlib from 'node:zlib';
import * as T from 'three';
import {rig,SIZE,VIEW} from '../game/assets/fighter-source-core.js';
const read=p=>JSON.parse(zlib.gunzipSync(fs.readFileSync(p)));
const dir='game/assets/brax-new/';
const raw=read(dir+'clips.json.gz'),cfg=JSON.parse(fs.readFileSync(dir+'config.json'));
const source=new T.ObjectLoader().parse(read('game/assets/krov-new/model.json.gz'));
const target=new T.ObjectLoader().parse(read(dir+'model.json.gz'));
const map=m=>{const b={};m.traverse(o=>{if(o.isBone)b[o.name.replace(/^mixamorig/,'')]=o;});return b;};
const sb=map(source),tb=map(target),axis=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2),inverse=axis.clone().invert();
const leg=b=>b.LeftLeg.position.length()+b.LeftFoot.position.length(),ratio=leg(tb)/leg(sb);
const clip=T.AnimationClip.parse(read('source-assets/krov/clips-all.json.gz').Backflip);
for(const tr of clip.tracks){const [name,kind]=tr.name.split('.'),key=name.replace(/^mixamorig/,'');if(!tb[key]||!sb[key])throw Error('Missing '+key);
 if(kind==='quaternion'){const delta=tb[key].quaternion.clone().multiply(sb[key].quaternion.clone().invert());if(key==='Hips')delta.premultiply(inverse).multiply(axis);for(let i=0;i<tr.values.length;i+=4)new T.Quaternion().fromArray(tr.values,i).premultiply(delta).normalize().toArray(tr.values,i);}
 if(kind==='position'){if(key!=='Hips')throw Error('Unexpected translation');const from=sb.Hips.position.clone().applyQuaternion(inverse),to=tb.Hips.position.clone().applyQuaternion(inverse);for(let i=0;i<tr.values.length;i+=3)new T.Vector3().fromArray(tr.values,i).sub(from).multiplyScalar(ratio).add(to).toArray(tr.values,i);}
}
clip.name='Brax Backflip';raw[clip.name]=T.AnimationClip.toJSON(clip);
const duration=.10+clip.duration+.20,frames=Math.ceil(duration*60),dt=duration/frames;
const c={asset:'BRAX_BACKFLIP_20261013',character:'BRAX',label:'Salto w tył',sourceVersion:'backflip-20261013',animationSource:'Backflip — existing supplied Krov clip, retargeted to Brax',clip:clip.name,sequence:[{clip:cfg.IDLE.clip,start:cfg.IDLE.start||0,duration:.10},{clip:clip.name,duration:clip.duration,blend:.10},{clip:cfg.IDLE.clip,start:cfg.IDLE.start||0,duration:.20,blend:.20}],duration,durations:Array(frames).fill(dt*1000),attack:false,gain:0,cost:0,w:1024,h:640,scale:cfg.IDLE.scale,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1.62,transitionMs:70,lockPlanarRoot:true,hits:{},retreat:{from:.72,to:1.46,height:.60},boxes:[],hurtCapsules:[],pushCenters:[],footY:[]};
const r=rig(new T.ObjectLoader().parse(read(dir+'model.json.gz')),raw,'BRAX');
for(let i=0;i<frames;i++){r.pose(c,i*dt);const p=Object.keys(r.bones).map(n=>r.point(n));c.boxes.push([Math.min(...p.map(x=>x[0]))-25,Math.min(...p.map(x=>x[1]))-45,Math.max(...p.map(x=>x[0]))+25,Math.max(...p.map(x=>x[1]))+20]);c.pushCenters.push([r.point('Hips')[0],40]);c.footY.push(c.anchorY);c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));}
c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];cfg.BACKFLIP=c;
fs.writeFileSync(dir+'config.json',JSON.stringify(cfg));fs.writeFileSync(dir+'clips.json.gz',zlib.gzipSync(JSON.stringify(raw),{level:9}));
console.log(JSON.stringify({action:'BACKFLIP',duration:duration/(1.62*1.1),frames,retargetRatio:ratio,source:'source-assets/krov/clips-all.json.gz:Backflip'}));
