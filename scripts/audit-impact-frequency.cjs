const{createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{let count=0;const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;await g.start();await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
for(const name of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'])for(const strength of [11,14]){t.selectOpponent(name);t.setupOpponent();g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=20;O.x=70;t.faceOpponents();
for(let i=0;i<3;i++){t.damage(O,strength,null,{moveName:'HEAVY_PUNCH',kickToken:'heavy-'+i});if(i<2){assert(!O.downState,'single/double ordinary hit launched too soon');K.right=B.face>0;K.left=B.face<0;g.step(1000);K.right=K.left=false;}}
assert(O.a==='FLY',name+' three spaced hits should launch');g.step(6000);assert(!O.downState,name+' did not recover');count++;}
g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=20;O.x=70;for(let i=0;i<10;i++){t.damage(O,7,null,{moveName:'LIGHT_PUNCH',kickToken:'same-action'});g.step(400);assert(!O.downState,'one multi-hit light action cannot farm launch pressure');}
g.proof.reset();t.opponentPose('BLOCK');for(let i=0;i<5;i++)t.damage(O,14);assert(!O.downState&&O.hp===100,'blocked hits launched');
console.log('PASS',count,'spaced impact series; one repeated light-action token and blocks do not launch');})().catch(e=>{console.error(e);process.exitCode=1});
