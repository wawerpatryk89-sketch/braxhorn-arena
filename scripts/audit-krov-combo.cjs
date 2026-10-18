const {createGame}=require('./audit-new-fighters.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const results=[];
 for(const slot of [3]){
  const g=await createGame(844,390,true),t=g.test,{B,O,S}=t;
  await g.start();t.selectSlot(slot,true);await g.flush();
  g.elements.get('chooseFighter').dispatch('click');g.elements.get('arena-rooftop').dispatch('click');await g.flush();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
  S.training=true;S.trainingBehavior='idle';
  for(const opponent of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY'])for(const face of [1,-1])for(const edge of [false,true]){
   t.selectOpponent(opponent);t.setupOpponent();g.proof.reset();O.x=edge?(face>0?92:8):50;B.x=O.x-face*22;t.faceOpponents();t.confineFighters();B.en=100;
   assert(t.playerButtonAttack('special'));const hits=new Set();let paired=false,shifted=false;
   g.step(14000,()=>{if(!shifted&&B.hitGroups.has('damage-1')){O.x+=face*3;shifted=true;}for(const key of B.hitGroups)if(/^damage-/.test(key))hits.add(key);paired||=!!S.clinch?.sourcePair;});
   const record={slot,opponent,face,edge,hits:[...hits],hp:O.hp,paired};results.push(record);
   const expected=new Set(Object.values(t.CFG().COMBO.hits).map(h=>h.group)).size;
   assert.equal(hits.size,expected,JSON.stringify(record));
   assert(!S.comboApproach&&!B.lock,'combo returns control');assert(O.hp<100,'contacts cause damage');
  }
 }
 console.log(JSON.stringify({pass:true,scenarios:results.length,realApproach:true,allContactGroups:true,bothFacings:true,edgeCombos:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
