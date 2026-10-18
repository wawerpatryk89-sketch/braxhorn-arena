const{createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
const failures=[];
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
const moves={BEAR:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','SHOULDER','UPPERCUT'],DEMON:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','SHOULDER','UPPERCUT'],BRAX:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','DOUBLE_PUNCH','UPPERCUT','TEEP','CAPOEIRA'],NYXA:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','LUNGE_PUNCH','ELBOW','CLINCH_KNEE','CROUCH_KICK'],VEXA:['HEAVY_PUNCH','LIGHT_PUNCH','LIGHT_KICK','HEAVY_KICK','SPIN_KICK','FLYING_KICK'],KROV:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','ELBOW','UPPERCUT'],NINA:['LIGHT_KICK','HEAVY_PUNCH','MEIA_LUA','HEAVY_KICK','CRESCENT_KICK','SPIN_KICK','LIGHT_PUNCH','GROUND_KICK'],DANNY:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','HOOK','SIDE_KICK']};
(async()=>{let contacts=0,misses=0,recoveries=0;for(const [slot,name]of names.entries()){
 const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);S.training=true;S.trainingBehavior='idle';
 const reset=()=>{g.send('blur');g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=25;O.x=75;t.faceOpponents();};
 for(const targetName of names){t.selectOpponent(targetName);t.setupOpponent();for(const face of [1,-1])for(const role of ['player','cpu'])for(const move of moves[role==='player'?name:targetName]){reset();B.x=face===1?35:65;O.x=50;t.faceOpponents();const actor=role==='player'?B:O,target=role==='player'?O:B,c=(role==='player'?t.CFG():O.cfg)[move];const estimate=t.attackDistance(c,role==='player'?t.opponentHurtbox():t.playerHurtbox(),actor,target);if(estimate<1)continue;// calibrated as never landing on this opponent: the CPU never picks it
 target.x=actor.x+actor.face*estimate;t.faceOpponents();if(role==='player')assert(t.beginAction(move));else t.opponentPose(move,true);g.step(3500);const max=[...new Map(Object.values(c.hits).map(h=>[h.group,h.damage])).values()].reduce((a,b)=>a+b,0);if(target.hp>=100)failures.push({player:name,opponent:targetName,role,move,face,issue:'miss at estimated attack distance'});assert(100-target.hp<=max+.01,'duplicate damage');assert(role==='player'?!B.lock&&!B.anim:!O.locked,'attack stuck');contacts++;}
 }
 for(const move of moves[name]){reset();B.x=9;O.x=91;assert(t.beginAction(move));g.step(3500);assert.equal(O.hp,100,'remote hit '+name+move);misses++;}
 t.selectOpponent(name);t.setupOpponent();
 for(const target of [B,O]){
  reset();if(target===B){K.block=true;}else t.opponentPose('BLOCK');t.damage(target,20,null,{target:'head'});assert.equal(target.hp,100,'effective block damages health '+name);assert(!target.downState);K.block=false;
  reset();target.getupProtection=350;assert(!t.damage(target,20,null,{target:'body'}));assert.equal(target.hp,100);
  reset();for(let i=0;i<4;i++)t.damage(target,15,null,{target:'body'});assert.equal(target.airLaunches,1,'substantial ordinary series launches '+name);g.step(5500);assert(!target.downState,'recovery stuck '+name);recoveries++;
  reset();S.training=false;O.stun=1e9;O.cooldown=1e9;for(let n=0;n<2;n++){target.getupProtection=0;assert(t.launchSource(target));g.step(4500,()=>{O.stun=1e9;O.cooldown=1e9;});assert(target.hp>0&&!S.ended,'nonlethal launch ends round '+name);assert(!target.downState,'launch recovery stuck '+name+JSON.stringify({role:target===B?'player':'cpu',a:target.a,down:target.downState,frame:target.frame,stun:target.stun,clinch:S.clinch}));}
  reset();S.training=false;target.hp=4;t.damage(target,10,null,{target:'body'});assert.equal(target.hp,0,'cannot reach zero health '+name);assert(S.ended,'KO fails to end round '+name);
 }
 console.log('audited',name);
 }require('fs').writeFileSync('docs/verification/audit-147-eight-reach.json',JSON.stringify({contacts,misses,recoveries,failures},null,2));console.log(JSON.stringify({contacts,misses,recoveries,failures}));if(failures.length)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
