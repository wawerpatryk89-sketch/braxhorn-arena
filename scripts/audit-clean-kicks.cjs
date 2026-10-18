const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{
 const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;
 await g.start();t.selectSlot(0,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 let checks=0;
 for(const victim of[B,O]){
  const reset=()=>{g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=20;O.x=80;};
  const idle=()=>{victim.stun=0;if(victim===B){B.lock=false;B.anim=null;K.block=false;t.restore();}else t.opponentPose('IDLE');};
  const kick=(id,extra={})=>{idle();t.damage(victim,10,null,{moveName:'LIGHT_KICK',kickToken:id,...extra});};
  reset();kick('a');assert(!victim.downState,'first kick launched');kick('a');assert(!victim.downState,'same action counted twice');kick('b');assert(!victim.downState,'two light kick actions do not launch');kick('c');assert(!victim.downState,'34 pressure is below 36');kick('d');assert.equal(victim.downState?.phase,'FLY');assert.equal(victim.cleanKickMs,0);checks++;
  reset();kick('a');idle();g.step(2600);kick('b');assert(!victim.downState,'expired pair launched');checks++;
  reset();kick('a');idle();if(victim===B)K.block=true;else t.opponentPose('BLOCK');t.damage(victim,10,null,{moveName:'HEAVY_KICK',kickToken:'block'});kick('b');assert(!victim.downState,'blocked kick did not reset pair');kick('c');assert(!victim.downState,'two post-block actions do not launch');kick('d',{moveName:'HEAVY_KICK'});kick('e',{moveName:'HEAVY_KICK'});assert(victim.downState);checks++;
  reset();for(let i=0;i<3;i++){kick('p'+i,{moveName:'HEAVY_PUNCH'});if(i<2)assert(!victim.downState,'fewer than three heavy actions');}assert(victim.downState,'three heavy punch actions launch');checks++;
  reset();kick('a',{comboPart:true});kick('b');assert(!victim.downState,'combo sub-hit primed launch');checks++;
  reset();victim.knockdownCooldown=3500;kick('a');kick('b');assert(!victim.downState,'recovery cooldown bypassed');checks++;
  reset();kick('a');g.proof.reset();assert.equal(victim.cleanKickMs,0);checks++;
 }
 console.log(JSON.stringify({pass:true,checks,seriesLifetimeMs:3500,targets:['player','cpu']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
