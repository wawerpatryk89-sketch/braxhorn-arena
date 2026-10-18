import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import * as T from 'three';
import {FBXLoader} from './FBXLoaderEight.mjs';
globalThis.window={URL:{createObjectURL:()=>''}};
globalThis.document={createElementNS:()=>({addEventListener(){},removeEventListener(){},set src(v){}})};
const root=process.env.FIGHTER_SOURCE_ROOT;
if(!root)throw Error('Set FIGHTER_SOURCE_ROOT to supplied fighter source directory');
const dir=path.join(root,'danny-new'),out='dist/assets/danny-new/';fs.mkdirSync(out,{recursive:true});
const load=p=>{const b=fs.readFileSync(p);return new FBXLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const raw={},audit=[],hashes=new Map();
for(const file of fs.readdirSync(dir).filter(n=>n.endsWith('.fbx')&&!n.startsWith('tripo_'))){
 const source=load(path.join(dir,file)),clip=source.animations[0];if(!clip)throw Error('Missing animation '+file);
 clip.name=file.slice(0,-4);raw[clip.name]=T.AnimationClip.toJSON(clip);
 const sha=crypto.createHash('sha256').update(JSON.stringify(clip.tracks.map(t=>[t.name,Array.from(t.times),Array.from(t.values)]))).digest('hex');
 audit.push({file,duration:clip.duration,duplicateOf:hashes.get(sha)||null});hashes.set(sha,file);
}
const modelFile=fs.readdirSync(dir).find(n=>n.startsWith('tripo_')&&n.endsWith('.fbx')),model=load(path.join(dir,modelFile));
model.animations=[];model.traverse(o=>{if(o.isMesh)o.material=new T.MeshStandardMaterial();});
fs.writeFileSync(out+'model.json.gz',zlib.gzipSync(JSON.stringify(model.toJSON())));
const textures={color:'tripo_node_41722d6a_BaseColor.png',normal:'tripo_node_41722d6a_Normal_Bake.png',roughness:'muscular_fighter_3d_model_roughness.PNG',metalness:'muscular_fighter_3d_model_metallic.PNG'};
for(const [dest,file] of Object.entries(textures))fs.copyFileSync(path.join(dir,modelFile.replace('.fbx','.fbm'),file),out+dest+'.png');
const bones=m=>{const b={};m.traverse(o=>{if(o.isBone)b[o.name]=o;});return b;},target=bones(load(path.join(dir,'Idle.fbx')));
for(const [sourceWho,file,name] of [['krov-new','Getting Up.fbx','Shared Getting Up'],['vexa','Falling Back Death.fbx','Shared Falling Back Death'],['krov-new','Flying Back Death.fbx','Shared Flying Back Death'],['bear-new','Kidney Hit.fbx','Shared Hit Body']]){
 const src=load(path.join(root,sourceWho,file)),sb=bones(src),clip=src.animations[0].clone();
 const length=b=>b.mixamorigLeftLeg.position.length()+b.mixamorigLeftFoot.position.length(),ratio=length(target)/length(sb);
 for(const track of clip.tracks){const[n,property]=track.name.split('.');if(!sb[n]||!target[n])throw Error('Missing retarget bone '+n);
  if(property==='quaternion'){const delta=target[n].quaternion.clone().multiply(sb[n].quaternion.clone().invert());for(let i=0;i<track.values.length;i+=4)new T.Quaternion().fromArray(track.values,i).premultiply(delta).normalize().toArray(track.values,i);}
  else if(property==='position'){if(n!=='mixamorigHips')throw Error('Unexpected translation track');for(let i=0;i<track.values.length;i+=3)new T.Vector3().fromArray(track.values,i).sub(sb[n].position).multiplyScalar(ratio).add(target[n].position).toArray(track.values,i);}
 }
 clip.name=name;raw[name]=T.AnimationClip.toJSON(clip);audit.push({file:sourceWho+'/'+file,retargetedAs:name,legRatio:ratio,duration:clip.duration});
}
fs.writeFileSync(out+'clips.json.gz',zlib.gzipSync(JSON.stringify(raw)));
fs.writeFileSync('docs/danny-source-audit.json',JSON.stringify({model:modelFile,preservedTextures:textures,clips:audit},null,2));
fs.mkdirSync('source-assets/danny',{recursive:true});fs.copyFileSync(out+'clips.json.gz','source-assets/danny/clips-all.json.gz');console.log(JSON.stringify({model:modelFile,clips:audit},null,2));
