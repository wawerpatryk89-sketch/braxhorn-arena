globalThis.window={URL:{createObjectURL:()=>"placeholder"}};
import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';import{FBXLoader}from './FBXLoaderEight.mjs';
const load=p=>{const b=fs.readFileSync(p);return new FBXLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
for(const who of ['brax','nyxa']){
 const sourceRoot=process.env.FIGHTER_SOURCE_ROOT;if(!sourceRoot)throw Error('Set FIGHTER_SOURCE_ROOT to the directory containing brax and nyxa source folders');const dir=sourceRoot+'/'+who+'/',out='dist/assets/'+who+'-new/';const raw={},stats=[];
 for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.fbx')&&!f.startsWith('tripo_'))){if(who==='brax'&&['Idle.fbx','Medium Step Forward (1).fbx','Kip Up (1).fbx'].includes(f)||who==='nyxa'&&f==='Walking.fbx')continue;const m=load(dir+f),a=m.animations[0];if(!a)throw Error('No animation '+f);a.name=f.slice(0,-4);raw[a.name]=T.AnimationClip.toJSON(a);stats.push([a.name,a.duration,a.tracks.length]);}
 if(who==='nyxa')for(const f of ['Idle.fbx','Medium Step Forward (1).fbx']){const m=load(sourceRoot+'/brax/'+f),a=m.animations[0];a.name=f.slice(0,-4);raw[a.name]=T.AnimationClip.toJSON(a);}
 fs.writeFileSync(out+'clips.json.gz',zlib.gzipSync(JSON.stringify(raw)));
 if(who==='brax'){const m=load(dir+fs.readdirSync(dir).find(f=>f.startsWith('tripo_convert')));m.animations=[];m.traverse(o=>{if(o.isMesh)o.material=new T.MeshStandardMaterial();});fs.writeFileSync(out+'model.json.gz',zlib.gzipSync(JSON.stringify(m.toJSON())));for(const [dest,src]of Object.entries({color:'tripo_node_e9af3c6a_BaseColor.png',normal:'tripo_node_e9af3c6a_Normal_Bake.png',roughness:'minotaur_athlete_3d_model_roughness.PNG',metalness:'minotaur_athlete_3d_model_metallic.PNG'}))fs.copyFileSync(dir+src,out+dest+'.png');}
 console.log(who,JSON.stringify(stats));
}
