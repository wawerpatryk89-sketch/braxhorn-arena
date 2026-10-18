import assert from 'node:assert/strict';import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';import {rig} from '../game/assets/fighter-source-core.js';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
for(const who of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY']){
const d='game/assets/'+who.toLowerCase()+'-new/',read=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(d+n))),raw=read('clips.json.gz'),cfg=JSON.parse(fs.readFileSync(d+'config.json'));const r=rig(new T.ObjectLoader().parse(read('model.json.gz')),raw,who);
for(const role of ['PUSH','RECEIVE']){const c=cfg['CONTACT_'+role],distance=role==='RECEIVE'?.94:.6;let maxError=0,maxLift=0,maxJump=0,prev=null;
r.pose({...cfg.IDLE,lockPlanarRoot:true},0);const feet=Object.fromEntries(['Left','Right'].map(s=>[s,r.bones[s+'Foot'].getWorldPosition(new T.Vector3())]));
for(let i=0;i<=90;i++){const t=i/60;r.pose(c,t);const steps=(.42*smooth((t-.28)/.3)+.36*smooth((t-.60)/.3)+.22*smooth((t-.94)/.28));const retreat=role==='RECEIVE'?.19*smooth((t-.12)/.16)+.75*steps:.60*steps;let pos=[];for(const s of ['Left','Right']){const u1=smooth((t-.28)/.3),u2=smooth((t-.60)/.3),u3=smooth((t-.94)/.28);const expected=feet[s].x-distance*(s==='Left'?.65*u1+.35*u3:u2);const p=r.bones[s+'Foot'].getWorldPosition(new T.Vector3());maxError=Math.max(maxError,Math.abs(p.x-retreat-expected));maxLift=Math.max(maxLift,p.y-feet[s].y);pos.push(p);}
if(prev)maxJump=Math.max(maxJump,...pos.map((p,j)=>p.distanceTo(prev[j])));prev=pos;
}assert(maxError<.012,'support foot slips more than 12 mm');assert(maxLift>.10&&maxLift<.13,'missing recovery step lift');assert(maxJump<.06,'discontinuous foot motion');console.log({who,role,maxError,maxLift,maxJump});}}
