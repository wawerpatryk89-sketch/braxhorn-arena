const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{let cases=0;for(let slot=0;slot<6;slot++){
 const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 for(const who of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY'])for(const face of [-1,1])for(const press of ['none','player','opponent','both','attack']){
 t.selectOpponent(who);t.setupOpponent();g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=47;O.x=B.x+face*4;t.faceOpponents();t.separateFighters();
 K.left=K.right=false;if(['player','both','attack'].includes(press))K[face>0?'right':'left']=true;
 if(['opponent','both'].includes(press))t.opponentPose('WALK_FORWARD');
 if(press==='attack')assert(t.beginAction('LIGHT_PUNCH'));
 // Keep the recorded contact state stable while exercising the same timer as physics.
 for(let i=0;i<25;i++)t.contactClinchStep(16);
 if(press==='none'||press==='attack')assert(!S.clinch,'idle or active attack must not be interrupted');
 else if(press==='both'){assert(S.clinch?.mutual,'equal pressure plays symmetric contact');assert.equal(B.a,'CONTACT_PUSH');assert.equal(O.a,'CONTACT_PUSH');const before=[B.x,O.x];t.showcaseContactStep(900);assert((B.x-before[0])*B.face<0&&(O.x-before[1])*O.face<0,'both move back');}
 else{assert.equal(S.clinch?.attacker,press,'initiator follows motion, not player slot');assert.equal(S.clinch.fall,false,'mere proximity never causes fall');}
 assert.equal(B.hp,100);assert.equal(O.hp,100);cases++;
 }
}console.log(JSON.stringify({pass:true,cases}));})().catch(e=>{console.error(e);process.exitCode=1});
