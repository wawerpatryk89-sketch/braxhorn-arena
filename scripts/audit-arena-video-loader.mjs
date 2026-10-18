import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
let requests=0,created=0,revoked=0,loads=0;const listeners=new Map();
const video={pause(){},removeAttribute(){},addEventListener(k,fn){listeners.set(k,fn)},removeEventListener(k){listeners.delete(k)},load(){loads++;if(this.src?.startsWith('blob:'))queueMicrotask(()=>listeners.get('loadeddata')?.())}};
const root={addEventListener(){}};const context={window:root,document:{getElementById:()=>null},AbortController,DOMException,Blob,setTimeout,clearTimeout,URL:{createObjectURL(){created++;return'blob:'+created},revokeObjectURL(){revoked++}},fetch:async()=>{requests++;return new Response(new Uint8Array([1,2,3]),{headers:{'Content-Length':'3'}})}};
vm.runInNewContext(fs.readFileSync('game/assets/arena-media.js','utf8'),context);const api=root.BRAX_ARENA_MEDIA;
await api.prepare('/assets/arena-snow.mp4',video);assert.equal(requests,0);
for(let i=0;i<10;i++){await api.prepare('/api/arena-media/test.0123456789ab.mp4',video);assert(api.report().active);const before=requests;await api.prepare('/api/arena-media/test.0123456789ab.mp4',video);assert.equal(requests,before);api.release();assert(!api.report().active)}
assert.equal(created,revoked);assert.equal(requests,10);
context.fetch=async()=>new Response('missing',{status:404});await assert.rejects(()=>api.prepare('/api/arena-media/missing.0123456789ab.mp4',video),/ARENA_MEDIA/);assert(!api.report().active);
context.fetch=(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('abort','AbortError'))));const pending=api.prepare('/api/arena-media/cancel.0123456789ab.mp4',video);api.release();await assert.rejects(()=>pending,e=>e.name==='AbortError');
console.log('PASS: selected-only fetch, no legacy fetch, reuse in same match, ten cycles release blob URLs, missing media and cancellation.');
