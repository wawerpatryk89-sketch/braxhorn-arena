const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{let cases=0;const roster=['BRAX','NYXA','VEXA','KROV','NINA','DANNY'];for(let slot=0;slot<6;slot++){
const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
for(const who of roster)for(const player of [true,false])for(const blocked of [true,false]){
t.selectOpponent(who);t.setupOpponent();g.proof.reset();S.training=true;S.trainingBehavior='idle';B.en=O.en=0;B.x=35;O.x=50;t.faceOpponents();const a=player?B:O,z=player?O:B,c=(player?t.CFG():O.cfg).LIGHT_PUNCH;
z.x=a.x+a.face*t.attackDistance(c,player?t.opponentHurtbox():t.playerHurtbox(),a,z);t.faceOpponents();if(player)t.beginAction('LIGHT_PUNCH');else t.opponentPose('LIGHT_PUNCH',true);
for(const frame of Object.keys(c.hits).map(Number)){a.frame=frame;z.stun=0;if(player)t.opponentPose(blocked?'BLOCK':'IDLE');else{t.restore();K.block=blocked;}const hpBefore=z.hp,energyBefore=a.en;if(player)t.resolvePlayerHit();else t.resolveOpponentHit();if(z.hp===hpBefore)assert.equal(a.en,energyBefore,'miss or regional block gives no energy');}
assert.equal(a.en,z.hp===100?0:c.gain,'energy once per clean action, same rule for both roles');if(!blocked)assert(z.hp<100);if(z.hp===100)assert.equal(S.combo,0);K.block=false;cases++;
}
}console.log(JSON.stringify({pass:true,cases,checks:['no energy from blocks','one gain per multi-hit action','same player/CPU rule']}));})().catch(e=>{console.error(e);process.exitCode=1});
