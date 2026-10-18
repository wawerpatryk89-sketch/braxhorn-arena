const {ready,reset,seed,names}=require('./runtime.cjs'),fs=require('node:fs');
function initCPU(g){const {B,O,S}=g.test;Object.assign(B,{cooldown:g.context.__REVIEW__.DIFFICULTY[S.difficulty].cooldown,blockTime:0,observeMs:0,responded:false,counterReady:false,observedSerial:null,lastAttack:null,attackUseCounts:{},tacticalRetreat:0,retreatCooldown:0,grabCooldown:4000,comboCooldown:0,comboUses:0,cpuWasLocked:false,cpuLastLockedAction:null,cpuAdvance:false});O.repeatCount=0;O.lastAttackName=null;}
(async()=>{
 const variant=process.argv[2]||'A',samples=+(process.argv[3]||100),slot=+(process.argv[4]||0),level=process.argv[5]||'normal',out='docs/review-v147/variants/'+variant;
 fs.mkdirSync(out,{recursive:true});const rows=[],games=new Map(),start=Date.now();
 async function game(who,other){if(!games.has(who)){const g=await ready(who);if(['A','B'].includes(variant))require('./variants.cjs').apply(g,variant);games.set(who,g);}const g=games.get(who);g.test.selectOpponent(other);g.test.setupOpponent();return g;}
 for(const [rivalIndex,rival] of names.entries()){
  games.clear();if(global.gc)global.gc();
  for(let n=0;n<samples;n++){
   const rowOnLeft=n%2===0,left=rowOnLeft?names[slot]:rival,right=rowOnLeft?rival:names[slot],g=await game(left,right),t=g.test,{S,B,O}=t;
   seed(g,100000+slot*10000+rivalIndex*1000+n);S.wins=[0,0];S.round=1;S.matchOver=false;S.matchElapsed=0;let elapsed=0,rounds=[];
   for(let round=1;round<=3;round++){
    reset(g,{training:false,level});initCPU(g);Object.assign(S,{cpuPlayer:true,round,matchOver:false});B.x=28;O.x=72;t.faceOpponents();let roundMs=0;
    while(!S.ended&&roundMs<65000){t.physics(16);roundMs+=16;}
    if(!S.ended)throw Error('Round did not end');elapsed+=roundMs;rounds.push({ms:roundMs,hp:rowOnLeft?[B.hp,O.hp]:[O.hp,B.hp]});if(S.wins.some(x=>x>=2))break;
   }
   const wins=rowOnLeft?[...S.wins]:[S.wins[1],S.wins[0]],winner=wins[0]===wins[1]?'draw':wins[0]>wins[1]?'player':'opponent';
   rows.push({player:names[slot],opponent:rival,left,right,rowSide:rowOnLeft?'left':'right',level,seed:n,elapsed,wins,winner,winnerHP:winner==='draw'?null:S.wins[0]>S.wins[1]?B.hp:O.hp,rounds});
  }
  console.log(variant,names[slot],rival,rows.length,'elapsed wall',Date.now()-start);
 }
 fs.writeFileSync(out+'/matrix-'+level+'-'+names[slot]+'.json',JSON.stringify(rows));
})().catch(e=>{console.error(e);process.exitCode=1;});
