const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{const g=await createGame(844,390,true),t=g.test,{B,O,S}=t;await g.start();t.selectSlot(1,true);await g.flush();t.selectOpponent('BRAX');t.startChallenge('evade5');await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);g.elements.get('trainingReset').dispatch('click');S.trainingBehavior='idle';
B.x=10;O.x=90;t.faceOpponents();assert(t.evade());t.opponentPose('LIGHT_PUNCH',true);g.step(3000);assert.equal(S.challengeRun.count,0,'distant miss cannot count as a dodge');
let found=false;const c=O.cfg.LIGHT_PUNCH;
for(const frame of Object.keys(c.hits).map(Number)){
 for(let gap=10;gap<25;gap+=.1){g.proof.reset();S.training=true;S.preFight=false;S.trainingBehavior='idle';B.x=35;O.x=35+gap;t.faceOpponents();assert(t.evade());B.frame=t.CFG().LEAN.evadeFrames[0]+10;t.opponentPose('LIGHT_PUNCH',true);O.frame=frame;const rect=t.fighterRect(O,c,c.hits[frame].box,c.anchorY);if(!t.sourceContact(B,rect)&&t.sourceContact(B,rect,B.evadeOrigin)){found=true;break;}}
 if(found)break;
}
assert(found,'fixture finds an authored dodge moving out of a threatening strike');
for(let i=0;i<100;i++)t.resolveOpponentHit();assert.equal(S.challengeRun.count,1,'100 evaluations of one missed strike count only once');assert.equal(B.hp,100,'geometric dodge does not damage');
console.log(JSON.stringify({pass:true,scope:'actual authored dodge pose and contact resolution; not GPU rendering',distantMissCount:0,repeatedEvaluations:100,awarded:1}));
})().catch(e=>{console.error(e);process.exitCode=1});
