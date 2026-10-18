const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{
 const g=await createGame(844,390,true),t=g.test,{B,O,S}=t;
 await g.start();await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 const reset=()=>{g.send('blur');g.proof.reset();S.training=true;S.trainingBehavior='idle';S.preFight=false;};
 const rows=[];
 for(const rival of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY'])for(const face of [1,-1])for(const input of ['touch','keyboard']){
  t.selectOpponent(rival);t.setupOpponent();reset();B.x=face===1?47:53;O.x=100-B.x;t.faceOpponents();
  assert(t.beginShowcaseContact(false,B));t.showcaseContactStep(100);
  if(input==='touch'){const b=g.buttons.find(b=>b.dataset.tap==='grab');assert(b);b.dispatch('pointerdown',{pointerId:79});b.dispatch('pointerup',{pointerId:79});}else{g.key('c');g.key('c',false);}
  assert(S.clinch?.sourcePair,`${rival} ${face} ${input}: manual grab rejected`);
  const health=[];let previous=O.hp;g.step(5000,()=>{if(O.hp!==previous){health.push(O.hp);previous=O.hp;}});
  assert.deepEqual(health,[88],'throw damage exactly once');assert(!S.clinch,'pair releases');
  rows.push({rival,face,input,damage:100-O.hp});
 }
 for(const face of [1,-1]){
  t.selectOpponent('BRAX');t.setupOpponent();reset();B.x=face===1?35:65;O.x=face===1?70:30;t.faceOpponents();S.comboReserved=true;assert(t.beginAction('COMBO'));
  const c=O.cfg.LIGHT_PUNCH;O.x=B.x+B.face*t.attackDistance(c,t.playerHurtbox(),O,B);t.faceOpponents();t.opponentPose('LIGHT_PUNCH',true);
  let interrupted=false;g.step(1200,()=>{if(B.hp<100&&B.a!=='COMBO')interrupted=true;});assert(interrupted,'actual incoming punch interrupts combo');
  g.step(7000);assert(!B.lock&&!B.stun,'guard/control recovery');rows.push({case:'incoming-punch-interrupts',face,hp:B.hp,action:B.a});
 }
 for(const slot of [4,5]){t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);reset();B.x=47;O.x=53;t.faceOpponents();assert(t.beginShowcaseContact(false,B));t.showcaseContactStep(100);const contact=S.clinch;assert.equal(t.playerButtonAttack('grab'),false);assert.equal(S.clinch,contact,'unsupported grab cannot cancel automatic contact');rows.push({case:'unsupported-grab-keeps-contact',slot});}
 console.log(JSON.stringify({pass:true,rendering:'mocked: engine/input evidence only',cases:rows.length,rows},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
