const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{
 let contacts=0,celebrations=0;
 for(const slot of[0,1,2,3,4,5,6,7]){
  const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;
  await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
  for(const other of['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'])for(const face of[1,-1])for(const edge of[false,true]){
   t.selectOpponent(other);t.setupOpponent();require('./review/runtime.cjs').reset(g);S.training=true;S.trainingBehavior='idle';
   O.x=edge?(face===1?88:12):50;B.x=O.x-face*3;t.faceOpponents();assert(t.beginShowcaseContact(false,B));const expectedDuration=1200/S.clinch.rate;
   let seen=false,elapsed=0,roles=new Set();
   g.step(5000,()=>{if(S.clinch?.showcase){seen=true;elapsed=Math.max(elapsed,S.clinch.elapsed);roles.add(B.a);roles.add(O.a);assert.equal(B.face,face,'player facing drift');assert.equal(O.face,-face,'same-facing push');assert.equal(B.a,'CONTACT_PUSH');assert.equal(O.a,'CONTACT_RECEIVE');for(const [f,c] of [[B,t.CFG().CONTACT_PUSH],[O,O.cfg.CONTACT_RECEIVE]])assert.equal(f.frame,Math.floor(Math.min(c.durations.length-1e-5,S.clinch.elapsed/1000*S.clinch.rate/(c.durations[0]/1000))),'each authored clip follows shared contact time');}assert(B.hp===100&&O.hp===100,'contact caused damage');assert((O.x-B.x)*face>0,'actors crossed');});
   assert(seen,'missing authored contact');assert(elapsed>=expectedDuration-32&&elapsed<=expectedDuration,'wrong pair duration');assert(roles.size===2&&roles.has('CONTACT_PUSH')&&roles.has('CONTACT_RECEIVE'));assert(!S.clinch&&!B.lock&&!O.locked,'pair stuck');
   assert(!B.downState&&!O.downState,'automatic throw');const gap=Math.abs(B.x-O.x);g.step(500);assert(Math.abs(B.x-O.x)>=gap-.5,JSON.stringify({reason:'post-release pull',slot,other,face,edge,gap,after:Math.abs(B.x-O.x),bx:B.x,ox:O.x,ba:B.a,oa:O.a}));contacts++;
  }

  for(const winner of['player','cpu'])for(const final of[false,true])for(const ending of['time','ko']){
   require('./review/runtime.cjs').reset(g);S.training=false;S.round=final?2:1;S.wins=winner==='player'?[final?1:0,0]:[0,final?1:0];S.matchOver=false;S.paused=false;
   g.elements.get('matchEnd').classList.add('off');gameResult(false);
   const victor=winner==='player'?B:O,loser=winner==='player'?O:B;victor.hp=100;loser.hp=ending==='ko'?0:40;if(ending==='ko')t.knockdown(loser);
   t.endRound();const score=S.wins.slice();g.step(400);
   assert.equal(victor.a,final?'WIN_MATCH':'WIN_ROUND','wrong or missing celebration');assert(g.elements.get('matchEnd').classList.contains('off'),'result covers celebration');
   g.step(450);assert.equal(victor.a,final?'WIN_MATCH':'WIN_ROUND');assert(victor.frame>0,'frozen celebration');assert.deepEqual(S.wins,score,'double score');
   const celebrationMs=S.celebration.duration;g.step(Math.max(0,celebrationMs+800-850));
   if(final){assert(!g.elements.get('matchEnd').classList.contains('off'),'missing match result');assert(S.celebration.finished);g.elements.get('rematch').dispatch('click');assert(!g.elements.get('controls').classList.contains('off'),'rematch controls hidden');assert(!S.ended&&!S.matchOver);}
   else{assert.equal(S.round,2,'next round missing');assert(!S.ended);}
   celebrations++;
  }
  function gameResult(on){g.elements.get('game').classList.toggle('match-over',on);}
 }
 console.log(JSON.stringify({pass:true,contacts,celebrations,checks:['both roles','both sides','walls','no damage','no crossing','no stuck lock','player and CPU wins','timeout and KO','round and match','result after motion']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
