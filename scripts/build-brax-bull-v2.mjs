// BULL BREAKER V2 — reproducible authored-clip compiler (BRAX only).
// Run in an intact project checkout with original fighter-package LFS files:
//   node scripts/build-brax-bull-v2.mjs --apply
// Never fabricate source motion or overwrite the underlying rig or textures.
import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';

const APPLY=process.argv.includes('--apply');
const ROOT='game/assets/';
const readGz=p=>JSON.parse(zlib.gunzipSync(fs.readFileSync(p)));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const original={};
const staged=[];
const write=(p,data)=>{staged.push({path:p,bytes:data});};
const specs=[
 {action:'LIGHT_PUNCH',wanted:'Jab Cross (1)',lead:.19,tail:.18,damage:6,region:'head',tag:'HEAD_SNAP'},
 {action:'HEAVY_PUNCH',wanted:'Hook',lead:.25,tail:.23,damage:8,region:'body',tag:'RIB_CRUSH'},
 {action:'LIGHT_KICK',wanted:'Mma Kick (1)',lead:.24,tail:.25,damage:8,region:'body',tag:'SIDE_STAGGER'},
 {action:'UPPERCUT',wanted:'Uppercut Jab',lead:.28,tail:.32,damage:9,region:'head',tag:'LAUNCH'},
 {action:'HEAVY_KICK',wanted:'Brax Side Kick',lead:.31,tail:.30,damage:15,region:'body',tag:'BULL_FINISH'}
];
const capsuleTemplate=[
 ['head','Neck','Head',26],['body','Spine2','Hips',32],
 ['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],
 ['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]
];
const finite=(list,context)=>{assert(list.every(Number.isFinite),'Non-finite '+context);return list;};
function sampleMeta(r,c){
 const frames=c.durations.length,period=c.durations[0]/1000;
 c.boxes=[];c.hurtCapsules=[];c.pushCenters=[];c.footY=[];
 for(let i=0;i<frames;i++){
  r.pose(c,i*period);
  const points=Object.keys(r.bones).map(b=>r.point(b));
  assert(points.length>40&&points.every(x=>x.every(Number.isFinite)),'invalid rig '+c.asset);
  c.boxes.push(finite([Math.min(...points.map(p=>p[0]))-25,Math.min(...points.map(p=>p[1]))-45,Math.max(...points.map(p=>p[0]))+25,Math.max(...points.map(p=>p[1]))+20],c.asset));
  c.pushCenters.push([r.point('Hips')[0],40]);
  c.footY.push(550);
  c.hurtCapsules.push(capsuleTemplate.map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
 }
 c.union=[Math.min(...c.boxes.map(p=>p[0])),Math.min(...c.boxes.map(p=>p[1])),Math.max(...c.boxes.map(p=>p[2])),Math.max(...c.boxes.map(p=>p[3]))];
}
function measuredStage(cfg,raw,spec){
 const c=cfg[spec.action];
 assert(c&&c.attack&&c.clip===spec.wanted,'missing approved '+spec.action+' / '+spec.wanted);
 const marks=Object.entries(c.hits||{}).filter(([,hit])=>hit.group===0);
 assert(marks.length,'no measurable contact: '+spec.action);
 const frames=marks.map(([f])=>Number(f)).sort((a,b)=>a-b);
 const pivot=frames[Math.floor(frames.length/2)],hit=c.hits[String(pivot)];
 assert(hit&&runnableBone(hit.bone)&&Number.isFinite(hit.damage),'invalid source contact '+spec.action);
 const sourceTime=(c.start||0)+pivot*c.durations[0]/1000,clipEnd=raw[c.clip]?.duration;
 assert(Number.isFinite(clipEnd)&&clipEnd>=sourceTime,'source clip truncated '+c.clip);
 const start=Math.max(0,sourceTime-spec.lead),end=Math.min(clipEnd,sourceTime+spec.tail),duration=end-start;
 assert(duration>.25,'contact segment too short '+spec.action);
 return {...spec,clip:c.clip,sourceAsset:c.asset,sourceClipFrames:frames,pivot,sourceTime,start,duration,bone:hit.bone};
}
function runnableBone(name){return /^(?:Left|Right)(?:Hand|Foot|Arm|ForeArm|Leg|ToeBase|UpLeg)$/.test(name);}
function buildBrax(){
 const dir=ROOT+'brax-new/',configPath=dir+'config.json',clipsPath=dir+'clips.json.gz';
 const cfg=JSON.parse(fs.readFileSync(configPath,'utf8')),raw=readGz(clipsPath);
 original.configSHA256=hash(fs.readFileSync(configPath));
 original.clipsSHA256=hash(fs.readFileSync(clipsPath));
 original.modelSHA256=hash(fs.readFileSync(dir+'model.json.gz'));
 const rokoko=readGz('source-assets/brax-bull-v2/rokoko-jump.json.gz');
 assert(rokoko.BRAX_ROKOKO_JUMP,'verified Rokoko jump clip missing from source');
 assert(!raw.BRAX_ROKOKO_JUMP||JSON.stringify(raw.BRAX_ROKOKO_JUMP)===JSON.stringify(rokoko.BRAX_ROKOKO_JUMP),'jump collision');
 raw.BRAX_ROKOKO_JUMP=rokoko.BRAX_ROKOKO_JUMP;
 const oldModel=JSON.parse(JSON.stringify(cfg));
 const r=rig(new T.ObjectLoader().parse(readGz(dir+'model.json.gz')),raw,'BRAX');
 const steps=specs.map(spec=>measuredStage(cfg,raw,spec));
 const jumpDuration=.56;
 const segments=[],landmarks=[];
 let elapsed=0;
 for(const [i,step] of steps.entries()){
  if(i===4){
   segments.push({clip:'BRAX_ROKOKO_JUMP',start:.05,duration:jumpDuration,blend:.075});
   landmarks.push({kind:'jump',from:Math.round(elapsed*60),to:Math.round((elapsed+jumpDuration)*60)});
   elapsed+=jumpDuration;
  }
  segments.push({clip:step.clip,start:step.start,duration:step.duration,blend:.075});
  const contactTime=elapsed+(step.sourceTime-step.start);
  landmarks.push({kind:'hit',group:i,from:Math.round(elapsed*60),to:Math.round((elapsed+step.duration)*60),contact:Math.round(contactTime*60),bone:step.bone,region:step.region,tag:step.tag,damage:step.damage,source:step.action,clip:step.clip,startSeconds:step.start,endSeconds:step.start+step.duration});
  elapsed+=step.duration;
 }
 const c=structuredClone(cfg.COMBO);
 Object.assign(c,{
  asset:'BRAX_NEW_BULL_BREAKER_V2',label:'BULL BREAKER V2',
  clip:segments[0].clip,sourceVersion:'bull-breaker-v2-20261020',
  attack:true,model3d:true,lockPlanarRoot:true,plantFeet:false,
  sequence:segments,duration:elapsed,playbackRate:1.17,transitionMs:75,
  comboGapPx:135,finisherGroup:4,bullBreakerV2:true,
  bullSteps:landmarks
 });
 for(const key of ['guardLoop','gaitBlend','phaseTempo','freeze','contacts','reactionBlend','headPunch'])delete c[key];
 const frames=Math.ceil(elapsed*60),dt=elapsed/frames;c.durations=Array(frames).fill(dt*1000);
 c.hits={};sampleMeta(r,c);
 const claims=[];
 for(const stage of landmarks.filter(s=>s.kind==='hit')){
  let coverage=0;
  for(let f=Math.max(stage.from+1,stage.contact-5);f<=Math.min(stage.to-2,stage.contact+5);f++){
   if(f<0||f>=frames)continue;
   r.pose(c,f*dt);const p=r.point(stage.bone);
   const radius=/Foot|ToeBase/.test(stage.bone)?26:22;
   c.hits[f]={box:[p[0]-radius,p[1]-radius,radius*2,radius*2],bone:stage.bone,damage:stage.damage,group:stage.group};
   coverage++;
  }
  assert(coverage>=3,'missing contact window '+stage.tag);
  claims.push({group:stage.group,frame:stage.contact,windowFrames:coverage,clip:stage.clip,range:[stage.startSeconds,stage.endSeconds],bone:stage.bone,damage:stage.damage,target:stage.region});
 }
 const damage=claims.reduce((n,s)=>n+s.damage,0);
 assert.equal(damage,46,'combo balance changed unexpectedly');
 assert.equal(new Set(claims.map(c=>c.group)).size,5);
 cfg.COMBO=c;
 // Retain each original slot without any modifications except COMBO itself.
 for(const key of Object.keys(oldModel))if(key!=='COMBO')assert.deepEqual(cfg[key],oldModel[key],'non-combo BRAX state modified '+key);
 write(configPath,Buffer.from(JSON.stringify(cfg)));
 write(clipsPath,zlib.gzipSync(Buffer.from(JSON.stringify(raw)),{level:9}));
 return{asset:c.asset,original,durationSeconds:elapsed,frames,hits:claims,totalDamage:damage,segments,jumpClipSha256:hash(fs.readFileSync('source-assets/brax-bull-v2/rokoko-jump.json.gz'))};
}
function buildAnger(who){
 const dir=ROOT+who.toLowerCase()+'-new/',configPath=dir+'config.json';
 const cfg=JSON.parse(fs.readFileSync(configPath,'utf8'));
 const down=cfg.FLY_DOWN||cfg.DOWN;
 assert(down&&cfg.GETUP,'missing down/get-up on '+who);
 assert(down.freeze&&down.clip,'down pose is not a measured frozen source: '+who);
 const r=rig(new T.ObjectLoader().parse(readGz(dir+'model.json.gz')),readGz(dir+'clips.json.gz'),who);
 const c=structuredClone(down);
 Object.assign(c,{asset:who+'_BULL_ANGER',label:'Wściekłość po BULL BREAKER',
  sourceVersion:'bull-breaker-v2-20261020',groundAnger:true,
  duration:.65,playbackRate:1,transitionMs:75,attack:false,freeze:true});
 for(const k of ['contacts','sequence','phaseTempo','guardLoop','gaitBlend','reactionBlend'])delete c[k];
 c.durations=Array(39).fill(1000/60);c.hits={};
 sampleMeta(r,c);
 cfg.BULL_ANGER=c;
 write(configPath,Buffer.from(JSON.stringify(cfg)));
 return{fighter:who,clip:c.clip,frames:c.durations.length,bones:Object.keys(r.bones).length};
}
const summary={version:'BULL BREAKER V2',baseline:'main',brax:buildBrax(),victimAnger:[]};
for(const who of ['NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'])
 summary.victimAnger.push(buildAnger(who));
summary.victimAnger.unshift({fighter:'BRAX',source:'existing original BRAX config; may be used as the receiver'});
const report='docs/verification/brax-bull-v2-build.json';
write(report,Buffer.from(JSON.stringify(summary,null,2)+'\n'));
if(!APPLY){
 console.log(JSON.stringify({dryRun:true,summary,staged:staged.map(x=>({path:x.path,size:x.bytes.length}))},null,2));
}else{
 for(const {path,bytes}of staged){fs.mkdirSync(path.slice(0,path.lastIndexOf('/')),{recursive:true});fs.writeFileSync(path,bytes);}
 console.log(JSON.stringify({ok:true,files:staged.map(x=>x.path),summary},null,2));
}
