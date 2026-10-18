const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{
 let cases=0;
 for(const slot of[0,5]){
  const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;
  await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
  for(const opponent of['BRAX','DANNY'])for(const face of[1,-1])for(const mode of['idle','stunned','cpu'])for(const staleLatch of[false,true]){
   t.selectOpponent(opponent);t.setupOpponent();g.proof.reset();S.training=true;S.trainingBehavior=mode==='cpu'?'spar':'idle';S.difficulty='hard';
   S.trainingBehavior='idle';B.x=50-face*5;O.x=50+face*5;t.faceOpponents();
   g.step(600,()=>assert(!S.clinch,'ordinary close stance must not trigger push'));
   S.trainingBehavior=mode==='cpu'?'spar':'idle';B.x=50-face*1.5;O.x=50+face*1.5;t.faceOpponents();S.contactNeedsSeparation=staleLatch;S.contactCooldown=9999;
   if(mode==='stunned'){B.stun=1200;O.stun=1200;}
   let started=false,finished=false,startGap=0,endGap=0,ticks=0;
   g.step(3400,()=>{
    assert(!K.left&&!K.right,'test must require no movement input');
    if(S.clinch?.showcase&&!started){started=true;startGap=Math.abs(B.x-O.x);}if(++ticks===2)assert(started,'distance must trigger immediately, despite cooldown/stun/latch');
    if(started&&!S.clinch&&!finished){finished=true;endGap=Math.abs(B.x-O.x);}
    assert((O.x-B.x)*face>0,'fighters crossed');
   });
   assert(started&&finished,JSON.stringify({slot,opponent,face,mode,started,finished}));
   assert(endGap>startGap+15,'push failed to create visible space');
   // Repeat close contact after cooldown, without manually clearing a latch.
   g.step(2500);B.x=50-face*1.5;O.x=50+face*1.5;B.downState=O.downState=null;B.getupProtection=O.getupProtection=0;B.stun=O.stun=0;B.anim=null;B.lock=false;t.restore();t.opponentPose('IDLE');S.trainingBehavior='idle';
   let repeated=false;g.step(1000,()=>{repeated ||= !!S.clinch?.showcase;});assert(repeated,'second close encounter permanently disabled');cases++;
  }
  for(const difficulty of['easy','normal','hard']){
   t.selectOpponent(slot===0?'DANNY':'BRAX');t.setupOpponent();g.proof.reset();S.training=true;S.trainingBehavior='spar';S.difficulty=difficulty;B.x=28;O.x=72;
   let pushes=0,active=false,minGap=100;g.step(30000,()=>{minGap=Math.min(minGap,Math.abs(B.x-O.x));const on=!!S.clinch?.showcase;if(on&&!active)pushes++;active=on;});
   console.log({slot,difficulty,noInputPushes:pushes,minGap});// CPU may remain at a valid fighting distance without any automatic push.
  }
 }
 console.log(JSON.stringify({pass:true,cases,checks:['ordinary close stance does not push','deep overlap triggers','no player input','both fighters and directions','stun cannot starve trigger','active CPU','strong separation','repeat encounter']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
