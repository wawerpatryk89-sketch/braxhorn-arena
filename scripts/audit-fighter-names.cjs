const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createGame}=require('./audit-new-fighters.cjs');
(async()=>{
let checks=0;
for(const [slot,id,label,other,otherLabel] of [[6,'BEAR','MIŚ','DEMON','AZRAK'],[7,'DEMON','AZRAK','BEAR','MIŚ']]){
 const g=await createGame(844,390,true);await g.start();g.test.selectSlot(slot,true);g.test.selectOpponent(other);await g.test.begin();g.test.S.cinematic=false;g.test.S.preFight=false;g.test.S.paused=false;
 assert.equal(g.elements.get('playerName').textContent,label+' · TY');assert.equal(g.elements.get('opponentName').textContent,otherLabel+' · CPU');
 for(const playerWins of [true,false]){g.test.S.ended=false;g.test.S.wins=[0,0];g.test.S.round=1;g.test.B.hp=playerWins?100:0;g.test.O.hp=playerWins?0:100;g.test.endRound();assert.equal(g.elements.get('callout').firstElementChild.textContent,playerWins?label:otherLabel);checks++;}
 for(const win of [true,false]){g.test.S.wins=win?[2,0]:[0,2];g.test.showMatchResult(true);assert.equal(g.elements.get('resultText').textContent,win?label:otherLabel);assert.equal(g.elements.get('resultNames').textContent,label+' — '+otherLabel);assert.equal(g.elements.get('resultArt').alt,win?label:otherLabel);assert.equal(g.elements.get('matchEnd').getAttribute('data-fighter'),win?id:other);checks+=4;}
 g.test.closeFighterHelp(false);g.test.showFighterHelp();assert.equal(g.elements.get('helpFighterName').textContent,label);assert.equal(g.elements.get('fighterHelpTitle').textContent,label+' · STEROWANIE');checks+=4;
 g.test.progress.setName('DEMON');g.test.progress.record('survival','normal',{id:'name-check',fighter:id,score:1,elapsed:20000});g.elements.get('recordsMode').value='survival';g.elements.get('recordsDifficulty').value='normal';g.context.BRAX_FEATURES.leaderboard(g.document,g.test.progress);assert(g.elements.get('leaderboard').innerHTML.includes('<td>'+label+'</td>'));assert(g.elements.get('leaderboard').innerHTML.includes('<td>DEMON</td>'),'player nickname is not renamed');assert.equal(g.test.progress.top('survival','normal')[0].fighter,id);checks+=3;
 const records=g.context.BRAX_FEATURES.records(g.test.progress);assert(records.includes('<b>MIŚ</b>')&&records.includes('<b>AZRAK</b>'));assert(!records.includes('<b>BEAR</b>')&&!records.includes('<b>DEMON</b>'));checks+=2;
 const run=g.context.BRAX_CHAMPIONSHIP.create('tournament',id,['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'],()=>.4);while(!run.finished){run.next();run.result('win');}const svg=g.context.BRAX_CHAMPIONSHIP.tournamentView(run);assert(svg.includes('MIŚ')&&svg.includes('AZRAK'));assert(!/>BEAR<|>DEMON</.test(svg));assert.equal(run.champion,id);checks+=3;
}
// Exercise online tournament presentation and roster form without changing IDs or nicknames.
const context={window:{},document:{getElementById:()=>({})}};vm.runInNewContext(fs.readFileSync('game/assets/fighter-names.js','utf8'),context);
assert.equal(context.window.BRAX_FIGHTER_NAME('BRAX'),'BRAX');assert.equal(context.window.BRAX_FIGHTER_NAME('DEMON'),'AZRAK');assert.equal(context.window.BRAX_FIGHTER_NAME(null),'');checks+=3;
const html=fs.readFileSync('game/index.html','utf8');assert(html.indexOf('/assets/fighter-names.js')<html.indexOf('/assets/roster.js'));checks++;assert(!/SIŁOWE JUDO|BRUTALNE MMA/.test(html),'visible and accessible style labels agree');checks++;
console.log(JSON.stringify({pass:true,checks,scope:'result win/loss, HUD, help, records, completed tournament; internal IDs preserved. DOM mock, not phone visual test.'}));
})().catch(e=>{console.error(e);process.exitCode=1});
