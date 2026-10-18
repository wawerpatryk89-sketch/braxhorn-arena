import fs from 'node:fs';
import assert from 'node:assert/strict';
import {GLTFLoader} from '../game/assets/vendor/GLTFLoader.js';
import * as T from '../game/assets/vendor/three.module.js';
import {prepareMotionClips,createPoseSampler} from '../game/assets/krov-motion.js';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});globalThis.ProgressEvent=class{constructor(t,v){Object.assign(this,v)}};
const root='game/assets/krov3d/';const manifest=JSON.parse(fs.readFileSync(root+'model-manifest.json'));const b=Buffer.concat(Array.from({length:manifest.parts},(_,i)=>fs.readFileSync(root+'model-'+i+'.bin')));
const g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
g.animations.push(...JSON.parse(fs.readFileSync(root+'extra-motions.json')).map(c=>T.AnimationClip.parse(c)));
const original=JSON.stringify(g.animations.map(c=>T.AnimationClip.toJSON(c)));const clips=prepareMotionClips(g.animations);
assert.equal(JSON.stringify(g.animations.map(c=>T.AnimationClip.toJSON(c))),original,'Do not mutate supplied clips');
for(const name of ['Walking','Running','K_WALK_BACK'])for(const t of clips.get(name).tracks){const n=t.getValueSize();for(let j=0;j<n;j++)assert(Math.abs(t.values[j]-t.values[t.values.length-n+j])<1e-5,`${name}: seamless ${t.name}`);}
const spine=clips.get('Walking').tracks.find(t=>/Spine.quaternion$/.test(t.name));assert(spine.values.some((v,i)=>Math.abs(v-spine.values[i%4])>.001),'Walking spine must not be frozen');
const cfg=JSON.parse(fs.readFileSync(root+'config.json')).config,sampler=createPoseSampler(g.scene,clips),actor={},opponent={};const bones=[];g.scene.traverse(n=>{if(n.isBone)bones.push(n)});
const near=(a,b,label)=>assert(a.every((v,i)=>Math.abs(v-b[i])<1e-6),label);
const snapshot=()=>bones.flatMap(n=>[...n.position.toArray(),...n.quaternion.toArray()]);
sampler.pose(cfg.WALK_FORWARD,19,1,actor);const last=snapshot();sampler.pose(cfg.OVERHAND,0,1,actor);near(snapshot(),last,'Transition starts at the actual previous pose');
sampler.pose(cfg.OVERHAND,17,1,actor);const hit=snapshot();sampler.pose(cfg.OVERHAND,17,1);near(snapshot(),hit,'Full authored contact pose restored before active frame');
sampler.pose(cfg.IDLE,0,-1,opponent);assert.equal(g.scene.rotation.y,-Math.PI*80/180);
sampler.pose(cfg.OVERHAND,17,1,actor);near(snapshot(),hit,'Mirror opponent must not corrupt player pose');
let poses=0;for(const c of Object.values(cfg))for(let f=0;f<c.durations.length;f+=.5){sampler.pose(c,f,1);for(const n of bones){assert(n.matrixWorld.elements.every(Number.isFinite));assert(Math.abs(n.quaternion.length()-1)<.002);}poses++;}
const html=fs.readFileSync('game/index.html','utf8');assert(html.includes('.fighter.krov canvas,.fighter.krov.leftface canvas{transform:translateX(-50%)!important}'),'Canvas center matches logical root on both sides');
console.log(`PASS motion repair: ${poses} fractional poses; unmodified source; closed loops; live spine; continuous transition; contact pose; independent mirror actors; centered canvas`);
