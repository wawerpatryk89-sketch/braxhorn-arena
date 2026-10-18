const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
(async()=>{let checks=0;
for(const slot of [6,7]){
 const g=await createGame(844,390,true);await g.start();g.test.selectSlot(slot,true);await g.flush();await g.test.begin();g.step(17000);assert(g.state().running&&!g.state().preFight);assert.equal(g.state().character,names[slot]);assert(g.elements.get('selectionImage').src.endsWith(names[slot].toLowerCase()+'.webp'));assert(!String(g.elements.get('fighterFilm').src).includes('undefined'));
 for(const other of names){g.test.selectOpponent(other);g.test.setupOpponent();for(const forward of [false,true])for(const key of ['punch','heavy','kick','kick2']){
 g.proof.reset();g.test.S.training=true;g.test.S.trainingBehavior='idle';g.test.B.x=35;g.test.O.x=55;g.test.faceOpponents();g.test.K.right=forward;assert(g.test.playerButtonAttack(key));g.test.K.right=false;g.step(9000);assert(!g.test.B.lock&&!g.test.B.anim,names[slot]+' recovered '+key);assert(Number.isFinite(g.test.B.x)&&Number.isFinite(g.test.O.x));checks++;
 }}
}
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('game/assets/championship.js','utf8'),ctx);
for(const n of names){const c=ctx.window.BRAX_CHAMPIONSHIP.create('tournament',n,names,()=>.4);let played=0;while(!c.finished){assert(c.next());assert(ctx.window.BRAX_CHAMPIONSHIP.tournamentView(c).includes('ośmiu'));c.result('win');played++;}assert.equal(played,3);assert.equal(c.champion,n);assert.equal(c.rounds.flat().length,7);}
console.log(JSON.stringify({pass:true,inputCases:checks,eightPlayerTournamentCases:8,limitation:'mock rendering; device motion and gameplay balance unverified'}));
})().catch(e=>{console.error(e);process.exitCode=1});
