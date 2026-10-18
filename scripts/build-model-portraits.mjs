import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';

// Render the actual game geometry, original texture and supplied guard pose.
// Keep all skin-weight groups; no generated replacement characters.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'brax-portraits-'));
fs.mkdirSync('game/assets/portraits',{recursive:true});
try{
 for(const who of (process.argv.length>2?process.argv.slice(2):['BRAX','NYXA','VEXA','KROV','NINA','DANNY'])){
  const base='game/assets/'+who.toLowerCase()+'-new/';
  const read=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(base+n)));
  const cfg=JSON.parse(fs.readFileSync(base+'config.json'));
  const r=rig(new T.ObjectLoader().parse(read('model.json.gz')),read('clips.json.gz'),who);
  r.pose({...(['BRAX','VEXA'].includes(who)?cfg.APPROACH:cfg.IDLE),stageYaw:0},0);const triangles=[];
  r.model.traverse(m=>{
   if(!m.isSkinnedMesh)return;m.skeleton.update();
   const a=m.geometry.attributes,groups=Object.keys(a).filter(n=>/^skinWeight/.test(n)).map(n=>({w:a[n],i:a[n.replace('Weight','Index')]})),verts=[];
   const bone=new T.Matrix4(),sample=new T.Vector3();
   for(let i=0;i<a.position.count;i++){
    const v=new T.Vector3().fromBufferAttribute(a.position,i).applyMatrix4(m.bindMatrix),out=new T.Vector3();let total=0;
    for(const g of groups)for(let j=0;j<4;j++){const w=g.w.array[i*4+j];if(w){bone.fromArray(m.skeleton.boneMatrices,g.i.array[i*4+j]*16);out.addScaledVector(sample.copy(v).applyMatrix4(bone),w);total+=w;}}
    if(!total)out.copy(v);
    out.applyMatrix4(m.bindMatrixInverse).applyMatrix4(m.matrixWorld);verts.push([...out.toArray(),a.uv.getX(i),a.uv.getY(i)]);
   }
   const ix=m.geometry.index?.array||Array.from({length:verts.length},(_,i)=>i);
   for(const index of ix)triangles.push(...verts[index]);
  });
  const data=new Float32Array(triangles),mesh=path.join(temp,who+'.bin');fs.writeFileSync(mesh,Buffer.from(data.buffer));
  execFileSync('python',['scripts/render-model-portrait.py',mesh,base+'color.webp','game/assets/portraits/'+who.toLowerCase()+'.webp'],{stdio:'inherit'});
 }
}finally{fs.rmSync(temp,{recursive:true,force:true});}
