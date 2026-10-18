import fs from 'node:fs';
import zlib from 'node:zlib';
import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';
const dir='game/assets/brax-new/';
const raw=JSON.parse(zlib.gunzipSync(fs.readFileSync('source-assets/brax/clips-all.json.gz')));
const cfg=JSON.parse(fs.readFileSync(dir+'config.json'));
const r=rig(new T.ObjectLoader().parse(JSON.parse(zlib.gunzipSync(fs.readFileSync(dir+'model.json.gz')))),raw,'BRAX');
// The original Brax Idle keeps his head directed at the opponent. Do not correct
// his neck procedurally or borrow another fighter's posture.
Object.assign(cfg.IDLE,{clip:'Idle',label:'Postawa Braxa',start:0,freeze:false,duration:raw.Idle.duration,guardLoop:{start:0,end:raw.Idle.duration,blend:.10},transitionMs:130});
// The supplied walk stays continuous at both long and short distance.
Object.assign(cfg.WALK_FORWARD,{...cfg.APPROACH,asset:'BRAX_NEW_WALK_FORWARD'});
delete cfg.WALK_FORWARD.gaitBlend;
delete cfg.WALK_BACK.gaitBlend;
cfg.WALK_BACK.gaitRate=1.15;
for(const state of ['IDLE','WALK_FORWARD','WALK_BACK']){
 const c=cfg[state],count=Math.ceil(c.duration*60),dt=c.duration/count;
 c.durations=Array(count).fill(dt*1000);c.boxes=[];c.hurtCapsules=[];c.footY=[];c.pushCenters=[];
 for(let i=0;i<count;i++){
  r.pose(c,i*dt);const p=Object.keys(r.bones).map(n=>r.point(n));
  c.boxes.push([Math.min(...p.map(v=>v[0]))-25,Math.min(...p.map(v=>v[1]))-45,Math.max(...p.map(v=>v[0]))+25,Math.max(...p.map(v=>v[1]))+20]);c.footY.push(550);c.pushCenters.push([r.point('Hips')[0],42]);
  c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
 }
 c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];
}
fs.writeFileSync(dir+'config.json',JSON.stringify(cfg));
console.log('Brax: own Idle; full forward walk; original backward step without static guard blend.');
