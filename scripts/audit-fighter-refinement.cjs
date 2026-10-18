const {createGame}=require('./audit-new-fighters.cjs');
const assert=require('node:assert/strict');
(async()=>{
 let checks=0;
 for(let slot=0;slot<6;slot++){
  const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;
  await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
  const reset=()=>{g.send('blur');g.proof.reset();S.training=true;S.trainingBehavior='idle';S.preFight=false;B.x=45;O.x=80;t.faceOpponents();};
  const cfg=t.CFG(),retreat=cfg.BACKFLIP?'BACKFLIP':cfg.BACK_ROLL?'BACK_ROLL':'QUICK_BACK';
  for(const face of [1,-1]){reset();B.x=50;O.x=face===1?80:20;t.faceOpponents();const key=face===1?'ArrowLeft':'ArrowRight';g.send('keydown',{key});g.step(48);g.send('keyup',{key});g.step(48);const start=B.x;g.send('keydown',{key});assert.equal(B.a,retreat);g.send('keyup',{key});g.step(2400);assert((B.x-start)*face<-.5,'retreat has visible backward travel');assert(!B.lock);checks++;
   reset();assert(t.evade());assert.equal(B.a,'LEAN','dedicated evade must remain separate');checks++;
  }
  reset();B.en=100;O.x=50;B.x=35;t.faceOpponents();assert(t.playerButtonAttack('special'));let seen=false,zoom=false,stillSlow=false,lastZoom=1,framing=null;
  g.step(22000,()=>{if(S.comboCinema){const e=S.comboCinema;if(e.framing){if(framing)assert.equal(e.framing,framing,'composition stays fixed across limb animation');framing=e.framing;}const z=S.comboCamera?.z||1;if(!e.releasing)assert(z>=lastZoom-1e-8,'zoom cannot pump between strikes');lastZoom=z;assert(e.timeScale>=.35&&e.timeScale<=1.01,'combo runs at normal tempo, short smooth finisher slow-down');seen=true;stillSlow||=e.timeScale<.7;zoom||=(S.comboCamera?.z||1)>1.02;}assert(Number.isFinite(S.comboCamera?.z||1));});
  assert(seen&&zoom&&stillSlow,'confirmed combo slows and frames the full sequence');assert(!S.comboCinema);assert(Math.abs((S.comboCamera?.z||1)-1)<.01);checks++;
  reset();B.en=100;B.x=10;O.x=90;S.comboReserved=true;assert(t.beginAction('COMBO'));g.step(1000);assert(!S.comboCinema,'a miss must not trigger cinema');checks++;
  reset();assert(t.helpRows(g.state().character,cfg).every(row=>cfg[row.key]?.attack),'help only lists real attacks');
  if(slot===1){reset();const c=cfg.LIGHT_PUNCH;let head=false;O.x=B.x+t.attackDistance(c,t.opponentHurtbox(),B,O);for(const [frame,hit]of Object.entries(c.hits)){B.frame=+frame;B.a='LIGHT_PUNCH';const rect=t.fighterRect(B,c,hit.box,c.anchorY);head||=t.sourceContact(O,rect,null,true)?.region==='head';}assert(head,'Nyxa jab must geometrically reach a head hurtbox');checks++;}
  if(slot===5){reset();K.down=true;assert(t.playerButtonAttack('heavy'));assert.equal(B.a,'ACROBATIC_PUNCH');g.send('blur');g.step(4000);assert(!B.lock);checks++;}
 }
 console.log('PASS',checks,'fighter refinements: separate retreat/evade, full clean combo cinema, miss, reset, real help, head jab and acrobatic attack');
})().catch(e=>{console.error(e);process.exitCode=1;});
