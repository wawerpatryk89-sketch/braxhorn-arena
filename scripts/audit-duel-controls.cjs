const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{let checks=0;for(const fighter of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY']){const g=await createGame(844,390,true),t=g.test,E=g.context.BRAX_MULTIPLAYER_ENGINE,{B,O,S}=t;await E.start('host',{hostFighter:'BRAX',guestFighter:fighter,arena:'snow'});E.go();g.step(17000);let id=0;const input=(held,kind)=>E.input({held,events:kind?[{id:++id,kind}]:[],visible:true});
const reset=()=>{g.proof.reset();S.preFight=false;B.x=20;O.x=80;B.en=O.en=100;t.faceOpponents();};
for(const kind of ['punch','heavy','kick','kick2','evade']){reset();input({},kind);g.step(32);assert(O.cfg[O.a]?.attack||O.a==='LEAN',fighter+' '+kind);checks++;}
reset();input({right:true},'right');g.step(32);input({},null);g.step(64);input({right:true},'right');g.step(32);assert(['BACKFLIP','BACK_ROLL','QUICK_BACK'].includes(O.a));checks++;
reset();B.x=40;O.x=60;t.faceOpponents();input({},'special');let launched=false;g.step(24000,()=>{launched||=B.downState?.phase==='FLY';});assert(launched,fighter+' remote combo launches opponent');checks++;
reset();input({block:true},null);g.step(32);assert.equal(O.a,fighter==='NINA'?'LEAN':'BLOCK');checks++;
if(O.cfg.ACROBATIC_PUNCH){reset();input({down:true},'heavy');g.step(32);assert.equal(O.a,'ACROBATIC_PUNCH');checks++;}
E.stop();}console.log('PASS',checks,'remote attacks, dedicated evade, double back, guard, acrobatic punch and all six combo finishers');})().catch(e=>{console.error(e);process.exitCode=1});
