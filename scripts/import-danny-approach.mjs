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
for(const [who,bind]of [['DANNY','danny-new/Idle.fbx']]){
 const target=bones(load('../incoming/'+bind)),clip=source.animations[0].clone(),length=b=>b.mixamorigLeftLeg.position.length()+b.mixamorigLeftFoot.position.length(),ratio=length(target)/length(sb);
 for(const track of clip.tracks){const [n,prop]=track.name.split('.');if(!sb[n]||!target[n])throw Error('Missing joint '+n);
  if(prop==='quaternion'){const delta=target[n].quaternion.clone().multiply(sb[n].quaternion.clone().invert());for(let i=0;i<track.values.length;i+=4)new T.Quaternion().fromArray(track.values,i).premultiply(delta).normalize().toArray(track.values,i);}
  else if(prop==='position'){for(let i=0;i<track.values.length;i+=3)new T.Vector3().fromArray(track.values,i).sub(sb[n].position).multiplyScalar(ratio).add(target[n].position).toArray(track.values,i);}
 }
 clip.name='Shared Approach Walk';const dir='game/assets/'+who.toLowerCase()+'-new/',raw=JSON.parse(zlib.gunzipSync(fs.readFileSync(dir+'clips.json.gz')));raw[clip.name]=T.AnimationClip.toJSON(clip);
 fs.writeFileSync(dir+'clips.json.gz',zlib.gzipSync(JSON.stringify(raw),{level:9}));
 const full='source-assets/'+who.toLowerCase()+'/clips-all.json.gz';if(fs.existsSync(full)){const all=JSON.parse(zlib.gunzipSync(fs.readFileSync(full)));all[clip.name]=raw[clip.name];fs.writeFileSync(full,zlib.gzipSync(JSON.stringify(all),{level:9}));}
 audit.push({who,source:selected,legRatio:ratio,period:clip.duration});

}
fs.writeFileSync('docs/danny-approach-walk-audit.json',JSON.stringify(audit,null,2));console.log(JSON.stringify(audit));
