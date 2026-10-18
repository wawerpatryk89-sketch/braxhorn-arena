const fs=require('node:fs'),assert=require('node:assert/strict');
const {createGame}=require('../audit-new-fighters.cjs');
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
async function ready(who='BRAX',options={}){
 const raw=options.combatSource||fs.readFileSync(process.env.BRAX_REVIEW_ENGINE||'game/assets/combat.js','utf8');
 const source=raw.replace('window.__BRAX_PROOF__=','window.__REVIEW__={SOURCE_ATTACKS,DIFFICULTY,reset,pressureDisengaged};window.__BRAX_PROOF__=');
 const g=await createGame(844,390,true,null,{...options,combatSource:source});await g.start();g.test.selectSlot(names.indexOf(who),true);await g.flush();await g.test.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);g.proof.reset();Object.assign(g.test.S,{running:true,paused:false,preFight:false,cinematic:false,training:true,trainingBehavior:'idle',ended:false,hitstop:0});assert.equal(g.test.B.hp,100);return g;
}
function reset(g,{training=true,level='normal'}={}){g.test.S.difficulty=level;g.proof.reset();Object.assign(g.test.S,{running:true,paused:false,preFight:false,cinematic:false,training,trainingBehavior:'idle',ended:false,hitstop:0,difficulty:level});g.test.B.x=40;g.test.O.x=60;g.test.faceOpponents();}
function seed(g,n){g.context.Math=Object.create(Math);g.context.Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);}
function csv(file,rows){const keys=[...new Set(rows.flatMap(Object.keys))];fs.writeFileSync(file,keys.join(',')+'\n'+rows.map(r=>keys.map(k=>'"'+String(typeof r[k]==='object'?JSON.stringify(r[k]):r[k]??'').replaceAll('"','""')+'"').join(',')).join('\n')+'\n');}
module.exports={ready,reset,seed,names,csv};
