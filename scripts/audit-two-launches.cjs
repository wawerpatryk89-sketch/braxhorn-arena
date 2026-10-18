const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{const results=[];for(const slot of [0,1,2,3,4,5,6,7]){
 const g=await require('./review/runtime.cjs').ready(require('./review/runtime.cjs').names[slot]),t=g.test,{B,O,S,K}=t;
 const step=n=>{for(let i=0;i<n;i++)t.physics(1000/60);};
 for(const target of [B,O]){
  require('./review/runtime.cjs').reset(g);S.training=true;S.trainingBehavior='idle';B.x=20;O.x=80;t.faceOpponents();
  t.damage(target,14,null,{target:'body'});t.damage(target,14,null,{target:'body'});assert(!target.downState,'two heavy hits do not launch');assert.equal(target.airLaunches,0);step(300);assert(!target.downState);assert(target.hp>0);
  require('./review/runtime.cjs').reset(g);S.training=true;S.trainingBehavior='idle';B.x=20;O.x=80;t.faceOpponents();assert(t.launchSource(target));assert.equal(target.airLaunches,1);assert(!t.launchSource(target),'cannot count same launch twice');const states=new Set();for(let i=0;i<420;i++){states.add(target.a);t.physics(1000/60);}for(const phase of ['FLY','FLY_LAND','FLY_DOWN','GETUP','IDLE'])assert(states.has(phase),phase);assert(target.hp>0);assert(!S.ended);
  S.training=false;S.t=60;B.x=10;O.x=90;O.cooldown=1e9;assert(t.launchSource(target));assert.equal(target.airLaunches,2);const hp=target.hp;step(420);assert(!target.downState);assert.equal(target.hp,hp,'second launch does not invent KO damage');assert(!S.ended);target.getupProtection=0;t.damage(target,100,null,{target:'body'});assert.equal(target.hp,0);assert(S.ended);results.push({slot,target:target===B?'player':'opponent'});
 }
 // A landed paired throw works across Brax/Nyxa and never consumes a launch.
 require('./review/runtime.cjs').reset(g);S.training=true;S.trainingBehavior='idle';B.x=50;let paired=false;for(let gap=1;gap<20;gap+=.1){O.x=50+gap;t.faceOpponents();K.down=true;if(t.beginSourcePair(B)){paired=true;break;}}if([4,5].includes(slot)){assert(!paired,'NINA and DANNY have no paired throw');continue;}assert(paired);step(360);assert(O.hp<100&&O.hp>0,'paired throw deals actual damage');assert.equal(O.airLaunches,0);assert.equal(O.a,'IDLE');assert(!S.clinch);
 }console.log(JSON.stringify({pass:true,results}));})().catch(e=>{console.error(e);process.exitCode=1;});
