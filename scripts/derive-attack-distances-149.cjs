// Calibrate AI approach distances for every fighter pair and every button move against the actual engine.
// A move whose estimated attack distance misses gets the largest range (px) that lands from both sides.
// Writes AI_CONTACT_DISTANCES in game/assets/combat.js (data only). Never touches fighter configs.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createGame}=require('./audit-new-fighters.cjs');
const path='game/assets/combat.js',names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
const source=fs.readFileSync(path,'utf8');
const engine=source.replace('window.__BRAX_PROOF__=','window.__CAL__={AI_CONTACT_DISTANCES,SOURCE_ATTACKS};window.__BRAX_PROOF__=');
const merged=JSON.parse(source.match(/const AI_CONTACT_DISTANCES=(\{.*?\});\n/)[1]),tables=[];
(async()=>{let fixed=0,checked=0;for(const [slot,who] of names.entries()){
 const g=await createGame(844,390,true,null,{combatSource:engine}),t=g.test,{B,O,S}=t;await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 const table=g.context.__CAL__.AI_CONTACT_DISTANCES;tables.push(table);const list=[...new Set(g.context.__CAL__.SOURCE_ATTACKS[who])];
 const lands=(c,move)=>{for(const face of [1,-1]){g.send('blur');g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=face===1?35:65;O.x=50;t.faceOpponents();O.x=B.x+B.face*t.attackDistance(c,t.opponentHurtbox(),B,O);t.faceOpponents();assert(t.beginAction(move));g.step(3500);if(O.hp>=100)return false;}return true;};
 for(const other of names){t.selectOpponent(other);t.setupOpponent();for(const move of list){const c=t.CFG()[move];checked++;
  if(lands(c,move))continue;const keep=c.attackRangeByOpponent?{...c.attackRangeByOpponent}:undefined;let found=null;
  for(let range=280;range>=60;range-=5){c.attackRangeByOpponent={...(keep||{}),[other]:range};delete (table[who]?.[other]||{})[move];if(lands(c,move)){found=range;break;}}
  if(keep)c.attackRangeByOpponent=keep;else delete c.attackRangeByOpponent;
  if(!found){found=1;console.log('NEVER LANDS',who,other,move);}// 1px: the CPU never picks it against this opponent.
  ((table[who]??={})[other]??={})[move]=found;((merged[who]??={})[other]??={})[move]=found;fixed++;console.log(who,other,move,found);}}
}
const out=source.replace(/const AI_CONTACT_DISTANCES=\{.*?\};\n/,`const AI_CONTACT_DISTANCES=${JSON.stringify(merged)};\n`);fs.writeFileSync(path,out);
console.log(JSON.stringify({checked,fixed}));})().catch(e=>{console.error(e);process.exitCode=1});
