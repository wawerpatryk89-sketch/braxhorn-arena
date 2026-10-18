const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const {createGame}=require('./audit-new-fighters.cjs');const code=fs.readFileSync('game/assets/championship.js','utf8'),ctx={window:{}};vm.runInNewContext(code,ctx);const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY'];
(async()=>{
for(const player of names)for(const mode of ['arcade','tournament']){const c=ctx.window.BRAX_CHAMPIONSHIP.create(mode,player,names,()=>.4),seen=[];while(!c.finished){const opp=c.next();assert(opp&&opp!==player);seen.push(opp);c.result('draw');assert.equal(c.next(),opp);c.result('win');}assert.equal(c.champion,player);assert.equal(new Set(seen).size,seen.length);assert.equal(seen.length,mode==='arcade'?5:seen.length);if(mode==='tournament'){assert(seen.length===2||seen.length===3);assert.equal(c.rounds[0].filter(m=>!m.b).length,2);}const loss=ctx.window.BRAX_CHAMPIONSHIP.create(mode,player,names);loss.next();loss.result('loss');assert(loss.finished&&loss.eliminated);}
for(const [slot,name]of names.entries())for(const mode of ['arcade','tournament']){
 const g=await createGame(844,390,true),click=id=>g.elements.get(id).dispatch('click'),hidden=id=>g.elements.get(id).classList.contains('off');g.context.Math=Object.create(Math);g.context.Math.random=()=>.4;
 await g.start();click(mode==='arcade'?'arcadeMode':'tournamentMode');click('setupNext');g.test.selectSlot(slot,true);await g.flush();const initialArena=g.proof.selectedArena();click('chooseFighter');await g.flush();
 if(mode==='arcade'){assert(hidden('arenaSelection')&&hidden('campaignScreen'),'Arcade skips both extra screens');assert(g.test.S.cinematic,'Arcade goes directly into the fighter film');assert.notEqual(g.proof.selectedArena(),initialArena,'random arena selected');}
 else{await g.flush();assert(hidden('arenaSelection'));assert(!hidden('campaignScreen'));click('campaignStart');await g.flush();}
 const seen=[];let count=0;
 while(true){assert(++count<=7);assert(hidden('campaignScreen'));assert.equal(g.state().character,name);assert.notEqual(g.state().opponent.character,name);seen.push(g.state().opponent.character);assert(g.test.S.cinematic);click('filmSkip');g.step(13000);
  const {B,O,S}=g.test;S.training=false;S.ended=false;S.round=2;S.wins=[1,0];B.hp=100;O.hp=0;g.test.endRound();assert(S.matchOver);for(let ms=0;ms<30000&&hidden('matchEnd');ms+=100)g.step(100);assert.equal(g.elements.get('resultArt').src,'/assets/result-portraits/'+name.toLowerCase()+'.webp');
  click('rematch');assert(!hidden('campaignScreen'));if(g.elements.get('campaignStart').textContent.includes('OD NOWA'))break;
  const before=g.proof.selectedArena();click('campaignStart');await g.flush();assert.notEqual(g.proof.selectedArena(),before,'new random arena for next campaign opponent');
 }
 assert.equal(count,mode==='arcade'?7:3);assert.equal(new Set(seen).size,seen.length);assert(g.elements.get('campaignStatus').textContent.includes('MISTRZ'));click('campaignBack');assert(hidden('campaignScreen'));
}
for(const [slot,name]of names.entries()){
 const g=await createGame(844,390,true),click=id=>g.elements.get(id).dispatch('click');await g.start();click('mode-training');click('setupNext');g.test.selectSlot(slot,true);g.test.selectOpponent('VEXA');await g.flush();const before=g.proof.selectedArena();click('chooseFighter');await g.flush();
 assert(!g.elements.get('arenaSelection').classList.contains('off'));click('arena-beach');await g.flush();assert(g.test.S.cinematic&&g.test.S.training);assert.equal(g.proof.selectedArena(),'beach');assert.equal(g.state().opponent.character,'VEXA','training retains chosen opponent');
}
console.log('PASS: six fighters; Arcade direct start, seven distinct rivals and changing arenas; training selected arena; tournament bracket, completion and results with actual portraits.');
})().catch(e=>{console.error(e);process.exitCode=1});
