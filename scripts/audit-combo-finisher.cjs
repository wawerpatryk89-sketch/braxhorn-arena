const {createGame}=require('./audit-new-fighters.cjs');
const assert=require('node:assert/strict');
(async()=>{
 let checks=0;
 const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;
 await g.start();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 for(const name of ['BRAX','NYXA','VEXA','KROV','NINA','DANNY']){
  t.selectOpponent(name);t.setupOpponent();
  for(const cooldown of [0,2000]){
   g.proof.reset();S.training=true;S.trainingBehavior='idle';S.preFight=false;O.knockdownCooldown=cooldown;O.hitSeries=null;
   assert(t.damage(O,1,null,{comboPart:true,comboFinish:true,kickToken:'isolated-final'}));
   assert.equal(O.downState?.phase,'FLY',name+' isolated finisher must launch');
   let landed=false;g.step(10000,()=>{landed||=['FALL','LAND','DOWN','GETUP'].includes(O.downState?.phase);});
   assert(landed,name+' flight must end on ground');checks++;
  }
  g.proof.reset();S.training=true;S.trainingBehavior='idle';S.preFight=false;
  for(let i=0;i<3;i++){
   t.damage(O,14,null,{kickToken:'heavy-'+i,target:'body'});
   if(i<2){assert(!O.downState,'one or two heavy attacks do not launch');g.step(2800);}
  }
  assert.equal(O.downState?.phase,'FLY',name+' three heavy attacks launch across longer intervals');checks++;
  g.proof.reset();S.training=true;S.trainingBehavior='idle';S.preFight=false;t.opponentPose('BLOCK',true);
  t.damage(O,10,null,{comboPart:true,comboFinish:true,target:'body'});assert(O.lastHitBlocked);assert(!O.downState,'blocked finisher cannot launch');checks++;
 }
 console.log('PASS',checks,'isolated finishers, recovery cooldown, flight-to-ground, blocked finishers');
})().catch(e=>{console.error(e);process.exitCode=1;});
