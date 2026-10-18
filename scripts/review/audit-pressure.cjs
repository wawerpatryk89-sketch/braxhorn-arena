const {ready,reset,names,csv}=require('./runtime.cjs'),assert=require('node:assert/strict');
(async()=>{const rows=[];for(const who of names){const g=await ready(who),t=g.test,{B,O,S,K}=t;reset(g);const action='HEAVY_PUNCH',landed=new Set();let launchAt=null,hits=0;
for(let ms=0;ms<20000;ms+=16){K.right=B.face>0;K.left=B.face<0;if(!B.lock&&!B.stun)t.beginAction(action);const hp=O.hp;g.step(16);if(O.hp<hp){landed.add(B.attackSerial);hits++;}O.hp=100;if(O.downState?.phase==='FLY'){launchAt=ms;break;}}
assert.notEqual(launchAt,null,who+' natural pressure launches');assert.equal(landed.size,3,who+' exactly three heavy actions');
reset(g);K.right=K.left=false;B.x=20;O.x=80;t.damage(O,14,null,{moveName:action,kickToken:'retreat'});O.pushTime=0;O.stun=0;t.opponentPose('IDLE');t.beginAction('IDLE');K.left=true;
for(let ms=0;ms<800;ms+=16)t.physics(16);assert.equal(O.hitSeries,null,who+' deliberate retreat clears series');
rows.push({who,action,hits,heavyActions:landed.size,launchAt,retreatReset:'PASS',status:'PASS'});}
csv('docs/review-v147/after/pressure-acceptance.csv',rows);console.log(JSON.stringify(rows,null,2));})();
