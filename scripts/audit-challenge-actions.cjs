const{createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{const rows=[],baseline=process.argv.includes('--baseline');const source=baseline?require('node:child_process').execFileSync('git',['show','a2463573d4c304038724e63b84e19f77eef30d4f:dist/assets/combat.js'],{encoding:'utf8',maxBuffer:2e6}):null;
for(let slot=0;slot<6;slot++)for(const challenge of ['evade5','push3']){
 const g=await createGame(844,390,true,null,{combatSource:source}),t=g.test,{B,O,S,K}=t;await g.start();t.selectSlot(slot,true);await g.flush();t.selectOpponent('BRAX');t.startChallenge(challenge);await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);g.elements.get('trainingReset').dispatch('click');
 g.elements.get('trainingAttack').value='LIGHT_PUNCH';let elapsed=0,evadedSerial=null,attempt=0;
 while(!S.challengeRun.done&&elapsed<180000){
  if(challenge==='push3'){K.left=B.face<0;K.right=B.face>0;if(!B.lock&&!B.stun)t.playerButtonAttack('punch');}
  else{const c=O.cfg[O.a],first=Math.min(...Object.keys(c.hits||{}).map(Number));if(!c.attack&&S.drillMs>=[400,500,600,700,800,900][attempt%6]&&evadedSerial!==O.attackSerial+1&&!B.lock&&!B.stun){if(t.evade()){evadedSerial=O.attackSerial+1;attempt++;}}}
  g.step(16);elapsed+=16;
 }
 rows.push({slot,challenge,completed:S.challengeRun.done,count:S.challengeRun.count,elapsed,hp:B.hp,positions:[B.x,O.x]});
}
console.log(JSON.stringify({baseline,rendering:'engine and actual actions only; the scripted controller is not human playtesting',rows},null,2));if(!baseline)assert(rows.every(r=>r.completed),'every challenge must be completable through actual actions');
})().catch(e=>{console.error(e);process.exitCode=1});
