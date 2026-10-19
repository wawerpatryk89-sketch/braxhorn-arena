const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const results=[];for(const hz of [30,60,120])for(const delay of [0,48,96])for(const scenario of ['attack-hit','walk-push','walk-grab','attack-confirm']){
 const h=await createGame(844,390,true),g=await createGame(844,390,true),H=h.context.BRAX_MULTIPLAYER_ENGINE,G=g.context.BRAX_MULTIPLAYER_ENGINE;
 const room={hostFighter:'BRAX',guestFighter:'NYXA',arena:'rooftop-city'};await H.start('host',room);await G.start('guest',room);H.go();G.go();h.step(17000);h.test.B.x=35;h.test.O.x=scenario==='walk-grab'?45:65;
 const snap=()=>JSON.parse(JSON.stringify(H.snapshot()));G.receive(snap());g.tick(1000/hz);g.tick(1000/hz);
 const input={held:scenario.startsWith('walk')?{left:true}:{},events:[{id:1,kind:scenario.startsWith('walk')?'left':'punch'}],visible:true};G.localInput(input);
 // These are authoritative host state transitions, delivered after a fixed link delay.
 if(scenario==='attack-hit'){h.test.damage(h.test.O,10,null,{target:'body'});H.input(input);}
 if(scenario==='walk-push'){h.test.O.pushTime=220;h.test.O.pushSpeed=26;H.input(input);h.tick(1000/60);}
 if(scenario==='walk-grab'){h.test.O.x=45;assert(h.test.beginSourcePair(h.test.B),'host grab');H.input(input);h.tick(1000/60);}
 if(scenario==='attack-confirm'){H.input(input);h.tick(1000/60);}
 let previous={x:g.test.O.x,frame:g.test.NET.renderedPose[1].frame,a:g.test.O.a,id:g.test.NET.renderedPose[1].actionId},maxJump=0,rewinds=0,wrongAuthority=0,firstCorrection=null;
 for(let elapsed=0;elapsed<500;elapsed+=1000/hz){if(elapsed>=delay){G.receive(snap());h.tick(1000/hz);}g.tick(1000/hz);const f=g.test.O,id=g.test.NET.renderedPose[1].actionId,frame=g.test.NET.renderedPose[1].frame;
  if(elapsed>=delay&&firstCorrection===null)firstCorrection=f.x-previous.x;
  maxJump=Math.max(maxJump,Math.abs(f.x-previous.x));if(f.a===previous.a&&(id===previous.id||(previous.id==='local:1'&&scenario==='attack-confirm'))&&f.cfg[f.a].attack&&frame<previous.frame-1e-8)rewinds+=previous.frame-frame;
  if(elapsed>=delay&&scenario==='attack-hit'&&f.cfg[f.a].attack)wrongAuthority++;
  previous={x:f.x,frame,a:f.a,id};
 }
 results.push({scenario,hz,delayMs:delay,maxJumpArenaPercent:maxJump,rewoundAttackFrames:rewinds,stalePredictedAttackFrames:wrongAuthority,firstCorrection});
 }
 fs.mkdirSync('docs/verification',{recursive:true});fs.writeFileSync(process.env.CONFLICT_OUT||'docs/verification/network-conflicts.json',JSON.stringify(results,null,2)+'\n');
 if(!process.env.MEASURE_ONLY){for(const r of results){assert(r.maxJumpArenaPercent<=.06*Math.min(50,1000/r.hz)+1e-8,JSON.stringify(r));if(r.scenario==='walk-push')assert(r.firstCorrection>=0,'host push must override local direction: '+JSON.stringify(r));assert.equal(r.rewoundAttackFrames,0,JSON.stringify(r));assert.equal(r.stalePredictedAttackFrames,0,JSON.stringify(r));}}
 console.log(JSON.stringify({cases:results.length,maxJump:Math.max(...results.map(r=>r.maxJumpArenaPercent)),rewoundFrames:results.reduce((s,r)=>s+r.rewoundAttackFrames,0),stalePredictionFrames:results.reduce((s,r)=>s+r.stalePredictedAttackFrames,0)}));
})().catch(e=>{console.error(e);process.exitCode=1});
