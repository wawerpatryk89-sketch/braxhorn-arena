const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY'],report=[];
for(const cpu of names){const g=await createGame(844,390,true),t=g.test,{B,O,S}=t;await g.start();await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);t.selectOpponent(cpu);t.setupOpponent();
 for(const level of ['easy','normal','hard']){
  g.elements.get('mode-'+level).dispatch('click');g.proof.reset();S.training=false;S.preFight=false;S.running=true;S.paused=false;B.x=20;O.x=80;t.faceOpponents();
  let seed=71;g.context.Math=Object.create(Math);g.context.Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  let prev='',attacks=0,first=null,damage=0,maxIdle=0,idle=0;const moves=new Set();
  for(let ms=0;ms<30000;ms+=16){g.step(16);if(O.cfg[O.a].attack){if(prev!==O.a){attacks++;moves.add(O.a);if(first===null)first=ms;}idle=0;}else{idle+=16;maxIdle=Math.max(maxIdle,idle);}prev=O.a;damage+=100-B.hp;B.hp=100;}
  assert(first!==null&&first<8000,`${cpu}/${level} failed to approach and attack`);assert(damage>0,`${cpu}/${level} no actual hit`);assert(attacks>=5,`${cpu}/${level} passive`);assert(moves.size>=2,`${cpu}/${level} repeats one move`);report.push({cpu,level,attacks,first,damage:Math.round(damage),moves:[...moves],maxIdle});
 }
 const r=report.slice(-3);assert(r[2].attacks>r[0].attacks,`${cpu} hard not more active than easy`);assert(r[2].first<r[0].first,`${cpu} approach unchanged`);console.log(cpu,r.map(x=>`${x.level}:${x.attacks} attacks / ${x.damage} damage`).join(', '));
}
fs.writeFileSync('docs/cpu-levels-20261012.json',JSON.stringify(report,null,2));console.log('PASS actual 30-second CPU bouts on all three difficulties, all six fighters');})().catch(e=>{console.error(e);process.exitCode=1});
