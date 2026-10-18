import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import * as T from 'three';
import {rig} from '../game/assets/fighter-source-core.js';

// Change the greeting only. The original Mixamo clips and combat moves stay intact.
const base='game/assets/krov-new/';
const read=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(base+n)));
const raw=read('clips.json.gz'),cfg=JSON.parse(fs.readFileSync(base+'config.json'));
const before=JSON.stringify({...cfg,INTRO:null});
const r=rig(new T.ObjectLoader().parse(read('model.json.gz')),raw,'KROV');
const clips=['Jab Cross','Hook Punch','Uppercut'];
const c={...cfg.INTRO,clip:clips[0],label:'Seria ciosów na powitanie',attack:false,gain:0,cost:0,start:0,
 sequence:clips.map((clip,i)=>({clip,start:0,duration:raw[clip].duration,...(i?{blend:.12}:{})})),
 duration:clips.reduce((n,clip)=>n+raw[clip].duration,0),playbackRate:1.5,transitionMs:120,
 lockPlanarRoot:true,stageYaw:Math.PI/2,hits:{},boxes:[],hurtCapsules:[],pushCenters:[],footY:[]};
const frames=Math.ceil(c.duration*60),dt=c.duration/frames;
c.durations=Array(frames).fill(dt*1000);
for(let i=0;i<frames;i++){
 r.pose(c,i*dt);const points=Object.keys(r.bones).map(n=>r.point(n));
 const box=[Math.min(...points.map(p=>p[0]))-25,Math.min(...points.map(p=>p[1]))-45,Math.max(...points.map(p=>p[0]))+25,Math.max(...points.map(p=>p[1]))+20];
 assert(box.every(Number.isFinite));c.boxes.push(box);c.footY.push(c.anchorY);c.pushCenters.push([r.point('Hips')[0],40]);
 c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
}
c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];
cfg.INTRO=c;
assert.equal(JSON.stringify({...cfg,INTRO:null}),before);
fs.writeFileSync(base+'config.json',JSON.stringify(cfg));
console.log('Krov greeting: original Jab Cross → Hook Punch → Uppercut; all other actions unchanged.');
