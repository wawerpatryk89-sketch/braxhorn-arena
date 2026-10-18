import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {GLTFLoader} from '../game/assets/vendor/GLTFLoader.js';
import * as THREE from '../game/assets/vendor/three.module.js';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});globalThis.ProgressEvent=class{constructor(type,values){Object.assign(this,values);}};
const root='game/assets/krov3d/',manifest=JSON.parse(fs.readFileSync(root+'model-manifest.json')),data=JSON.parse(fs.readFileSync(root+'config.json')),parts=Array.from({length:manifest.parts},(_,i)=>fs.readFileSync(root+`model-${i}.bin`)),buffer=Buffer.concat(parts);
assert.equal(buffer.length,manifest.bytes);assert.equal(crypto.createHash('sha256').update(buffer).digest('hex'),manifest.sha256);
const gltf=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');gltf.animations.push(...JSON.parse(fs.readFileSync(root+'extra-motions.json')).map(c=>THREE.AnimationClip.parse(c)));
const clips=new Map(gltf.animations.map(c=>[c.name,c])),mixer=new THREE.AnimationMixer(gltf.scene);let count=0;const warnings=[];const original=console.warn;console.warn=(...a)=>warnings.push(a.join(' '));
for(const c of Object.values(data.config)){const clip=clips.get(c.timeline[0].clip);assert(clip,c.label);const action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;for(const frame of [0,Math.floor(c.durations.length/2),c.durations.length-1]){mixer.stopAllAction();action.reset().play();action.time=Math.min(clip.duration,frame/60*(c.timeline[0].speed||1));mixer.update(0);gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(node=>{assert(node.matrixWorld.elements.every(Number.isFinite),`${c.label}:${node.name}`);});count++;}}
console.warn=original;assert.equal(warnings.length,0,warnings.join('\n'));console.log(`PASS Krov GLTFLoader: hash, chunks, ${clips.size} clips, ${count} sampled poses and all bone bindings`);
