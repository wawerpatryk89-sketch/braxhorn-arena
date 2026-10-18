const {createGame}=require('./audit-new-fighters.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
async function enter(slot=2){const g=await createGame(844,390,true);await g.start();for(let i=0;i<slot;i++)g.elements.get('nextFighter').dispatch('click');await g.flush();g.elements.get('chooseFighter').dispatch('click');g.elements.get('arena-rooftop').dispatch('click');await g.flush();if(slot!==2)g.elements.get('fighterFilm').dispatch('ended');g.step(17000);g.test.S.training=true;g.test.S.trainingBehavior='idle';g.proof.reset();return g;}
(async()=>{
 const g=await enter(),t=g.test,{B,O,S,K}=t;
 assert.equal(g.state().character,'VEXA');assert(!S.preFight&&!S.cinematic);
 vm.runInNewContext(fs.readFileSync('game/assets/roster.js','utf8'),g.context);
 g.context.BRAX_ROSTER.bind(index=>t.selectSlot(index,true));
 g.elements.get('card-vexa').dispatch('click');assert.equal(g.context.BRAX_ROSTER.state().player,2);
 g.elements.get('card-vexa').dispatch('click');assert.equal(g.context.BRAX_ROSTER.opponent,'VEXA');
 const expected=['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','SPIN_KICK','FLYING_KICK'],cfg=t.CFG();assert.equal(new Set(expected.map(n=>cfg[n].clip)).size,6);
 const seen=new Set();
 for(const face of [1,-1])for(const dir of [-1,0,1])for(const [i,kind]of ['punch','heavy','kick','kick2'].entries()){
  g.send('blur');g.proof.reset();B.x=50;O.x=face>0?85:15;t.faceOpponents();K.left=dir*face<0;K.right=dir*face>0;
  const button=g.buttons.find(b=>b.dataset.tap===kind);button.dispatch('pointerdown');const wanted=expected[dir>0&&i<2?i+4:i];assert.equal(B.a,wanted);seen.add(B.a);button.dispatch('pointerup');g.send('blur');g.step(2500);assert(!B.lock);
 }
 assert.equal(seen.size,6);
 g.proof.reset();B.x=20;O.x=80;const frames=new Set();g.step(2500,()=>frames.add(B.frame));assert(frames.size>100,'idle is animated');
 const right=g.buttons.find(b=>b.dataset.hold==='right');right.dispatch('pointerdown',{pointerId:90});g.step(500);assert.equal(B.a,'WALK_FORWARD');right.dispatch('pointerup',{pointerId:90});g.step(350);right.dispatch('pointerdown',{pointerId:91});g.step(32);right.dispatch('pointerup',{pointerId:91});g.step(32);right.dispatch('pointerdown',{pointerId:92});g.step(64);assert.equal(B.a,'RUN');right.dispatch('pointerup',{pointerId:92});g.send('blur');
 g.proof.reset();t.jump();assert(B.jumpTime!==null);let airborne=false;g.step(2500,()=>{airborne||=!B.ground;});assert(airborne&&B.ground&&B.jumpTime===null);
 g.proof.reset();K.block=true;g.step(32);assert.equal(B.a,'BLOCK');const hp=B.hp;t.damage(B,10);assert(B.hp<hp&&B.hp>hp-10);K.block=false;
 g.proof.reset();assert(t.evade());let protectedFrames=0;for(let i=0;i<50;i++){if(B.a==='LEAN'&&B.frame>=cfg.LEAN.evadeFrames[0]&&B.frame<=cfg.LEAN.evadeFrames[1]){const hp=B.hp;assert.equal(t.damage(B,1,null,{target:'head'}),false);assert.equal(B.hp,hp);protectedFrames++;}g.step(16);}assert(protectedFrames>0,'duck has a protected window');
 // Real combo entry and contacts against each body type from either side.
 const comboResults=[];
 for(const opponent of ['BRAX','NYXA','VEXA','KROV'])for(const face of [1,-1]){
  t.selectOpponent(opponent);t.setupOpponent();g.proof.reset();B.x=face>0?35:65;O.x=50;t.faceOpponents();B.en=100;
  assert(t.playerButtonAttack('special'));const groups=new Set();g.step(6500,()=>{for(const key of B.hitGroups)if(/^damage-/.test(key))groups.add(key);});
  assert.equal(groups.size,5,'all five combo contacts');assert(!B.lock&&!S.comboApproach,'combo returns control');assert(O.hp<100,'combo lands');assert.equal(O.airLaunches,1,JSON.stringify({message:'finishing kick launches once',opponent,face,groups:[...groups],hp:O.hp}));
  comboResults.push({opponent,face,groups:[...groups],hp:O.hp});
 }
 // Ordinary knockdown recovers; the second airborne launch ends the round.
 g.proof.reset();B.x=15;O.x=85;t.knockdown(B);g.step(4000);assert(!B.downState&&B.a==='IDLE');
 assert(t.launchSource(B));g.step(6000);assert(B.hp>0&&!B.downState);S.training=false;S.t=60;B.x=15;O.x=85;assert(t.launchSource(B));let n=0;while(!S.ended&&n++<300)t.physics(1000/60);assert(S.ended&&B.hp===0&&B.a==='KO_HOLD');
 console.log(JSON.stringify({pass:true,character:'VEXA',sixInputs:true,roster:true,jump:true,run:true,guard:true,evade:true,comboResults,twoLaunchKO:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
