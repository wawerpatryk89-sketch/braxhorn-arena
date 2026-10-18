const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY'];
(async()=>{let count=0;for(const [w,h]of [[844,390],[1280,720]])for(const [slot,name]of names.entries())for(const opponent of names){
 const g=await createGame(w,h,true),t=g.test,{B,O,S,K}=t;await g.start();t.selectSlot(slot,true);await g.flush();t.selectOpponent(opponent);await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(320);
 const corners=[B.x,O.x],stages=new Set();
 const check=()=>{assert(B.x<30&&O.x>70,`${name}/${opponent}: opposite sides`);assert.equal(B.face,1);assert.equal(O.face,-1);assert.equal(S.t,60);assert.equal(B.hp,100);assert.equal(O.hp,100);assert(!S.clinch);};
 check();assert.equal(B.a,'INTRO');assert.equal(O.a,'INTRO');
 S.paused=true;g.step(500);assert.deepEqual([B.x,O.x],corners);S.paused=false;
 for(let elapsed=0;elapsed<13000&&S.preFight;elapsed+=16){assert(!t.beginAction('LIGHT_PUNCH'));g.step(16);check();stages.add(g.elements.get('callout').firstElementChild.textContent);}
 assert(!S.preFight);assert(stages.has('3')&&stages.has('2')&&stages.has('1')&&stages.has('FIGHT'));
 assert(Math.abs(B.x-corners[0])<.1&&Math.abs(O.x-corners[1])<.1,'no automatic walk to the middle before FIGHT');
 const gaitFrames=[new Set(),new Set()];K.right=true;g.step(400,()=>{gaitFrames[0].add(B.frame);gaitFrames[1].add(O.frame);});assert(B.x>corners[0]&&O.x<corners[1],'movement toward the middle starts after FIGHT');assert(gaitFrames.every(frames=>frames.size>1),'gaits advance');g.send('blur');
 S.training=false;B.hp=100;O.hp=40;t.endRound();for(let elapsed=0;elapsed<10000&&S.round===1;elapsed+=16)g.step(16);assert.equal(S.round,2);check();
 for(let elapsed=0;elapsed<4000&&S.preFight;elapsed+=16){g.step(16);check();}assert(!S.preFight);
 S.matchOver=true;g.elements.get('rematch').dispatch('click');check();for(let elapsed=0;elapsed<4000&&S.preFight;elapsed+=16){g.step(16);check();}assert(!S.preFight);
 S.training=true;B.x=45;O.x=55;g.elements.get('trainingReset').dispatch('click');check();
 count++;
 }console.log('PASS',count,'pairs/viewports: greeting, countdown and FIGHT at opposite sides; next round, rematch, training reset, movement after FIGHT.');
})().catch(e=>{console.error(e);process.exitCode=1});
