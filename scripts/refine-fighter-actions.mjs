import fs from 'node:fs';
import zlib from 'node:zlib';
import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';
const read=p=>JSON.parse(zlib.gunzipSync(fs.readFileSync(p)));
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY'];
const report=[];
for(const who of names){
 const dir='game/assets/'+who.toLowerCase()+'-new/',raw=read(dir+'clips.json.gz'),source=read('source-assets/'+who.toLowerCase()+'/clips-all.json.gz'),cfg=JSON.parse(fs.readFileSync(dir+'config.json')),changed=[];
 const model=new T.ObjectLoader().parse(read(dir+'model.json.gz'));
 const add=(name,clip,extra={})=>{raw[clip]??=source[clip];if(!raw[clip])throw Error('Missing supplied clip '+clip);const c=cfg[name]={asset:who+'_REFINED_'+name,character:who,label:clip,clip,sourceVersion:'fighter-refinement-121',attack:false,gain:0,cost:0,w:1024,h:640,scale:cfg.IDLE.scale,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1.5,duration:raw[clip].duration,transitionMs:90,lockPlanarRoot:true,...extra};changed.push(c);return c;};
 if(who==='NYXA'){
  // A real head jab from the user's Danny pack, adapted to Nyxa's bind pose.
  // Keep the existing body hook, elbows, knees, kicks and combo.
  const donor=new T.ObjectLoader().parse(read('game/assets/danny-new/model.json.gz'));
  const map=m=>{const out={};m.traverse(b=>{if(b.isBone)out[b.name.replace(/^mixamorig/,'')]=b;});return out;};
  const from=map(donor),to=map(model),axis=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2),inv=axis.clone().invert();
  const ratio=(to.LeftLeg.position.length()+to.LeftFoot.position.length())/(from.LeftLeg.position.length()+from.LeftFoot.position.length());
  const clip=T.AnimationClip.parse(read('source-assets/danny/clips-all.json.gz')['Lead Jab']);
  for(const tr of clip.tracks){const [n,kind]=tr.name.split('.'),key=n.replace(/^mixamorig/,'');if(!to[key]||!from[key])throw Error('Retarget bone '+key);
   if(kind==='quaternion'){const q=to[key].quaternion.clone().multiply(from[key].quaternion.clone().invert());if(key==='Hips')q.premultiply(inv).multiply(axis);for(let i=0;i<tr.values.length;i+=4)new T.Quaternion().fromArray(tr.values,i).premultiply(q).normalize().toArray(tr.values,i);}
   if(kind==='position'){if(key!=='Hips')throw Error('Unexpected bone translation');const a=from.Hips.position.clone().applyQuaternion(inv),b=to.Hips.position.clone().applyQuaternion(inv);for(let i=0;i<tr.values.length;i+=3)new T.Vector3().fromArray(tr.values,i).sub(a).multiplyScalar(ratio).add(b).toArray(tr.values,i);}
  }
  clip.name='Nyxa Head Jab';raw[clip.name]=T.AnimationClip.toJSON(clip);
  const donorCfg=JSON.parse(fs.readFileSync('game/assets/danny-new/config.json')).LIGHT_PUNCH;
  const hits=Object.entries(donorCfg.hits),groups=[...new Set(hits.map(([,h])=>h.group))];
  const contacts=groups.map(g=>{const rows=hits.filter(([,h])=>h.group===g),middle=rows[Math.floor(rows.length/2)];return [+middle[0]*donorCfg.durations[0]/1000,middle[1].bone,7];});
  add('LIGHT_PUNCH',clip.name,{label:'Lewy prosty w głowę',attack:true,gain:10,playbackRate:1.55,headPunch:{side:'Left',lift:.18,from:.12,peak:.36,end:.54,to:.85},contacts});
  cfg.HEAVY_PUNCH.label='Sierpowy w korpus';
 }
 if(!cfg.BACKFLIP&&!cfg.BACK_ROLL){
  const clip=who==='DANNY'?'Running Backward':cfg.WALK_BACK.clip;
  const duration=Math.min(source[clip]?.duration||raw[clip].duration,who==='DANNY'?.633:.8);
  add('QUICK_BACK',clip,{label:who==='KROV'?'Krótki odskok w gardzie':who==='VEXA'?'Szybkie wycofanie':'Szybki krok w tył',duration,playbackRate:who==='KROV'?1.7:2,retreat:{from:.04,to:duration-.06,height:{KROV:.38,NYXA:.48,VEXA:.58,DANNY:.52}[who]}});
 }
 if(who==='DANNY')add('ACROBATIC_PUNCH','Back Flip To Uppercut',{label:'Salto z podbródkowym',attack:true,gain:10,start:0,duration:3.55,playbackRate:1.9,contacts:[[2.93,'RightHand',15]],advance:{from:2.1,to:2.85,px:65}});
 const r=rig(model,raw,who);
 for(const c of changed){
  const n=Math.ceil(c.duration*60),step=c.duration/n;c.durations=Array(n).fill(step*1000);c.hits={};c.boxes=[];c.hurtCapsules=[];c.pushCenters=[];c.footY=[];
  for(let i=0;i<n;i++){r.pose(c,i*step);const pts=Object.keys(r.bones).map(b=>r.point(b));c.boxes.push([Math.min(...pts.map(p=>p[0]))-25,Math.min(...pts.map(p=>p[1]))-45,Math.max(...pts.map(p=>p[0]))+25,Math.max(...pts.map(p=>p[1]))+20]);c.footY.push(550);c.pushCenters.push([r.point('Hips')[0],40]);c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
   for(const [group,[time,bone,damage]] of (c.contacts||[]).entries())if(Math.abs(i*step-time)<=.075){const p=r.point(bone),radius=19;c.hits[i]={box:[p[0]-radius,p[1]-radius,radius*2,radius*2],bone,damage,group};}
  }
  c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];
  if(c.attack){const keys=Object.keys(c.hits).map(Number);if(!keys.length)throw Error('No contacts');c.attackRangePx=Math.max(90,...Object.values(c.hits).map(h=>h.box[0]+h.box[2]-512));if(c!==cfg.ACROBATIC_PUNCH)c.phaseTempo={first:Math.min(...keys),last:Math.max(...keys),startup:1,recovery:1.5};}
  delete c.contacts;
 }
 cfg.COMBO.label={BRAX:'Seria pięści zakończona kopnięciem',NYXA:'Pięści, łokcie i martelo z ziemi',VEXA:'Pięści, kopnięcie okrężne, obrót i kopnięcie z wyskoku',KROV:'Proste, łokcie i podbródkowy',NINA:'Dwa proste, chapa i armada',DANNY:'Boks, sierp, low kick i kopnięcie boczne'}[who];
 const back=cfg.BACKFLIP||cfg.BACK_ROLL||cfg.QUICK_BACK;
 report.push({fighter:who,changed:changed.map(c=>c.label),retreat:back.label,combo:cfg.COMBO.label,throw:!!cfg.THROW_ATTACKER,preserved:'All other authored actions, meshes and textures'});
 fs.writeFileSync(dir+'config.json',JSON.stringify(cfg));fs.writeFileSync(dir+'clips.json.gz',zlib.gzipSync(JSON.stringify(raw),{level:9}));const manifest=JSON.parse(fs.readFileSync(dir+'manifest.json'));manifest.clips=Object.keys(raw);fs.writeFileSync(dir+'manifest.json',JSON.stringify(manifest));
}
fs.writeFileSync('docs/fighter-refinement-121.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
