import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';import{rig}from'../game/assets/fighter-source-core.js';
// Software-render inputs for QA. All original skin-weight groups are retained.
const [kind='contact',time='0.30',reverse='0']=process.argv.slice(2),t=Number(time);
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const cast=process.env.FIGHTERS?.split(',')||['BRAX','DANNY'];const contactGap=cast.map(who=>JSON.parse(fs.readFileSync('game/assets/'+who.toLowerCase()+'-new/config.json')).CONTACT_PUSH.contactGapPx*3.25/640).reduce((a,b)=>a+b,0)/cast.length;
for(const [i,who]of cast.entries()){
 const dir='game/assets/'+who.toLowerCase()+'-new/',read=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(dir+n))),cfg=JSON.parse(fs.readFileSync(dir+'config.json'));
 const r=rig(new T.ObjectLoader().parse(read('model.json.gz')),read('clips.json.gz'),who),pushing=i===Number(reverse);
 const c=kind==='contact'?cfg[pushing?'CONTACT_PUSH':'CONTACT_RECEIVE']:kind==='sprint'?{...cfg.LIGHT_PUNCH,movingGait:{config:cfg.RUN,time:t,weight:1}}:cfg[kind];if(kind==='contact'){const other=cast[1-i],oc=JSON.parse(fs.readFileSync('game/assets/'+other.toLowerCase()+'-new/config.json')).CONTACT_PUSH;c.contactOpponent={shoulders:oc.contactShoulders,gap:contactGap,ratio:oc.scale/c.scale};}r.pose(c,t,kind==='contact'&&!pushing?-1:1);
 if(kind==='contact'&&c.contactMotion){const curve=c.contactMotion,i=Math.min(curve.length-2,Math.floor(t/c.duration*(curve.length-1))),a=curve[i],b=curve[i+1],root=(a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0]))*3.25/640;r.stage.position.x=pushing?root:contactGap-root;}
 else if(kind==='contact'){const steps=.42*smooth((t-.57)/.38)+.36*smooth((t-.97)/.38)+.22*smooth((t-1.37)/.28);r.stage.position.x=pushing?-.60*steps:.8+.19*smooth((t-.33)/.24)+.75*steps;}
 else r.stage.position.x=i*1.3;
 r.stage.updateMatrixWorld(true);const triangles=[];
 r.model.traverse(m=>{if(!m.isSkinnedMesh)return;m.skeleton.update();const a=m.geometry.attributes,groups=Object.keys(a).filter(n=>/^skinWeight/.test(n)).map(n=>({w:a[n],i:a[n.replace('Weight','Index')]})),verts=[];
  for(let v=0;v<a.position.count;v++){const p=new T.Vector3().fromBufferAttribute(a.position,v).applyMatrix4(m.bindMatrix),out=new T.Vector3();let sum=0;
   for(let j=0;j<groups.length*4;j++){const g=groups[Math.floor(j/4)],w=g.w.array[v*4+j%4],idx=g.i.array[v*4+j%4];if(w){sum+=w;out.addScaledVector(p.clone().applyMatrix4(new T.Matrix4().fromArray(m.skeleton.boneMatrices,idx*16)),w);}}
   if(!sum)out.copy(p);out.applyMatrix4(m.bindMatrixInverse).applyMatrix4(m.matrixWorld);verts.push([...out.toArray(),a.uv.getX(v),a.uv.getY(v)]);
  }const ix=m.geometry.index?.array||Array.from({length:verts.length},(_,j)=>j);for(const j of ix)triangles.push(...verts[j]);
 });fs.writeFileSync('/tmp/showcase-'+who+'.bin',Buffer.from(new Float32Array(triangles).buffer));
}
