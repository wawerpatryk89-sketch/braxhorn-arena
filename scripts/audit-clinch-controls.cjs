const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{let count=0;for(const slot of [0,1,2,3,4,5])for(const opponent of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY']){
 const g=await createGame(844,390,true),t=g.test,{B,O,S}=t;await g.start();t.selectSlot(slot,true);await g.flush();t.selectOpponent(opponent);await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);S.training=true;S.trainingBehavior='idle';
 const tap=kind=>{const c=g.buttons.find(x=>x.dataset.tap===kind);c.dispatch('pointerdown');c.dispatch('pointerup');};
 const reset=face=>{g.proof.reset();B.x=50;O.x=50+face*2;t.faceOpponents();t.separateFighters();O.grabCooldown=0;};
 for(const role of ['player','opponent']){const actor=role==='player'?B:O,who=role==='player'?['BRAX','NYXA','VEXA','KROV','NINA','DANNY'][slot]:opponent;if(['NINA','DANNY'].includes(who))continue;
  for(const face of [1,-1]){
   reset(face);assert(t.beginSourcePair(actor));g.step(96);assert(S.clinch&&B.frame>0&&O.frame>0,'both clips move immediately');
   let time=96;while(S.clinch&&time<2000){g.step(16);time+=16;}assert(!S.clinch&&time<2000,'one press resolves in under two seconds');
   const target=actor===B?O:B;assert.equal(target.hp,100-({BRAX:12,NYXA:11,VEXA:9,KROV:14}[who]),'one landing damage event');
   g.step(4500);assert(!B.downState&&!O.downState&&!B.lock&&!O.locked,'both recover control');count++;
   reset(face);assert(t.beginSourcePair(actor));g.step(96);tap('grab');assert(!S.clinch&&!B.lock&&!O.locked,'touch release/break responds');assert.equal(B.hp,100);assert.equal(O.hp,100);
   reset(face);assert(t.beginSourcePair(actor));g.step(96);tap('evade');assert(!S.clinch,'U pushes apart during the break window');
   reset(face);assert(t.beginSourcePair(actor));S.clinch.elapsed=1990;S.clinch.actionElapsed=0;g.step(16);assert(!S.clinch&&!B.lock&&!O.locked,'hard two-second release');
  }
 }
 }console.log('PASS',count,'attacker/victim/direction cases: moving clips, one-press throw, damage once, touch escape, recovery and two-second hard limit.');
})().catch(e=>{console.error(e);process.exitCode=1});
