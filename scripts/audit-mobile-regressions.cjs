const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{
const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;await g.start();t.selectSlot(4,true);await g.flush();assert(g.elements.get('fighterFilm').src.includes('nina-intro'),'preload on selection');await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
const c=t.CFG();assert(Math.abs(t.actionTempo('NINA',c.LIGHT_KICK,0)/(1.10*t.baseActionTempo('NINA',c.LIGHT_KICK,0))-.93)<1e-10);
assert(Math.abs(t.sourceMoveSpeed('NINA')/t.sourceMoveSpeed('BRAX')-(.70/.60*.93))<1e-10);
g.proof.reset();S.training=true;S.trainingBehavior='idle';t.selectOpponent('BRAX');t.setupOpponent();B.x=38;O.x=58;t.faceOpponents();t.opponentPose('DOWN',true);O.downState={source:true,phase:'DOWN'};O.cfg.DOWN.durations=O.cfg.DOWN.durations.map(()=>10000);O.pushTime=0;const ox=O.x,gap=O.x-B.x;K.right=true;g.step(500);assert(Math.abs(O.x-ox)<.001,'downed opponent moved when approached');assert(O.x-B.x<gap,'cannot approach downed fighter');
g.proof.reset();S.training=false;S.wins=[2,0];let resolve;const art=g.elements.get('resultArt');art.src='old-fighter.webp';art.decode=()=>new Promise(r=>resolve=r);t.showMatchResult();assert.equal(art.style.visibility,'hidden');assert(art.src.includes('nina'));resolve();await g.flush();assert.equal(art.style.visibility,'visible');
console.log('PASS: Nina -7%, early film preload, no stale winner portrait, approach downed opponent');
})().catch(e=>{console.error(e);process.exitCode=1});
