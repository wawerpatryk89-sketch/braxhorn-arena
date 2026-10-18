const {createGame}=require('./audit-new-fighters.cjs'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const critical=process.argv.includes('--critical'),seeds=critical?[175,7919,71,123,991,2026,31415,65537,99991,412341]:[175,7919];const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY'],rows=[];
for(let slot=0;slot<(critical?1:6);slot++){
 const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 for(const cpu of (critical?['VEXA','KROV']:names))for(const level of (critical?['hard']:['easy','normal','hard']))for(const strategy of (critical?['forwardP1']:['forwardP1','pressure','retreat','block','grab']))for(const startSeed of seeds){
 t.selectOpponent(cpu);t.setupOpponent();g.proof.reset();Object.assign(S,{difficulty:level,training:false,preFight:false,running:true,paused:false,wins:[0,0],round:1,acc:0});B.x=28;O.x=72;t.faceOpponents();let seed=startSeed;g.context.Math=Object.create(Math);g.context.Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 let wall=0,attempts=0;while(!S.ended&&wall<70000){const direction=strategy==='retreat'?-B.face:strategy==='block'?0:B.face;K.left=direction<0;K.right=direction>0;K.block=strategy==='block';if(!B.lock&&!B.stun){if(strategy==='forwardP1')t.playerButtonAttack('punch');if(strategy==='pressure')t.playerButtonAttack(['punch','heavy','kick','kick2'][attempts++%4]);if(strategy==='grab')t.playerButtonAttack('grab');}g.step(16);wall+=16;}
 assert(S.ended,JSON.stringify({player:names[slot],cpu,level,strategy,startSeed,t:S.t,hp:[B.hp,O.hp],state:[B.a,O.a],clinch:!!S.clinch,paused:S.paused,preFight:S.preFight,training:S.training,slow:S.koSlowMs}));assert(Number.isFinite(B.hp)&&Number.isFinite(O.hp));rows.push({player:names[slot],cpu,level,strategy,seed:startSeed,hp:[B.hp,O.hp],winner:B.hp===O.hp?'draw':B.hp>O.hp?'player':'cpu',wallMs:wall});
 }
 console.log('tested',names[slot],rows.length);
}
fs.mkdirSync('docs/acceptance',{recursive:true});fs.writeFileSync('docs/acceptance/'+(critical?'ai-critical':'ai-matrix')+'.json',JSON.stringify({cases:rows.length,seeds,note:'Scripted strategies, not human playtesting or a statistical balance rating',rows},null,2));console.log('PASS AI matrix',rows.length);})().catch(e=>{console.error(e);process.exitCode=1;});
