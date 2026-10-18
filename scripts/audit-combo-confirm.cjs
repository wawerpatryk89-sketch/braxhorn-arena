const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
(async()=>{let checks=0;
for(let slot=0;slot<names.length;slot++){
 const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 for(const other of names)for(const role of ['player','cpu','remote-guest'])for(const region of ['body','leg']){
  t.selectOpponent(other);t.setupOpponent();const a=role==='player'?B:O,z=a===B?O:B;
  function start(){g.proof.reset();S.training=true;S.trainingBehavior='idle';K.block=K.down=false;S.comboReserved=true;if(a===B)assert(t.beginAction('COMBO'));else t.opponentPose('COMBO',true);return (a===B?'player-':'cpu-')+a.attackSerial;}
  let token=start();const hit=(group,guard=false,extra={})=>{z.stun=0;z.downState=null;z.getupProtection=0;const c=(z===B?t.CFG():O.cfg).IDLE;t.damage(z,1,null,{target:region,group,moveName:'COMBO',kickToken:token,comboPart:true,defense:{a:'IDLE',config:c,frame:0,guard,low:region==='leg',getupProtection:0},...extra});return z.lastHitBlocked;};
  assert(hit(0,true),'first hit can be blocked');assert(!hit(1));assert(hit(2,true),'only one clean hit does not confirm');assert(!hit(3));assert(!hit(4,true),'third clean hit ignores matching guard');assert(!hit(5,true),'remaining combo ignores guard');checks++;
  token=start();hit(0);hit(0);assert(hit(1,true),'duplicate group is not two hits');checks++;
  token=start();hit(0);hit(1);assert(hit(2,true,{kickToken:token+'stale'}),'different action does not inherit');assert(hit(2,true,{moveName:'LIGHT_PUNCH',comboPart:false}),'basic attack does not inherit');checks++;
  token=start();assert(hit(0,true));assert(hit(1,true));assert(hit(2,true),'fully guarded combo remains guardable');checks++;
  token=start();hit(0);hit(1);if(a===B){B.lock=false;t.restore();S.comboReserved=true;t.beginAction('COMBO');}else t.opponentPose('COMBO',true);token=(a===B?'player-':'cpu-')+a.attackSerial;assert(hit(0,true),'new combo resets');checks++;
  token=start();hit(0);hit(1);if(a===B){B.lock=false;t.restore();}else t.opponentPose('IDLE');assert(hit(2,true),'interrupted action resets');checks++;
  token=start();hit(0);hit(1);g.proof.reset();assert(!a.comboConnection,'round reset');checks++;
 }
}
console.log(JSON.stringify({pass:true,checks,roster:8,roles:['player','cpu','remote-guest host-side actor'],guards:['high','low'],rule:'two distinct clean hits confirm only the current combo',limitations:'shared authoritative damage path tested; two physical phones not tested'}));
})().catch(e=>{console.error(e);process.exitCode=1});
