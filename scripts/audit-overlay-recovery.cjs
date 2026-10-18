const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{
 const g=await createGame(844,390,true),{S,B,O}=g.test,el=id=>g.elements.get(id);g.context.__MANUAL_NAME=true;
 el('go').dispatch('click');el('playerNickname').value='NIEZAPISANY';el('identityBack').dispatch('click');assert(el('playerIdentity').classList.contains('off'));el('identityContinue').dispatch('click');assert.notEqual(g.test.progress.name,'NIEZAPISANY');
 await g.start();g.test.selectSlot(0,true);await g.flush();g.test.selectOpponent('KROV');
 let attempts=0;g.context.BRAX_PREPARE_PAIR=async()=>{attempts++;throw new Error('offline');};
 await assert.rejects(g.test.begin(),/offline/);assert(!el('fightLoadError').classList.contains('off'));assert(el('introFilm').classList.contains('off'));assert(!S.running&&!S.cinematic);
 el('retryFightLoad').dispatch('click');await g.flush();assert.equal(attempts,2);assert(!el('fightLoadError').classList.contains('off'));
 g.context.BRAX_PREPARE_PAIR=async()=>{attempts++};el('retryFightLoad').dispatch('click');await g.flush();assert.equal(attempts,3);assert(S.running);assert(el('fightLoadError').classList.contains('off'));
 el('fighterFilm').dispatch('ended');g.step(17000);g.context.__MANUAL_HELP=true;g.proof.reset();S.training=true;S.trainingBehavior='idle';S.preFight=false;B.hp=73;O.hp=41;S.wins=[1,0];el('pause').dispatch('click');assert(S.paused);
 for(let i=0;i<3;i++){el('pauseHelp').dispatch('click');assert(g.test.helpPending());assert.equal(el('helpContinue').textContent,'WRÓĆ DO PAUZY →');g.step(1200);el('helpContinue').dispatch('click');assert(S.paused&&!S.preFight);assert.equal(B.hp,73);assert.equal(O.hp,41);assert.equal(S.wins[0],1);}
 el('pause').dispatch('click');assert(!S.paused&&!S.preFight);assert(g.test.playerButtonAttack('punch'),'input returns after reopening help');
 g.context.BRAX_PREPARE_PAIR=async()=>{throw new Error('offline')};await assert.rejects(g.test.begin());el('cancelFightLoad').dispatch('click');assert(el('fightLoadError').classList.contains('off'));assert(!el('selection').classList.contains('off'));assert(!S.running);
 console.log('PASS recovery: repeated network failure, successful retry, cancel to selection, cancelled identity is not saved, help reopened three times preserves health/score/pause and restores attacks.');
})().catch(e=>{console.error(e);process.exitCode=1});
