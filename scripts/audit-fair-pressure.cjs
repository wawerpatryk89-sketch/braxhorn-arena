const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
const roster=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
(async()=>{let cases=0;const balance=[];
for(let slot=0;slot<roster.length;slot++){
 const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;
 await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 const cfg=t.CFG();balance.push({fighter:roster[slot],attacks:Object.entries(cfg).filter(([n,c])=>c.attack&&['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','DOUBLE_PUNCH','ELBOW','UPPERCUT','CLINCH_KNEE','HOOK','SIDE_KICK','CRESCENT_KICK','SPIN_KICK','FLYING_KICK','MEIA_LUA','GROUND_KICK','COMBO'].includes(n)).map(([name,c])=>({name,damage:[...new Map(Object.values(c.hits).map(h=>[h.group,h.damage])).values()].reduce((a,b)=>a+b,0),seconds:+c.durations.reduce((s,ms,f)=>s+ms/t.actionTempo(roster[slot],c,f)/1000,0).toFixed(3)}))});
 for(const who of roster)for(const side of ['player','opponent'])for(const face of [-1,1])for(const wall of [false,true]){
 t.selectOpponent(who);t.setupOpponent();
 const reset=()=>{g.proof.reset();S.training=true;S.trainingBehavior='idle';S.hitstop=0;K.block=K.down=K.right=K.left=false;B.x=wall?(face>0?75:25):45;O.x=B.x+face*8;t.faceOpponents();if(wall){const target=side==='player'?B:O,limits=t.visibleLimits(target);target.x=target.face>0?limits.min:limits.max;}return side==='player'?B:O;};
 let z=reset(),a=z===B?O:B;
 const hit=(damage,token,extra={})=>t.damage(z,damage,null,{target:'body',moveName:'HEAVY_PUNCH',kickToken:token,...extra});
 hit(14,'a');assert(!z.downState);hit(14,'b');assert(!z.downState);assert(z.pushTime===300,'two heavy actions push');assert(z.pushSpeed*z.face<0,'victim recoils away');hit(14,'c');assert.equal(z.downState?.phase,'FLY','third heavy action launches');assert(!a.downState,'aggressor never knocked down instead');assert.equal(z.hp,58);assert.equal(t.damage(z,14,null,{}),false,'no ground juggle');cases++;
 z=reset();for(let i=0;i<6;i++)hit(8,'one-action');assert(!z.downState,'multi-hit action cannot farm launches');assert.equal(z.hitSeries.actions,1);assert.equal(z.hitSeries.pressure,14);cases++;
 z=reset();hit(14,'a');hit(14,'b');if(z===B){B.stun=0;B.pushTime=0;t.restore();K.block=true;}else{z.stun=0;t.opponentPose('BLOCK');}const hp=z.hp;hit(14,'blocked');assert.equal(z.hp,hp);assert.equal(z.hitSeries,null,'block breaks series');K.block=false;if(z===B)t.restore();else t.opponentPose('IDLE');hit(14,'c');assert(!z.downState);cases++;
 z=reset();hit(14,'a');hit(14,'b');B.x=15;O.x=85;g.step(2700);assert(!z.hitSeries,'disengagement expires pressure '+JSON.stringify({b:t.sourcePushBody(B),o:t.sourcePushBody(O),h:t.sourceHeight()}));hit(14,'c');assert(!z.downState);cases++;
 z=reset();hit(18,'combo',{comboPart:true,comboFinish:true});assert.equal(z.downState?.phase,'FLY','current master finisher always launches');cases++;
 z=reset();hit(6,'combo',{comboPart:true});hit(7,'combo',{comboPart:true});assert(!z.pushTime,'combo is not split by early separation');hit(16,'combo',{comboPart:true,comboFinish:true});assert.equal(z.downState?.phase,'FLY','connected full combo launches');cases++;
 z=reset();z.knockdownCooldown=3500;hit(14,'a');hit(14,'b');hit(14,'c');assert(!z.downState,'recovery prevents repeated launch');assert(z.pushTime>0);cases++;
 z=reset();g.step(2500);assert(!S.clinch&&!B.downState&&!O.downState,'idle proximity is harmless');cases++;
 z=reset();z.getupProtection=350;assert.equal(hit(14,'a'),false);assert.equal(z.hp,100);assert(!z.hitSeries);cases++;
 z=reset();const c=z===B?cfg:O.cfg;z.a='LEAN';z.frame=c.LEAN.evadeFrames[0];assert.equal(t.damage(z,8,null,{target:'head'}),false);assert.equal(t.damage(z,8,null,{target:'leg'}),true,'lean cannot evade a leg hit');cases++;
 }
}
require('fs').writeFileSync('docs/fair-pressure-audit.json',JSON.stringify({pass:true,cases,balance},null,2)+'\n');console.log(JSON.stringify({pass:true,cases,checks:['all 64 matchups','both target roles, facings, walls','damage-weighted series','multi-hit cap','defence and expiry','connected combo only','anti-juggle','idle proximity','lean hit regions']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
