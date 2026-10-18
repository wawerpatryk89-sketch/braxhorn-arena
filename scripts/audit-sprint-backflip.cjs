const assert=require('node:assert/strict');
const {createGame}=require('./audit-new-fighters.cjs');
(async()=>{let strikes=0,flips=0;const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY'];
for(let slot=0;slot<6;slot++){
 const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;
 await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 function setup(face=1){g.proof.reset();S.training=true;S.trainingBehavior='idle';S.preFight=false;S.paused=false;B.x=face>0?25:75;O.x=face>0?90:10;t.faceOpponents();}
 for(const face of[1,-1])for(const kind of['punch','heavy','kick','kick2']){
  setup(face);const key=face>0?'ArrowRight':'ArrowLeft';g.key(key);g.step(48);g.key(key,false);g.step(48);g.key(key);g.step(48);assert.equal(B.a,'RUN',JSON.stringify({slot,face,kind,sprint:B.sprintHeld,K}));
  const x=B.x;assert(t.playerButtonAttack(kind));assert(B.strikeMotion,`${names[slot]} ${kind} through real input did not carry sprint`);
  const active=t.CFG()[B.a],leg=Object.values(active.hits).some(h=>/Foot|Leg|Toe/.test(h.bone||''));
  let previous=B.x;for(let i=0;i<9;i++){g.step(16);assert((B.x-previous)*face>0,'unexpected stop before contact');previous=B.x;}
  assert(Math.abs(B.x-x)>.5);if(!leg)assert(B.strikeMotion.weight>.5,'no running legs');
  let fullFrames=0;while(B.anim&&fullFrames++<180){const before=B.x;g.step(16);assert((B.x-before)*face>0,'stopped mid-strike');}assert(fullFrames<180,'strike did not finish');assert.equal(B.a,'RUN','did not flow back to sprint');
  g.key(key,false);const released=B.x;g.step(80);assert(Math.abs(B.x-released)<.01,'moves after release');strikes++;
 }
 if(slot!==0)continue;
 for(const face of[1,-1])for(const touch of[false,true])for(const edge of[false,true]){
  setup(face);B.x=edge?(face>0?16:84):50;O.x=face>0?90:10;t.faceOpponents();
  const key=face>0?'ArrowLeft':'ArrowRight',hold=face>0?'left':'right',button=g.buttons.find(x=>x.dataset.hold===hold);
  const down=()=>touch?button.dispatch('pointerdown',{pointerId:44}):g.key(key),up=()=>touch?button.dispatch('pointerup',{pointerId:44}):g.key(key,false);
  down();g.step(60);assert.notEqual(B.a,'BACKFLIP','single press flips');up();g.step(60);down();assert.equal(B.a,'BACKFLIP','double back failed');
  const start=B.x,hp=O.hp;up();let frames=new Set();g.step(1600,()=>{if(B.a==='BACKFLIP')frames.add(B.frame);assert((O.x-B.x)*face>0);const limit=t.visibleLimits(B);assert(B.x>=limit.min-.01&&B.x<=limit.max+.01,'outside arena');});
  assert(frames.size>45,'not animated');assert((B.x-start)*face<0,'not backwards');assert(!B.lock&&!B.anim,'stuck after landing');assert.equal(O.hp,hp,'salto damages target');flips++;
 }
 setup();g.key('ArrowLeft');g.key('ArrowLeft',false);g.step(400);g.key('ArrowLeft');assert.notEqual(B.a,'BACKFLIP','slow taps trigger');g.key('ArrowLeft',false);
 setup();assert(t.beginAction('HEAVY_PUNCH'));g.key('ArrowLeft');g.key('ArrowLeft',false);g.step(48);g.key('ArrowLeft');assert.notEqual(B.a,'BACKFLIP','cancels committed attack');
 // A drawn final round still celebrates the fighter who won the match.
 for(const champion of[0,1]){setup();S.training=false;S.round=3;S.wins=champion===0?[1,0]:[0,1];B.hp=O.hp=40;t.endRound();g.step(400);assert.equal(S.celebration.actor,champion===0?B:O);assert.equal(S.celebration.action,'WIN_MATCH');}
 setup();S.training=false;S.round=3;S.wins=[1,1];B.hp=O.hp=40;t.endRound();g.step(400);assert.equal(S.celebration.actor,null,'draw gets winner');
}
console.log(JSON.stringify({pass:true,strikes,flips,checks:['real sprint buttons','both facings','hands and kick preservation','release stops travel','keyboard and touch double back','walls','no attack cancel','no phantom damage','match winner after tied final round']}));
})().catch(e=>{console.error(e);process.exitCode=1});
