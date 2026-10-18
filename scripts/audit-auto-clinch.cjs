const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{let count=0;for(const slot of [0,1,2,3,4,5])for(const who of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY'])for(const face of [1,-1]){
 const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;
 await g.start();t.selectSlot(slot,true);await g.flush();t.selectOpponent(who);await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 S.training=true;S.trainingBehavior='idle';g.proof.reset();B.x=50;O.x=50+face*2;t.faceOpponents();t.separateFighters();K[face===1?'right':'left']=true;
 g.step(2400,()=>{assert(!S.clinch,'walking must not start a grab');assert.equal(B.hp,100);assert.equal(O.hp,100);assert(!B.downState&&!O.downState);assert((O.x-B.x)*face>0,'no crossing');const a=t.sourcePushBody(B),z=t.sourcePushBody(O);assert((z.x-a.x)*face>=a.r+z.r-.01,'no body overlap');});
 assert.equal(O.airLaunches,0);g.send('blur');g.step(32);assert(!B.lock&&!O.locked,'walking contact cannot lock controls');
 // A tiny contact correction transfers only 15% to the passive fighter.
 B.x=40;O.x=60;t.faceOpponents();B.a='WALK_FORWARD';B.frame=0;B.frameT=0;t.opponentPose('IDLE');K.left=false;K.right=true;
 let a=t.sourcePushBody(B),z=t.sourcePushBody(O);O.x-=(z.x-a.x-a.r-z.r+.5)/844*100;
 const bx=B.x,ox=O.x;t.separateFighters();
 assert(Math.abs((bx-B.x)*844/100-.425)<.001,'walking fighter absorbs most contact');
 assert(Math.abs((O.x-ox)*844/100-.075)<.001,'other fighter receives a minimal push');
 count++;
 }console.log('PASS: '+count+' pairs/facings; light body push, no automatic grabs, damage, launch, crossing or locked controls.');
})().catch(e=>{console.error(e);process.exitCode=1});
