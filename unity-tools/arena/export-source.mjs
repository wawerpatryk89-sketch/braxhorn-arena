// Migration-time tooling only. No JavaScript or Three.js is shipped in the player.
// Bake the published rig corrections before converting handedness in Unity.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import * as THREE from '../../game/assets/vendor/three.module.js';
import {rig} from '../../game/assets/fighter-source-core.js';
import {retargetOutfitClipsFromRecipe} from '../../game/assets/outfit-retarget.js';
import {BRAX_SOURCE_PBR,OUTFIT_SOURCE_DIFFUSE} from '../../game/assets/outfit-materials.js';

const root=path.resolve(new URL('../..',import.meta.url).pathname);
const destination=path.join(root,'unity-arena/Assets/Arena/SourceData');
const assetRoot=path.join(root,'game/assets');
const roster=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON','BOSS','ZOMBIE'];
const outfits=JSON.parse(fs.readFileSync(path.join(assetRoot,'outfits/catalog.json')));
const selected=process.argv.find(a=>a.startsWith('--fighters='))?.split('=')[1].split(',');
const maxActions=Number(process.argv.find(a=>a.startsWith('--max-actions='))?.split('=')[1]||0);
const hash=b=>createHash('sha256').update(b).digest('hex');
const sourceLock=JSON.parse(fs.readFileSync(path.join(root,'unity-tools/arena/source-lock.json')));
for(const entry of [...sourceLock.sources,...sourceLock.toolSources]){
 const file=path.join(root,entry.path);
 if(!fs.existsSync(file)||![entry.sha256,entry.delivery?.restoredSha256].includes(hash(fs.readFileSync(file))))
  throw Error('Wrong migration baseline: '+entry.path+'. Restore the v271 source snapshot '+sourceLock.sourceCommit+' before exporting.');
}
const sources=new Map();
function read(file){const b=fs.readFileSync(file);sources.set(path.relative(root,file),{path:path.relative(root,file),sha256:hash(b),bytes:b.length});return b;}
function json(file){const b=read(file.split('?')[0]);return JSON.parse(file.split('?')[0].endsWith('.gz')?zlib.gunzipSync(b):b);}
function save(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);}
function packed(file,value){save(file,zlib.gzipSync(JSON.stringify(value),{level:6,mtime:0}));}
function safeName(name){return name.replace(/[^A-Za-z0-9_-]/g,'_');}
function string(buffer,value){const b=Buffer.from(value);const n=Buffer.alloc(4);n.writeInt32LE(b.length);buffer.push(n,b);}
function matrix(node){node.updateMatrix();return node.matrix.toArray();}

