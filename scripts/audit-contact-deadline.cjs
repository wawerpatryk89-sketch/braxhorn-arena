const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{let cases=0;
for(const width of [844,932])for(const slot of [0,1,2,3,4,5]){
 const gap=10*844/width;const g=await createGame(width,390,true),t=g.test,{B,O,S}=t;
 await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 for(const face of [1,-1])for(const edge of [false,true])for(const hitstop of [false,true]){
  t.selectOpponent(slot===0?'DANNY':'BRAX');t.setupOpponent();g.proof.reset();S.training=true;S.trainingBehavior='idle';
  O.x=edge?(face===1?87:13):55;B.x=O.x-face*gap;t.faceOpponents();S.contactMs=0;S.contactCooldown=0;
  let elapsed=0,started=0;g.step(1800,()=>{elapsed+=16;if(hitstop)S.hitstop=50;if(S.clinch&&!started)started=elapsed;});
  assert(started>=480&&started<=560,JSON.stringify({width,slot,face,edge,hitstop,started}));
  S.hitstop=0;g.step(1800);assert(!S.clinch,'contact not released');cases++;
 }
 // A brief recoil past the near boundary must not restart an almost finished timer.
 g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=50-gap/2;O.x=50+gap/2;t.faceOpponents();S.contactMs=0;
 g.step(240);B.x=50-gap*.65;O.x=50+gap*.65;g.step(80);B.x=50-gap/2;O.x=50+gap/2;
 let recovered=false;g.step(400,()=>{recovered ||= !!S.clinch;});assert(recovered,'brief pose/recoil separation restarted contact deadline');cases++;
 // Contact must reset after a real retreat; two brief encounters are not one hold.
 g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=50-gap/2;O.x=50+gap/2;t.faceOpponents();S.contactMs=0;
 g.step(240,()=>assert(!S.clinch));B.x=25;O.x=75;g.step(100);assert.equal(S.contactMs,0);
 B.x=50-gap/2;O.x=50+gap/2;g.step(240,()=>assert(!S.clinch,'brief encounters accumulated'));let started=false;g.step(1000,()=>{started||=!!S.clinch;});assert(started,'persistent renewed contact missed');cases++;
}
console.log(JSON.stringify({pass:true,cases,checks:['persistent contact starts push within 0.56 s','no immediate push on approach','both directions and walls','hitstop cannot freeze deadline','retreat clears timer']}));
})().catch(e=>{console.error(e);process.exitCode=1});
