const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{let failures=[];for(let slot=0;slot<6;slot++){
 const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 for(const who of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY'])for(const mode of ['idle','spar']){
 t.selectOpponent(who);t.setupOpponent();g.proof.reset();S.training=true;S.trainingBehavior=mode;S.difficulty='hard';B.x=28;O.x=72;let pushes=0,active=false,timerMax=0,ratioMin=Infinity,rootMin=100;
 g.step(12000,()=>{K[B.face===1?'right':'left']=true;K[B.face===1?'left':'right']=false;timerMax=Math.max(timerMax,S.contactMs);rootMin=Math.min(rootMin,Math.abs(B.x-O.x));const a=t.sourcePushBody(B),z=t.sourcePushBody(O);ratioMin=Math.min(ratioMin,Math.abs(a.x-z.x)/(a.r+z.r));if(S.clinch?.showcase&&!active)pushes++;active=!!S.clinch?.showcase;});
 if(!pushes)failures.push({slot,who,mode,timerMax,ratioMin,rootMin});
 }
}assert.equal(failures.length,0,JSON.stringify(failures));console.log(JSON.stringify({pass:true,cases:72,checks:['approach through movement inputs','all 36 pairs','idle and active CPU','automatic authored push']}));})().catch(e=>{console.error(e);process.exitCode=1});
