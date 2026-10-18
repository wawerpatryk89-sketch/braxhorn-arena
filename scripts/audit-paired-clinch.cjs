const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{let cases=0;for(let slot=0;slot<6;slot++){
 const g=await createGame(844,390,true),t=g.test,{B,O,S}=t;await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 for(const who of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY'])for(const face of [-1,1])for(const fall of [false,true])for(const wall of [false,true])for(const player of [true,false]){
 t.selectOpponent(who);t.setupOpponent();g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=wall?(face>0?78:22):47;O.x=B.x+face*6;t.faceOpponents();t.separateFighters();
 const a=player?B:O,z=player?O:B;assert(t.beginShowcaseContact(fall,a));const gap=Math.abs(O.x-B.x);let closed=false;
 assert.equal(a.a,'CONTACT_PUSH');assert.equal(z.a,'CONTACT_RECEIVE');
 g.step(3300,()=>{if(S.clinch?.showcase){assert.equal(B.face,-O.face);assert.equal(t.playerButtonAttack('punch'),false);}else if(!closed){closed=true;assert(player?!B.lock:!O.locked,'pusher regains control');if(fall){assert.equal(z.downState?.phase,'CONTACT_FALL');assert(!a.downState);}else assert(Math.abs(O.x-B.x)>gap+3,'visible separation');assert(S.contactCooldown>0);}});
 assert(closed);g.step(5000);assert(!B.downState&&!O.downState,'recovery completes');assert.equal(B.hp,100);assert.equal(O.hp,100);cases++;
 }
}console.log(JSON.stringify({pass:true,cases,checks:['36 pairs','both roles, directions and walls','normal and fall choreography','pusher unlocked during fall','no push damage','recovery completes']}));})().catch(e=>{console.error(e);process.exitCode=1});
