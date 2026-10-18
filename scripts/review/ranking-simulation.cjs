const {ready,reset,seed,names}=require('./runtime.cjs'),fs=require('node:fs');
(async()=>{const slot=+process.argv[2],level=process.argv[3],who=names[slot],g=await ready(who),t=g.test,{B,O,S,K}=t,rows=[],moves=g.context.__REVIEW__.SOURCE_ATTACKS[who];
for(const [rivalIndex,rival] of names.entries()){t.selectOpponent(rival);t.setupOpponent();for(let n=0;n<25;n++){seed(g,800000+slot*10000+rivalIndex*100+n);S.wins=[0,0];S.matchElapsed=0;let elapsed=0,rounds=[];const strategy=n%moves.length;
for(let round=1;round<=3;round++){reset(g,{training:false,level});Object.assign(S,{cpuPlayer:false,round,matchOver:false});B.x=28;O.x=72;t.faceOpponents();let ms=0,attempts=0;
while(!S.ended&&ms<65000){K.right=B.face>0;K.left=B.face<0;if(!B.lock&&!B.stun&&!S.clinch){const action=n%5===0?moves[(strategy+attempts++)%moves.length]:moves[strategy];t.beginAction(action);}t.physics(16);ms+=16;}
if(!S.ended)throw Error('Round failed to terminate');elapsed+=ms;rounds.push({ms,hp:[B.hp,O.hp]});if(S.wins.some(x=>x>=2))break;}
rows.push({player:who,opponent:rival,level,seed:800000+slot*10000+rivalIndex*100+n,controller:n%5===0?'cycle-buttons':moves[strategy],elapsed,wins:[...S.wins],winner:S.wins[0]===S.wins[1]?'draw':S.wins[0]>S.wins[1]?'player':'opponent',rounds});}
console.log(who,level,rival,rows.length);}
fs.writeFileSync('docs/review-v147/variants/CURRENT/matrix-'+level+'-'+who+'.json',JSON.stringify(rows));})().catch(e=>{console.error(e);process.exitCode=1});
