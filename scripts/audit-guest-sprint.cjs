// Guest double-tap forward must start a run on the host and on the guest's own screen,
// even when the two taps reach the host far apart because of network jitter.
const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
const ROSTER=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
(async()=>{const results=[];
 for(const guestFighter of ROSTER)for(const gap of [0,150,400]){
  const h=await createGame(844,390,true),g=await createGame(844,390,true),H=h.context.BRAX_MULTIPLAYER_ENGINE,G=g.context.BRAX_MULTIPLAYER_ENGINE;
  const room={hostFighter:'BRAX',guestFighter,arena:'rooftop-city'};await H.start('host',room);await G.start('guest',room);H.go();G.go();h.step(17000);
  const O=h.test.O;h.test.B.x=20;O.x=80;h.test.faceOpponents();h.tick(1000/60);
  const forward=O.face>0?'right':'left',snap=()=>JSON.parse(JSON.stringify(H.snapshot()));
  G.receive(snap());g.tick(1000/60);
  // Tap, release, tap again within 300 ms on the guest's device. The packets reach the host `gap` ms apart.
  const tap1={held:{[forward]:true},events:[{id:1,kind:forward,double:false}],visible:true};
  const lift={held:{},events:[{id:1,kind:forward,double:false}],visible:true};
  const tap2={held:{[forward]:true},events:[{id:1,kind:forward,double:false},{id:2,kind:forward,double:true}],visible:true};
  G.localInput(tap1);H.input(tap1);h.tick(1000/60);
  G.localInput(lift);H.input(lift);for(let t=0;t<gap;t+=1000/60)h.tick(1000/60);
  G.localRun?.(forward);G.localInput(tap2);H.input(tap2);
  let hostRun=0,guestRun=0,frames=0;
  for(let t=0;t<600;t+=1000/60){h.tick(1000/60);G.receive(snap());g.tick(1000/60);frames++;if(O.a==='RUN')hostRun++;if(g.test.O.a==='RUN')guestRun++;}
  const hasRun=!!O.cfg.RUN;results.push({guestFighter,gap,hasRun,hostRunFrames:hostRun,guestRunFrames:guestRun,frames});
  if(hasRun){assert(O.sprintHeld,`${guestFighter} gap ${gap}: host did not register the guest's double tap`);assert(hostRun>frames*.5,`${guestFighter} gap ${gap}: host fighter did not run (${hostRun}/${frames})`);assert(guestRun>frames*.5,`${guestFighter} gap ${gap}: guest screen did not show the run (${guestRun}/${frames})`);}
 }
 // A single tap must never start a run.
 {const h=await createGame(844,390,true),H=h.context.BRAX_MULTIPLAYER_ENGINE;await H.start('host',{hostFighter:'BRAX',guestFighter:'NYXA',arena:'rooftop-city'});H.go();h.step(17000);const O=h.test.O;h.test.B.x=20;O.x=80;h.test.faceOpponents();const f=O.face>0?'right':'left';H.input({held:{[f]:true},events:[{id:1,kind:f,double:false}],visible:true});for(let t=0;t<400;t+=1000/60)h.tick(1000/60);assert(!O.sprintHeld,'single tap must walk');assert.notEqual(O.a,'RUN');}
 console.log(JSON.stringify({pass:true,cases:results.length,results}));
})().catch(e=>{console.error(e);process.exitCode=1});
