const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{const results=[];for(const slot of [0,1]){
 const g=await createGame(844,390,true);await g.start();if(slot)g.elements.get('nextFighter').dispatch('click');await g.flush();g.elements.get('chooseFighter').dispatch('click');g.elements.get('arena-rooftop').dispatch('click');await g.flush();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);const t=g.test,{B,O,S,K}=t;
 const step=n=>{for(let i=0;i<n;i++)t.physics(1000/60);};
 for(const target of [B,O]){
  g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=20;O.x=80;t.faceOpponents();
  t.damage(target,14,null,{target:'body'});t.damage(target,14,null,{target:'body'});assert.equal(target.downState.phase,'FALL');assert.equal(target.airLaunches,0);step(300);assert(!target.downState);assert(target.hp>0);
  g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=20;O.x=80;t.faceOpponents();assert(t.launchSource(target));assert.equal(target.airLaunches,1);assert(!t.launchSource(target),'cannot count same launch twice');const states=new Set();for(let i=0;i<420;i++){states.add(target.a);t.physics(1000/60);}for(const phase of ['FLY','FLY_LAND','FLY_DOWN','GETUP','IDLE'])assert(states.has(phase),phase);assert(target.hp>0);assert(!S.ended);
  S.training=false;S.t=60;B.x=10;O.x=90;assert(t.launchSource(target));assert.equal(target.airLaunches,2);assert(target.hp>0,'KO waits for landing');let n=0;while(!S.ended&&n++<300)t.physics(1000/60);assert(S.ended);assert.equal(target.hp,0);assert.equal(target.a,'KO_HOLD');results.push({slot,target:target===B?'player':'opponent',landingMs:Math.round(n*1000/60)});
 }
 // A landed paired throw works across Brax/Nyxa and never consumes a launch.
 g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=50;let paired=false;for(let gap=1;gap<20;gap+=.1){O.x=50+gap;t.faceOpponents();K.down=true;if(t.beginSourcePair(B)){paired=true;break;}}assert(paired);step(360);assert.equal(O.hp,slot?89:88);assert.equal(O.airLaunches,0);assert.equal(O.a,'IDLE');assert(!S.clinch);
 }console.log(JSON.stringify({pass:true,results}));})().catch(e=>{console.error(e);process.exitCode=1;});
