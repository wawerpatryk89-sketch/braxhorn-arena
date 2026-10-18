const {createGame}=require('./audit-new-fighters.cjs');
const assert=require('node:assert/strict');
(async()=>{
 for(const slot of [0,1]){
  const g=await createGame(844,390,true);
  await g.start();
  if(slot)g.elements.get('nextFighter').dispatch('click');
  await g.flush();
  g.elements.get('chooseFighter').dispatch('click');
  g.elements.get('arena-rooftop').dispatch('click');await g.flush();
  g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
  const {B,O,S,K}=g.test;S.training=true;S.trainingBehavior='idle';
  const expected=['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK',slot?'ELBOW':'DOUBLE_PUNCH',slot?'CLINCH_KNEE':'TEEP'];
  const cfg=g.test.CFG();
  assert.equal(new Set(expected.map(n=>cfg[n].clip)).size,6,'six distinct supplied attack clips');
  assert(!expected.includes('COMBO'));assert(cfg.COMBO.sequence.length>1);
  const seen=new Set();
  for(const face of [1,-1])for(const direction of [-1,0,1])for(const [i,kind] of ['punch','heavy','kick','kick2'].entries()){
   g.send('blur');g.proof.reset();B.x=50;O.x=face>0?85:15;g.test.faceOpponents();
   const screenDirection=direction*face;K.left=screenDirection<0;K.right=screenDirection>0;
   const button=g.buttons.find(b=>b.dataset.tap===kind);
   button.dispatch('pointerdown',{pointerId:50+i});
   const wanted=expected[direction>0&&i<2?i+4:i];
   assert.equal(B.a,wanted,`slot=${slot} face=${face} direction=${direction} button=${kind}`);
   seen.add(B.a);button.dispatch('pointerup',{pointerId:50+i});
  }
  assert.equal(seen.size,6);assert(!seen.has('CROUCH_KICK'));
  console.log('PASS',slot?'NYXA':'BRAX','six distinct attacks through touch controls, both sides, forward/back/neutral; combo separate');
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
