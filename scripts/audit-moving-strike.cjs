const assert=require('assert/strict');const{createGame}=require('./audit-new-fighters.cjs');
(async()=>{let cases=0;for(let slot=0;slot<6;slot++)for(const face of [1,-1]){
const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;
await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);S.training=true;S.trainingBehavior='idle';S.preFight=false;S.paused=false;S.ended=false;S.clinch=null;B.hp=O.hp=100;
function setup(){t.restore();B.stun=0;B.pushTime=0;B.jumpTime=null;B.ground=true;B.x=face>0?20:80;O.x=face>0?80:20;B.face=face;O.face=-face;K.left=face<0;K.right=face>0;K.block=false;B.sprintHeld=true;}
setup();assert(t.beginAction('LIGHT_PUNCH'));assert(B.strikeMotion);const x=B.x;g.step(150);assert((B.x-x)*face>.1,'no moving strike '+slot);const m=B.strikeMotion;assert(m&&m.clock>0);if(slot!==4)assert(m.weight>0,'legs not blended');
K.left=K.right=false;const stopped=B.x;g.step(120);assert(Math.abs(B.x-stopped)<.01,'released direction keeps translating');
setup();K.left=K.right=false;assert(t.beginAction('LIGHT_PUNCH'));assert(!B.strikeMotion,'standing punch changed');
setup();assert(t.beginAction('HEAVY_KICK'));assert(B.strikeMotion?.legStrike,'running kick missing or legs replaced');
setup();B.x=face>0?45:55;O.x=face>0?55:45;assert(t.beginAction('LIGHT_PUNCH'));g.step(1000);assert((O.x-B.x)*face>0,'crossed opponent');cases++;
}console.log('PASS moving strike:',cases,'fighter/facing cases; forward travel, gait, release, stationary and heavy attacks, collision');})().catch(e=>{console.error(e);process.exitCode=1});
