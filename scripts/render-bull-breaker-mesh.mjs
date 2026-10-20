import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';import{rig}from'../game/assets/fighter-source-core.js';
fs.mkdirSync('/tmp/brax-qa',{recursive:true});const frames=JSON.parse(fs.readFileSync('/tmp/brax-combo-frames.json')),cache={};
for(const who of new Set(frames.flatMap(f=>f.actors.map(a=>a.who)))){const dir='game/assets/'+who.toLowerCase()+'-new/',rd=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(dir+n)));cache[who]={cfg:JSON.parse(fs.readFileSync(dir+'config.json')),r:rig(new T.ObjectLoader().parse(rd('model.json.gz')),{...rd('clips.json.gz'),...(who==='BRAX'?rd('chain-clips.json.gz'):{})},who)};}
for(const[fi,frame]of frames.entries())for(const actor of frame.actors){const who=actor.who,{r,cfg}=cache[who],c=cfg[actor.action],pixelScale=640/3.25*c.scale*frame.baseScale;r.pose(c,actor.time,actor.face);
r.stage.updateMatrixWorld(true);const triangles=[];
 r.model.traverse(m=>{if(!m.isSkinnedMesh)return;m.skeleton.update();const a=m.geometry.attributes,groups=Object.keys(a).filter(n=>/^skinWeight/.test(n)).map(n=>({w:a[n],i:a[n.replace('Weight','Index')]})),verts=[];
  for(let v=0;v<a.position.count;v++){const p=new T.Vector3().fromBufferAttribute(a.position,v).applyMatrix4(m.bindMatrix),out=new T.Vector3();let sum=0;
   for(let j=0;j<groups.length*4;j++){const g=groups[Math.floor(j/4)],w=g.w.array[v*4+j%4],idx=g.i.array[v*4+j%4];if(w){sum+=w;out.addScaledVector(p.clone().applyMatrix4(new T.Matrix4().fromArray(m.skeleton.boneMatrices,idx*16)),w);}}
   if(!sum)out.copy(p);out.applyMatrix4(m.bindMatrixInverse).applyMatrix4(m.matrixWorld);out.x=out.x*pixelScale+actor.x/100*844;out.y=out.y*pixelScale+390-frame.ground+actor.airPx;verts.push([...out.toArray(),a.uv.getX(v),a.uv.getY(v)]);
  }const ix=m.geometry.index?.array||Array.from({length:verts.length},(_,j)=>j);for(const j of ix)triangles.push(...verts[j]);
 });fs.writeFileSync('/tmp/brax-qa/'+fi+'-'+who+'.bin',Buffer.from(new Float32Array(triangles).buffer));

}
