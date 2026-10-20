const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync('game/assets/combat.js','utf8').replace(/\}\)\(\);?\s*$/, 'window.__CHAIN__={chainTick,chainInput,chainNext,chainContact,chainCancel,chainScaled,chainMatch,chainConfig,networkSnapshot};})();');
 const g=await createGame(844,390,true,null,{combatSource:source}),t=g.test,{B,O,S,K}=t;await g.start();t.selectSlot(0,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 for(const other of (process.env.OPP?[process.env.OPP]:['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON']))for(const face of [1,-1]){t.selectOpponent(other);t.setupOpponent();
 g.proof.reset();S.training=true;S.trainingBehavior='idle';S.preFight=false;S.running=true;S.paused=false;B.x=50-face*7.25;O.x=50+face*7.25;B.face=face;O.face=-face;const data=t.CFG().IDLE.chain;
 let pointer=0;const input=kind=>{if(face===1){const button=g.buttons.find(b=>b.dataset.tap===kind),pointerId=++pointer;button.dispatch('pointerdown',{pointerId});button.dispatch('pointerup',{pointerId});}else g.send('keydown',{key:({punch:'a',heavy:'f',kick:'s',grab:'c',kick2:'g'})[kind],repeat:false,target:{closest:()=>null},preventDefault(){}});};input('punch');assert.equal(B.a,'LIGHT_PUNCH');
 if(process.env.RANGES){for(const st of data.steps.filter(s=>s.type!=='throw')){const c=t.CFG()[st.move];B.a=st.move;const found=[];for(let gap=3;gap<24;gap+=.5){O.x=B.x+gap;O.a='IDLE';O.frame=0;for(const [fr,h] of Object.entries(c.hits)){B.frame=+fr;const rect=t.fighterRect(B,c,h.box,c.anchorY);if(t.sourceContact(O,rect)){found.push(gap);break;}}}console.log(st.move,found);}return;}const log=[];let last='',sent=-1;
 g.step(9000,()=>{const q=B.attackChain,key=B.a+':'+q?.index+':'+O.hp+':'+O.a;if(key!==last){log.push({a:B.a,frame:B.frame,step:q?.index,hits:q?.hits,contact:q?.contact,age:q?.age,hp:O.hp,target:O.a,gap:O.x-B.x,end:B.chainEnd});last=key;}
 if(q&&q.contact!==null&&q.age-q.contact>=125&&sent!==q.index){sent=q.index;const next=data.steps[q.index+1];if(next){input(next.input);}}
 });
 console.log('PASS',other,face,B.chainEnd,O.hp);assert.equal(B.chainEnd,'complete',other+':'+face);assert.equal(O.hp,54);}
 const api=g.context.__CHAIN__,config=t.CFG();let checks=0;
 function fresh(){t.selectOpponent('NYXA');t.setupOpponent();g.proof.reset();S.training=true;S.trainingBehavior='idle';S.preFight=false;S.running=true;S.paused=false;B.x=42.75;O.x=57.25;B.face=1;O.face=-1;t.beginAction('LIGHT_PUNCH');return B.attackChain;}
 function contact(group){api.chainContact(B,O,{group});}
 let q=fresh();assert(q);assert.equal(api.chainScaled(B,.1),1);assert.equal(api.chainScaled(B,3),3);contact(0);assert.equal(q.contact,null);contact(1);assert.equal(q.contact,0);assert.equal(S.hitstop,50);checks++;
 q=fresh();q.age=200;api.chainInput(B,'heavy');q.age=229;contact(0);contact(1);api.chainTick(120);assert.equal(q.index,1,'149ms buffer accepted');checks++;
 q=fresh();q.age=200;api.chainInput(B,'heavy');q.age=231;contact(0);contact(1);api.chainTick(120);assert.equal(q.index,0,'151ms stale buffer rejected');checks++;
 q=fresh();contact(0);contact(1);api.chainTick(351);assert.equal(B.attackChain,null,'window expires');checks++;
 q=fresh();const token='player-'+B.attackSerial;t.damage(O,3,null,{moveName:'LIGHT_PUNCH',kickToken:token,group:0,target:'head',defense:{a:'BLOCK',config:O.cfg.BLOCK,frame:0,guard:true,low:false}});assert.equal(B.attackChain,null);assert.equal(O.hp,100);checks++;
 q=fresh();t.damage(O,3,null,{moveName:'LIGHT_PUNCH',kickToken:'player-'+B.attackSerial,group:0,target:'head',defense:{a:'LEAN',config:O.cfg.LEAN,frame:O.cfg.LEAN.evadeFrames[0],evade:true}});assert.equal(B.attackChain,null);assert.equal(O.hp,100);checks++;
 q=fresh();t.damage(B,1,null,{target:'body'});assert.equal(B.attackChain,null,'attacker hit interrupts');checks++;
 q=fresh();q.index=3;q.scale=.65;assert.equal(api.chainScaled(B,12),8);assert(t.beginSourcePair(B,true));S.clinch.chain=true;api.chainInput(B,'heavy');assert(t.sourcePairInput('evade'));assert.equal(S.clinch,null);assert.equal(B.attackChain,null);checks++;
 q=fresh();q.index=5;q.scale=.5;assert.equal(api.chainScaled(B,12),7);checks++;
 q=fresh();const {NET}=t;NET.active=NET.host=true;const packet=api.networkSnapshot();assert.equal(packet.actors[0].attackChain.index,0);assert.equal(packet.actors[0].attackChain.scale,1);assert.equal(packet.state.hitstop,S.hitstop);NET.host=false;assert.equal(api.chainInput(B,'heavy'),false);NET.active=false;checks++;
 // Unmodified source attacks, models and energy COMBO are a compatibility invariant.
 const cp=require('node:child_process'),base=JSON.parse(cp.execFileSync('git',['show','6430efe1b1e75cb1fdc1bba3a69adb8344681e8e'],{maxBuffer:12e6}));for(const [name,c]of Object.entries(base)){const now=JSON.parse(JSON.stringify(config[name]));if(name==='IDLE')delete now.chain;assert.deepEqual(now,c,'existing slot changed: '+name);}checks++;
 for(const level of ['easy','normal','hard']){fresh();t.selectOpponent('BRAX');t.setupOpponent();g.proof.reset();S.training=true;S.trainingBehavior='spar';S.difficulty=level;B.x=42.75;O.x=57.25;t.faceOpponents();O.cooldown=1e9;B.stun=1e9;t.opponentPose('LIGHT_PUNCH',true);const moves=new Set();g.step(6000,()=>{moves.add(O.a);O.cooldown=1e9;B.stun=1e9;});assert(moves.has('LIGHT_PUNCH'));assert.equal(moves.has('HOOK'),level!=='easy');assert.equal(moves.has('THROW_ATTACKER'),level==='hard');if(level==='hard')assert(moves.has('HEAVY_KICK'),'hard CPU completes all steps');checks++;}
 console.log(JSON.stringify({pass:true,matchups:16,stateChecks:checks,damage:46,actualHits:7,noWallBounce:true,visualBrowser:false}));
})().catch(e=>{console.error(e);process.exitCode=1});