fs.mkdirSync(destination,{recursive:true});
const catalog=[];
for(const who of [...roster,...outfits.map(o=>o.id)]){
 if(selected&&!selected.includes(who))continue;
 const outfit=outfits.find(o=>o.id===who),base=outfit?.base||who;
 const basePath=path.join(assetRoot,base.toLowerCase()+'-new');
 const modelPath=outfit?path.join(root,'game',outfit.assetPath):basePath;
 let config=json(path.join(basePath,'config.json'));
 if(outfit){const patch=json(path.join(modelPath,'config.patch.json'));config=Object.fromEntries(Object.entries(config).map(([key,c])=>[key,{...c,...patch[key]}]));}
 const raw=json(path.join(basePath,'clips.json.gz'));
 for(const file of [config.IDLE.pairedClips,config.IDLE.prefightClips].filter(Boolean))Object.assign(raw,json(path.join(basePath,file)));
 const model=json(path.join(modelPath,'model.json.gz'));
 const clips=outfit?retargetOutfitClipsFromRecipe(raw,json(path.join(modelPath,'retarget.json')),base):raw;
 const r=rig(new THREE.ObjectLoader().parse(model),clips,base,{lazy:true});
 const nodes=[];r.stage.name='Stage';r.model.name='Model';
 r.stage.traverse(node=>nodes.push(node));
 const nodeIndex=new Map(nodes.map((node,i)=>[node,i]));
 // Stable paths are required for Unity animation bindings; fail on duplicates.
 const paths=new Set();
 const hierarchy=nodes.map((node,i)=>{
  const parent=node.parent?nodeIndex.get(node.parent):-1;
  if(node!==r.stage&&!node.name)node.name='Node_'+i;
  const pieces=[];for(let p=node;p&&p!==r.stage;p=p.parent)pieces.unshift(p.name);
  const binding=pieces.join('/');if(paths.has(binding))throw Error(who+': duplicate node '+binding);paths.add(binding);
  return {id:node.uuid,name:node.name,parent:parent??-1,path:binding,matrix:matrix(node)};
 });
 const meshes=[];
 r.stage.traverse(node=>{
  if(!node.isMesh)return;
  const g=node.geometry,attributes={};
  for(const [name,a] of Object.entries(g.attributes))attributes[name]={itemSize:a.itemSize,array:Array.from(a.array)};
  meshes.push({node:nodeIndex.get(node),attributes,index:g.index?Array.from(g.index.array):null,groups:g.groups,
   bones:node.isSkinnedMesh?node.skeleton.bones.map(b=>nodeIndex.get(b)):[],
   inverses:node.isSkinnedMesh?node.skeleton.boneInverses.map(m=>m.toArray()):[],
   bindMatrix:node.isSkinnedMesh?node.bindMatrix.toArray():null});
 });
 const directory=path.join(destination,who);fs.mkdirSync(directory,{recursive:true});
 packed(path.join(directory,'model.bytes'),{schema:1,who,nodes:hierarchy,meshes});
 // Original frame metadata remains intact: hits, hurt capsules, paired movement,
 // timing and progression must not be silently reduced to a generic fighting demo.
 packed(path.join(directory,'config.bytes'),config);
 const material={diffuse:OUTFIT_SOURCE_DIFFUSE[who]||[1,1,1],doubleSided:!!BRAX_SOURCE_PBR[who]?.doubleSided};
 for(const kind of ['color','normal','metalness','roughness']){
  const file=BRAX_SOURCE_PBR[who]?.files[kind+'.webp']||(kind==='color'&&['BRAX_WHITE','BRAX_STREET','NYXA_SPORT','NYXA_PINK'].includes(who)?'color.jpg':kind+'.webp');
  const source=path.join(modelPath,file);read(source);
  // PNG retains the decoded source pixels; Unity does not import WebP directly.
  execFileSync('python3',['-c','from PIL import Image; import sys; Image.open(sys.argv[1]).save(sys.argv[2])',source,path.join(directory,kind+'.png')]);
 }
 save(path.join(directory,'material.json'),JSON.stringify(material));
 execFileSync('python3',['-c',
  'from PIL import Image,ImageOps; import sys; m=Image.open(sys.argv[1]).convert("RGB").getchannel("B"); r=Image.open(sys.argv[2]).convert("RGB").getchannel("G"); assert m.size==r.size; Image.merge("RGBA",(m,m,m,ImageOps.invert(r))).save(sys.argv[3])',
  path.join(directory,'metalness.png'),path.join(directory,'roughness.png'),path.join(directory,'metallicSmoothness.png')]);
 const actions=[];
 for(const [name,c] of Object.entries(config).slice(0,maxActions||undefined)){
  const duration=c.durations.reduce((a,b)=>a+b,0)/1000;
  if(!Number.isFinite(duration)||duration<=0)throw Error(who+'/'+name+': invalid duration');
  // Use each authored frame time, including the terminal sample. Export all
  // transforms, not just a guessed humanoid subset (tails and hand props count).
  const times=[0];for(const d of c.durations)times.push(times.at(-1)+d/1000);
  const values=new Float32Array(times.length*nodes.length*10);
  for(let frame=0;frame<times.length;frame++){
   r.pose(c,Math.min(times[frame],Math.max(0,duration-1e-7)),1);r.groundTail();
   for(let n=0;n<nodes.length;n++){
    const o=nodes[n],at=(frame*nodes.length+n)*10;
    values.set([o.position.x,o.position.y,o.position.z,o.quaternion.x,o.quaternion.y,o.quaternion.z,o.quaternion.w,o.scale.x,o.scale.y,o.scale.z],at);
   }
  }
  for(const v of values)if(!Number.isFinite(v))throw Error(who+'/'+name+': nonfinite pose');
  const chunks=[Buffer.from('BAP1')];const header=Buffer.alloc(8);header.writeInt32LE(nodes.length,0);header.writeInt32LE(times.length,4);chunks.push(header);
  for(const n of hierarchy)string(chunks,n.path);
  const timing=Buffer.alloc(times.length*4);times.forEach((t,i)=>timing.writeFloatLE(t,i*4));chunks.push(timing,Buffer.from(values.buffer));
  const data=zlib.gzipSync(Buffer.concat(chunks),{level:6,mtime:0}),file='actions/'+safeName(name)+'.bytes';save(path.join(directory,file),data);
  actions.push({id:name,file,duration,frames:times.length,sha256:hash(data)});
  if(actions.length%25===0)process.stdout.write(JSON.stringify({fighter:who,actions:actions.length,total:Object.keys(config).length})+'\n');
 }
 const entry={id:who,base,displayName:who==='BEAR'?'MIŚ':who==='DEMON'?'AZRAK':who,label:outfit?.label||who,npc:['BOSS','ZOMBIE'].includes(who),actions,nodes:hierarchy.length,meshes:meshes.length,complete:actions.length===Object.keys(config).length};
 save(path.join(directory,'fighter.json'),JSON.stringify(entry,null,2));catalog.push(entry);
 process.stdout.write(JSON.stringify({fighter:who,complete:entry.complete,actions:actions.length})+'\n');
 for(const mesh of meshes)mesh.attributes=null;
}
const manifest={schema:1,sourceCommit:sourceLock.sourceCommit,migrationCodeCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceSiteVersion:271,editor:'6000.3.27f2',fighters:catalog.map(({actions,...r})=>({...r,actionCount:actions.length})),sources:[...sources.values()],partial:!!selected||!!maxActions};
save(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2));
process.stdout.write(JSON.stringify({exported:catalog.length,partial:manifest.partial})+'\n');
