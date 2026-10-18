import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import * as T from 'three';import {rig} from '../game/assets/fighter-source-core.js';
const results=[];
for(const who of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY']){
 const base='game/assets/'+who.toLowerCase()+'-new/',read=f=>JSON.parse(zlib.gunzipSync(fs.readFileSync(base+f))),r=rig(new T.ObjectLoader().parse(read('model.json.gz')),read('clips.json.gz'),who),cfg=JSON.parse(fs.readFileSync(base+'config.json'));
 let contacts=0,maxCentreError=0;for(const c of new Map(Object.values(cfg).filter(c=>c.attack).map(c=>[c.asset,c])).values())for(const [frame,hit] of Object.entries(c.hits)){
  r.pose(c,frame*c.durations[0]/1000);const p=r.point(hit.bone),error=Math.hypot(p[0]-hit.box[0]-hit.box[2]/2,p[1]-hit.box[1]-hit.box[3]/2);maxCentreError=Math.max(maxCentreError,error);contacts++;
 }
 const samples=[];for(let t=0;t<cfg.IDLE.duration;t+=1/60){r.pose(cfg.IDLE,t);samples.push(['LeftFoot','RightFoot'].map(n=>r.point(n)));}
 const idleFootTravelPx=[0,1].map(i=>Math.max(...samples.map(s=>s[i][0]))-Math.min(...samples.map(s=>s[i][0])));
 results.push({who,contacts,maxCentreError,idleFootTravelPx,idleClip:cfg.IDLE.clip});
 assert(maxCentreError<.001,'hit centres must follow actual authored source bones '+who);
}
console.log(JSON.stringify({pass:true,scope:'numeric source rig and hitbox centres; not rendered skin/contact or device QA',results},null,2));
