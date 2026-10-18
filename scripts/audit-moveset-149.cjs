// Button layout 149: every fighter's P1/P2/K1/K2 and forward versions start the documented move,
// P1 is the fighter's fastest button strike, and help rows list exactly the same moves.
const assert=require('node:assert/strict'),{ready,reset,names}=require('./review/runtime.cjs');
const expected={BRAX:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','DOUBLE_PUNCH','UPPERCUT','TEEP','CAPOEIRA'],NYXA:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','LUNGE_PUNCH','ELBOW','CLINCH_KNEE','CROUCH_KICK'],VEXA:['HEAVY_PUNCH','LIGHT_PUNCH','LIGHT_KICK','HEAVY_KICK','SPIN_KICK','FLYING_KICK'],KROV:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','ELBOW','UPPERCUT'],NINA:['LIGHT_KICK','HEAVY_PUNCH','MEIA_LUA','HEAVY_KICK','CRESCENT_KICK','SPIN_KICK','LIGHT_PUNCH','GROUND_KICK'],DANNY:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','HOOK','SIDE_KICK'],BEAR:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','SHOULDER','UPPERCUT'],DEMON:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','SHOULDER','UPPERCUT']};
(async()=>{for(const who of names){const g=await ready(who),t=g.test,{B,O,K}=t,cfg=t.CFG();t.selectOpponent('BRAX');t.setupOpponent();
 assert.deepEqual([...g.context.__REVIEW__.SOURCE_ATTACKS[who]],expected[who],who+' layout');const list=expected[who];
 const buttons=[['punch',0],['heavy',0],['kick',0],['kick2',0],['punch',1],['heavy',1]].concat(list.length>6?[['kick',1],['kick2',1]]:[]);
 buttons.forEach(([kind,fwd],i)=>{reset(g);B.x=30;O.x=70;t.faceOpponents();K.right=!!fwd&&B.face>0;K.left=!!fwd&&B.face<0;assert(t.playerButtonAttack(kind),who+' '+kind);assert.equal(B.a,list[i],who+' '+(fwd?'forward+':'')+kind);K.right=K.left=false;g.step(2500);});
 const startup=n=>{const c=cfg[n],first=Math.min(...Object.keys(c.hits).map(Number));return c.durations.slice(0,first).reduce((a,d,i)=>a+d/t.actionTempo(who,c,i),0);};
 const p1=startup(list[0]);assert(list.slice(1,4).every(n=>startup(n)>=p1-30),who+' P1 must be the fastest base button, within 30 ms ('+Math.round(p1)+' ms)');
 console.log(who,'OK','P1',Math.round(p1),'ms');}
 console.log('PASS moveset 149');})().catch(e=>{console.error(e);process.exitCode=1;});
