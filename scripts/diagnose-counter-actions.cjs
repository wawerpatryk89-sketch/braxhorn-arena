const{createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{const rows=[];
for(let slot=0;slot<6;slot++)for(const challenge of ['counter3']){
 const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;g.elements.get('go').dispatch('click');t.selectSlot(slot,true);await g.flush();t.selectOpponent('BRAX');t.startChallenge(challenge);await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);g.elements.get('trainingReset').dispatch('click');
 g.elements.get('trainingAttack').value='HEAVY_PUNCH';let elapsed=0,evadedSerial=null,attempt=0,attackOrigin=0,lastAttack=null;
 while(!S.challengeRun.done&&elapsed<180000){
  if(challenge==='counter3'){const c=O.cfg[O.a],last=Math.max(...Object.keys(c.hits||{}).map(Number));if(c.attack&&lastAttack!==O.attackSerial){lastAttack=O.attackSerial;attackOrigin=B.x;}const back=c.attack&&O.frame<=last&&Math.abs(B.x-attackOrigin)<5;K.left=back&&B.face>0;K.right=back&&B.face<0;if(c.attack&&O.frame>last&&!B.lock&&!B.stun)t.playerButtonAttack('kick');}
  else if(challenge==='push3'){K.left=B.face<0;K.right=B.face>0;if(!B.lock&&!B.stun)t.playerButtonAttack('punch');}
  else{const c=O.cfg[O.a],first=Math.min(...Object.keys(c.hits||{}).map(Number));if(!c.attack&&S.drillMs>=[400,500,600,700,800,900][attempt%6]&&evadedSerial!==O.attackSerial+1&&!B.lock&&!B.stun){if(t.evade()){evadedSerial=O.attackSerial+1;attempt++;}}}
  g.step(16);elapsed+=16;
 }
 rows.push({slot,challenge,completed:S.challengeRun.done,count:S.challengeRun.count,elapsed,hp:B.hp,positions:[B.x,O.x]});
}
console.log(JSON.stringify({rendering:'engine and actual actions only',rows},null,2));console.log('DIAGNOSTIC ONLY: controller completed '+rows.filter(r=>r.completed).length+'/'+rows.length+' fighter scenarios; this is not a PASS for playability.');
})().catch(e=>{console.error(e);process.exitCode=1});
