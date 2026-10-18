const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('game/assets/multiplayer.js','utf8'),calls=[],states=[];
const guest={role:'guest',code:'ABCDEF12',token:'test'},context={session:guest,playing:true,ready:true,peer:null,seq:10,held:{left:true},events:[{id:1,kind:'punch'}],received:0,document:{hidden:false},window:{BRAX_MULTIPLAYER_ENGINE:{receive:p=>states.push(p)}},requestSync(){},api(body){return new Promise(resolve=>calls.push({body,resolve}));}};
vm.runInNewContext(source.slice(source.indexOf('let inputFlight=null;'),source.indexOf('function makePeer()')),context);
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
context.flushGuestInput();assert.equal(calls.length,1,'input leaves immediately, independently of poll');
context.held={left:false};context.events.push({id:2,kind:'kick'});context.flushGuestInput();context.flushGuestInput();assert.equal(calls.length,1,'rapid changes are coalesced');
calls[0].resolve({status:'playing',seq:1,snapshot:{ack:1}});await tick();assert.equal(calls.length,2);assert.equal(calls[1].body.input.held.left,false);assert.equal(calls[1].body.input.events[0].id,2);assert.equal(calls[1].body.seq,12);assert.equal(states.length,1);
context.session=null;calls[1].resolve({seq:2,snapshot:{ack:2}});await tick();assert.equal(states.length,1,'old room cannot change new game');
context.session={role:'host'};context.flushGuestInput();assert.equal(calls.length,2,'host does not use guest lane');
console.log('PASS immediate fallback input, coalesced release, monotonic sequences, ack retention and room cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1;});
