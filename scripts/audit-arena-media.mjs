import assert from 'node:assert/strict';
import {arenaMedia} from '../backend/lib/arena-media.ts';
const name='test.0123456789ab.mp4',data=new Uint8Array([0,1,2,3,4,5,6,7,8,9]);
let present=true;
const bucket={head:async()=>present?{size:10,httpEtag:'"test"'}:null,get:async(k,options)=>({body:options?.range?data.slice(options.range.offset,options.range.offset+options.range.length):data}),put:async(k,b)=>({size:b.byteLength,etag:'new'})};
const run=(method='GET',headers={},body)=>arenaMedia(new Request('https://game.test/api/arena-media/'+name,{method,headers,body}),bucket,'test-secret',name);
let r=await run();assert.equal(r.status,200);assert.equal((await r.arrayBuffer()).byteLength,10);
r=await run('GET',{Range:'bytes=2-4'});assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),'bytes 2-4/10');assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[2,3,4]);
r=await run('GET',{Range:'bytes=-3'});assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[7,8,9]);
assert.equal((await run('GET',{Range:'bytes=20-'})).status,416);assert.equal((await run('GET',{'If-None-Match':'"test"'})).status,304);
r=await run('HEAD');assert.equal((await r.text()).length,0);assert.equal(r.headers.get('Content-Length'),'10');
assert.equal((await run('PUT',{'Content-Length':'10'},data)).status,403);
assert.equal((await run('PUT',{'Content-Length':'10',Authorization:'Bearer test-secret'},data)).status,409);
present=false;assert.equal((await run('PUT',{'Content-Length':'10',Authorization:'Bearer test-secret'},data)).status,201);
assert.equal((await run()).status,404);
present=true;
for(const [ext,type] of [['gif','image/gif'],['mp3','audio/mpeg'],['webp','image/webp']]){const file='test.0123456789ab.'+ext;const response=await arenaMedia(new Request('https://game.test/api/arena-media/'+file),bucket,'test-secret',file);assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),type);}
console.log('PASS arena media: full/ranged/suffix/invalid/conditional GET, HEAD, upload authorization, immutable files, missing assets.');
