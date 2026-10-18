const{createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{const rows=[];for(let slot=0;slot<6;slot++){
const g=await createGame(844,390,true),t=g.test,{B,O,S}=t;await g.start();t.selectSlot(slot,true);await g.flush();t.startChallenge('counter3');t.selectOpponent('BRAX');await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
for(let attempt=0;attempt<3;attempt++){
 g.proof.reset();S.training=true;S.preFight=false;S.trainingBehavior='counter';B.x=35;O.x=50;t.faceOpponents();t.opponentPose('HEAVY_PUNCH',true);const last=Math.max(...Object.keys(O.cfg.HEAVY_PUNCH.hits).map(Number));O.frame=last+1;O.time=0;
 assert(t.beginAction('LIGHT_PUNCH'));const c=t.CFG().LIGHT_PUNCH;let found=false;
 for(const frame of Object.keys(c.hits).map(Number)){
  B.frame=frame;t.render('LIGHT_PUNCH',frame);
  for(let gap=10;gap<24;gap+=.1){B.x=35;O.x=35+gap;t.separateFighters();if(t.sourceContact(O,t.attackRect(c.hits[frame].box))){found=true;break;}}
  if(found)break;
 }
 assert(found,'fixture: a legal punch reaches recovering opponent');const previous=S.challengeRun.count;t.resolvePlayerHit();assert(O.hp<100,'actual collision did damage');assert.equal(S.challengeRun.count,previous+1,'recovery contact awards one counter');t.resolvePlayerHit();assert.equal(S.challengeRun.count,previous+1,'same hit cannot count twice');
}
assert(S.challengeRun.done);rows.push({slot,count:S.challengeRun.count,done:true});}
console.log(JSON.stringify({pass:true,scope:'collision fixtures in recovery; does not prove a human can reliably reach this timing',rows},null,2));})().catch(e=>{console.error(e);process.exitCode=1});
