const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{let cases=0;
 for(const slot of [0,1,2,3,4]){
  const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;
  await g.start();t.selectSlot(slot,true);await g.flush();g.elements.get('chooseFighter').dispatch('click');g.elements.get('arena-rooftop').dispatch('click');await g.flush();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);S.training=true;S.trainingBehavior='idle';
  for(const face of [1,-1]){g.proof.reset();B.x=face>0?20:80;O.x=face>0?80:20;t.faceOpponents();K.right=face>0;K.left=face<0;g.step(64);assert.equal(B.a,'APPROACH');assert(!t.CFG().JUMP);g.send('blur');g.step(32);assert.equal(B.a,'IDLE');const x=B.x;g.step(600);assert.equal(B.x,x,'release stops without idle drift');cases++;}
  t.selectOpponent(['BRAX','NYXA','VEXA','KROV','BEAR'][slot]);t.setupOpponent();g.proof.reset();B.x=15;O.x=85;t.faceOpponents();S.trainingBehavior='idle';t.knockdown(O);const states=new Set();g.step(5000,()=>states.add(O.a));assert(!O.downState);B.x=15;O.x=85;t.faceOpponents();S.trainingBehavior='spar';O.cooldown=1e9;g.step(5000,()=>states.add(O.a));assert(states.has('GETUP')&&states.has('APPROACH')&&states.has('WALK_FORWARD'),'CPU gets up, approaches and enters guard step: '+JSON.stringify([...states]));cases++;
 }
 console.log('PASS '+cases+' approach, post-getup, distance transition and release-stop scenarios; free jump absent for all five.');
})().catch(e=>{console.error(e);process.exitCode=1;});
