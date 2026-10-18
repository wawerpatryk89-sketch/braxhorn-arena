import * as T from 'three';
import {rig,SIZE,WIDTH,GROUND,VIEW} from './fighter-source-core.js?v=internet-duel-125';
const pending=new Map(),metadata=new Map();let pairQueue=Promise.resolve();
export function prepareSource(who){if(!pending.has(who))pending.set(who,load(who).catch(e=>{pending.delete(who);throw e;}));return pending.get(who);}
async function json(url,gzip=false){
 try{
  const res=await fetch(url);if(!res.ok)throw Error('HTTP '+res.status);
  if(!gzip)return await res.json();
  const bytes=new Uint8Array(await res.arrayBuffer());
  const body=new Response(bytes);
  // HTTP servers may already decode Content-Encoding: gzip before exposing the body.
  return await (bytes[0]===31&&bytes[1]===139?new Response(body.body.pipeThrough(new DecompressionStream('gzip'))):body).json();
 }catch(error){throw Error('Odczyt '+url+': '+error.message);}
}
function preserveWeights(material,groups){
 material.onBeforeCompile=shader=>{
  let attributes='',matrices='',positions='',normals='',weightSum='skinWeight';
  for(let g=2;g<=groups;g++){
   attributes+=`attribute vec4 skinIndex${g}; attribute vec4 skinWeight${g};\n`;
   weightSum+=`+skinWeight${g}`;
   for(const component of ['x','y','z','w']){
    const bone=`extra${g}${component}`;
    matrices+=`mat4 ${bone}=getBoneMatrix(skinIndex${g}.${component});\n`;
    positions+=`skinned+=${bone}*skinVertex*skinWeight${g}.${component};\n`;
    normals+=`skinMatrix+=skinWeight${g}.${component}*${bone};\n`;
   }
  }
  shader.vertexShader=shader.vertexShader.replace('#include <skinning_pars_vertex>','#include <skinning_pars_vertex>\n'+attributes);
  shader.vertexShader=shader.vertexShader.replace('#include <skinbase_vertex>','#include <skinbase_vertex>\n'+matrices);
  shader.vertexShader=shader.vertexShader.replace('#include <skinning_vertex>',`vec4 skinVertex=bindMatrix*vec4(transformed,1.0);
   vec4 skinned=boneMatX*skinVertex*skinWeight.x+boneMatY*skinVertex*skinWeight.y+boneMatZ*skinVertex*skinWeight.z+boneMatW*skinVertex*skinWeight.w;
   ${positions}
   if(dot(${weightSum},vec4(1.0))<0.000001)skinned=skinVertex;
   transformed=(bindMatrixInverse*skinned).xyz;`);
  shader.vertexShader=shader.vertexShader.replace('#include <skinnormal_vertex>',`mat4 skinMatrix=skinWeight.x*boneMatX+skinWeight.y*boneMatY+skinWeight.z*boneMatZ+skinWeight.w*boneMatW;
   ${normals}
   if(dot(${weightSum},vec4(1.0))<0.000001)skinMatrix=mat4(1.0);
   skinMatrix=bindMatrixInverse*skinMatrix*bindMatrix;
   objectNormal=vec4(skinMatrix*vec4(objectNormal,0.0)).xyz;
   #ifdef USE_TANGENT
   objectTangent=vec4(skinMatrix*vec4(objectTangent,0.0)).xyz;
   #endif`);
 };
 material.customProgramCacheKey=()=> 'original-influences-'+groups*4;
}
export function prepareMetadata(who){if(!metadata.has(who))metadata.set(who,json('/assets/'+who.toLowerCase()+'-new/config.json?v='+(window.BRAX_COMPAT?.configs||'azrak-146')).then(config=>{const frames={};for(const c of Object.values(config))frames[c.asset]={w:WIDTH,h:SIZE,frames:c.durations.map(duration=>({duration}))};return{config,frames,ready:false,render(){}};}).catch(e=>{metadata.delete(who);throw e;}));return metadata.get(who);}
export function preparePair(names){const request=[...names];const task=pairQueue.then(()=>loadPair(request));pairQueue=task.catch(()=>{});return task;}
async function loadPair(names){
 const needed=new Set(names.filter(Boolean));
 for(const who of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON']){const key=who+'_3D',current=window[key];if(current?.ready&&!needed.has(who)){current.dispose();window[key]=await prepareMetadata(who);}}
 await Promise.all(['BRAX','NYXA'].map(async who=>{if(!window[who+'_3D'])window[who+'_3D']=await prepareMetadata(who);}));
 // Keep at most one model upload in flight to limit peak memory and avoid racing pair disposal.
 for(const who of needed)if(!window[who+'_3D']?.ready){window[who+'_3D']?.dispose?.();window[who+'_3D']=await prepareSource(who);}
}
async function load(who){
 const base='/assets/'+who.toLowerCase()+'-new/';const url=n=>base+n+'?v=internet-duel-125';const[modelData,raw,meta]=await Promise.all([json(url('model.json.gz'),true),json(url('clips.json.gz'),true),prepareMetadata(who)]);
 const config=meta.config;const r=rig(new T.ObjectLoader().parse(modelData),raw,who),loader=new T.TextureLoader(),owned=new Set();let disposed=false;
 const keep=x=>{owned.add(x);return x;};const clean=()=>{if(disposed)return;disposed=true;r.mixer.stopAllAction();r.model.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.skeleton?.dispose?.();}});for(const item of owned)item.dispose();};
 try{
 const maps=await Promise.allSettled(['color','normal','metalness','roughness'].map(n=>loader.loadAsync(url(n+'.webp')).then(keep)));const failed=maps.find(x=>x.status==='rejected');if(failed)throw failed.reason;
 const[color,normal,metalness,roughness]=maps.map(x=>x.value);color.colorSpace=T.SRGBColorSpace;
 for(const t of[color,normal,metalness,roughness]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=2;}
 const mat=new T.MeshStandardMaterial({map:color,normalMap:normal,metalnessMap:metalness,roughnessMap:roughness,metalness:1,roughness:1});let groups=2;keep(mat);r.model.traverse(o=>{if(o.isMesh)groups=Math.max(groups,Object.keys(o.geometry.attributes).filter(n=>/^skinWeight/.test(n)).length);});preserveWeights(mat,groups);
 r.model.traverse(o=>{if(o.isMesh){o.material=mat;o.frustumCulled=false;}});
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:false});keep(renderer);renderer.setSize(WIDTH,SIZE);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1.05;
 // Neutral studio illumination keeps the supplied material colours and reveals dark clothing.
 const scene=new T.Scene();scene.add(r.stage);scene.add(new T.HemisphereLight(0xffffff,0x555555,.85));
 const light=new T.DirectionalLight(0xffffff,2.6);light.position.set(-2,4,5);scene.add(light);
 const fill=new T.DirectionalLight(0xffffff,1.1);fill.position.set(3,2,4);scene.add(fill);
 const rim=new T.DirectionalLight(0xffffff,1.5);rim.position.set(0,3,-4);scene.add(rim);
 // A small prefiltered studio environment supplies the reflections missing from metallic texels.
 const studio=new T.Scene();studio.background=new T.Color(.18,.18,.18);
 const panels=[];for(const [x,y,z,w,h,power] of [[-3,3,4,3,4,3],[4,2,1,2,3,1.5],[0,4,-3,3,2,2]]){const geometry=keep(new T.PlaneGeometry(w,h)),material=keep(new T.MeshBasicMaterial({color:new T.Color().setScalar(power),side:T.DoubleSide})),panel=new T.Mesh(geometry,material);panel.position.set(x,y,z);panel.lookAt(0,1,0);studio.add(panel);panels.push(panel);}
 const pmrem=keep(new T.PMREMGenerator(renderer));let environment=keep(pmrem.fromScene(studio,.04,.1,30));scene.environment=environment.texture;scene.environmentIntensity=.35;pmrem.dispose();owned.delete(pmrem);
 for(const t of[color,normal,metalness,roughness]){t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;}

 const frames={};for(const c of Object.values(config))frames[c.asset]={w:WIDTH,h:SIZE,frames:c.durations.map(duration=>({duration}))};
 let actorStates=new WeakMap(),lost=false;
 const notify=(type)=>window.dispatchEvent(new CustomEvent(type,{detail:{character:who}}));
 const onLost=e=>{e.preventDefault();lost=true;notify('brax-context-lost');};
 const onRestored=()=>{if(disposed)return;owned.delete(environment);environment.dispose();const generator=new T.PMREMGenerator(renderer);try{environment=keep(generator.fromScene(studio,.04,.1,30));scene.environment=environment.texture;actorStates=new WeakMap();lost=false;notify('brax-context-restored');}finally{generator.dispose();}};
 renderer.domElement.addEventListener('webglcontextlost',onLost);renderer.domElement.addEventListener('webglcontextrestored',onRestored);
 const bones=Object.values(r.bones),fromQ=new T.Quaternion(),fromP=new T.Vector3();
 return{config,frames,get ready(){return !lost&&!disposed;},dispose(){if(disposed)return;pending.delete(who);if(lost)notify('brax-context-disposed');renderer.domElement.removeEventListener('webglcontextlost',onLost);renderer.domElement.removeEventListener('webglcontextrestored',onRestored);clean();renderer.forceContextLoss();},portrait(){r.pose({...config.IDLE,stageYaw:0},0,1);renderer.render(scene,r.camera);return renderer.domElement.toDataURL('image/png');},sourceClips:Object.keys(raw),reset(ctx){actorStates.delete(ctx);},render(ctx,c,f,face=1,clock=0){
  if(lost||disposed)return;
  let state=actorStates.get(ctx);if(state&&state.asset===c.asset&&state.transitionKey===(c.transitionKey||null)&&state.frame===f&&state.face===face&&(!(state.from||state.turning)||state.lastClock===clock))return;
  const t=Math.min(c.durations.length-1,Math.max(0,f))*c.durations[0]/1000;r.pose(c,t,face);const targetYaw=r.stage.rotation.y;
  if(!state){state={asset:c.asset,transitionKey:c.transitionKey||null,pose:new Float32Array(bones.length*7)};actorStates.set(ctx,state);}
  else if(state.asset!==c.asset||state.transitionKey!==(c.transitionKey||null)){state.fromYaw=state.yaw??targetYaw;state.turnAt=clock;state.turning=!!(c.faceCamera||state.faceCamera);state.asset=c.asset;state.transitionKey=c.transitionKey||null;state.changed=clock;state.from=state.pose.slice();}
  if(state.from){const weight=Math.min(1,Math.max(0,(clock-state.changed)/(c.transitionMs||80)));for(let i=0;i<bones.length;i++){const b=bones[i],at=i*7;b.quaternion.slerp(fromQ.fromArray(state.from,at+3),1-weight);b.position.lerp(fromP.fromArray(state.from,at),1-weight);}if(weight===1)state.from=null;r.stage.updateMatrixWorld(true);}
  if(c.mutualContact){state.turning=false;r.stage.rotation.y=targetYaw;r.stage.updateMatrixWorld(true);}
  if(state.turning){const u=Math.min(1,Math.max(0,(clock-state.turnAt)/300)),w=u*u*(3-2*u),delta=Math.atan2(Math.sin(targetYaw-state.fromYaw),Math.cos(targetYaw-state.fromYaw));r.stage.rotation.y=state.fromYaw+delta*w;if(u===1)state.turning=false;r.stage.updateMatrixWorld(true);}state.yaw=r.stage.rotation.y;state.faceCamera=!!c.faceCamera;
  for(let i=0;i<bones.length;i++){bones[i].position.toArray(state.pose,i*7);bones[i].quaternion.toArray(state.pose,i*7+3);}state.frame=f;state.face=face;state.lastClock=clock;
  renderer.render(scene,r.camera);ctx.clearRect(0,0,WIDTH,SIZE);ctx.save();
  // The engine mirrors the canvas; cancel that mirror after physically rotating the model.
  if(face<0){ctx.translate(WIDTH,0);ctx.scale(-1,1);}ctx.drawImage(renderer.domElement,0,0);ctx.restore();
 }};
 }catch(error){clean();throw error;}
}
