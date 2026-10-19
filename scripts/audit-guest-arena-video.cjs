// The guest never runs the host's start/pause handlers: its arena film must follow the received state,
// and a browser that blocks autoplay with sound must still show the film (muted until the first tap).
const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
function fakeMedia(blockSound){const m={paused:true,muted:false,calls:0,mutedCalls:0,pauses:0};
 return {m,api:{prepare:async()=>{},release(){},current:()=>m,sound(v,mute){m.muted=mute;},pause(){m.paused=true;m.pauses++;},
  resume(){m.calls++;if(blockSound&&!m.muted)return Promise.reject(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));if(m.muted)m.mutedCalls++;m.paused=false;return Promise.resolve();}}};}
(async()=>{const results=[];
 for(const blockSound of [false,true]){
  const h=await createGame(844,390,true),g=await createGame(844,390,true),H=h.context.BRAX_MULTIPLAYER_ENGINE,G=g.context.BRAX_MULTIPLAYER_ENGINE;
  const media=fakeMedia(blockSound);g.context.BRAX_ARENA_MEDIA=media.api;h.context.BRAX_ARENA_MEDIA=fakeMedia(false).api;
  const room={hostFighter:'BRAX',guestFighter:'NYXA',arena:'rooftop-city'};await H.start('host',room);await G.start('guest',room);H.go();G.go();
  const snap=()=>JSON.parse(JSON.stringify(H.snapshot()));
  // Host still in the pre-fight countdown: the guest film must stay still.
  G.receive(snap());g.tick(16);await new Promise(r=>setTimeout(r,0));
  const beforeFight=media.m.paused;
  h.step(17000);for(let t=0;t<1500;t+=16){h.tick(16);G.receive(snap());g.tick(16);await new Promise(r=>setTimeout(r,0));}
  results.push({blockSound,beforeFightPaused:beforeFight,playing:!media.m.paused,muted:media.m.muted,attempts:media.m.calls});
  assert(beforeFight,'film must not start before the fight');
  assert(!media.m.paused,`guest arena film did not start (blockSound=${blockSound})`);
  if(blockSound)assert(media.m.muted,'blocked autoplay must fall back to a muted film');
  if(blockSound){g.send?.('touchend');for(const fn of g.listeners?.('touchend')||[])fn({});}
 }
 console.log(JSON.stringify({pass:true,results}));
})().catch(e=>{console.error(e);process.exitCode=1});
