import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';import * as T from 'three';import{rig}from'../game/assets/fighter-source-core.js';
for(const who of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY']){
 const d='game/assets/'+who.toLowerCase()+'-new/',read=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync(d+n))),raw=read('clips.json.gz'),cfg=JSON.parse(fs.readFileSync(d+'config.json')),old=JSON.parse(execFileSync('git',['show','HEAD:'+d+'config.json'],{maxBuffer:20e6}));
 for(const [k,c]of Object.entries(old))if(!k.startsWith('CONTACT_')&&k!=='BLOCK_LOW')assert.deepEqual(cfg[k],c,'unrelated action changed '+who+'/'+k);
 const r=rig(new T.ObjectLoader().parse(read('model.json.gz')),raw,who);let maxStep=0;
 for(const name of ['CONTACT_PUSH','CONTACT_RECEIVE','CONTACT_FALL'])for(const face of [-1,1]){let prev=null;
 for(let i=0;i<=Math.floor(cfg[name].duration*60);i++){r.pose(cfg[name],i/60,face);const points=['Head','Hips','LeftHand','RightHand','LeftFoot','RightFoot'].map(n=>r.bones[n].getWorldPosition(new T.Vector3()));for(const p of points)assert(p.toArray().every(Number.isFinite));if(prev){const d=Math.max(...points.map((p,j)=>p.distanceTo(prev[j])));assert(d<(name==='CONTACT_FALL'?.4:.22),who+'/'+name+' pose discontinuity '+d);if(d>maxStep){maxStep=d;var worst={name,t:i/60};}}prev=points;}
 }console.log(JSON.stringify({who,maxJointStep:maxStep,worst,unchangedOtherActions:true}));
}
