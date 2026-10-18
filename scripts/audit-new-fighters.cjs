const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');const html=fs.readFileSync('game/index.html','utf8'),script=fs.readFileSync(process.env.BRAX_TEST_COMBAT_SOURCE||'game/assets/combat.js','utf8');
async function createGame(width, height, withAudio=false, visualViewport=null, options={}) {
  let time = 0, raf, timerId = 0;
  const timers = new Map(), events = {}, elements = new Map();
  class Element {
    constructor(id = '', dataset = {}) {
      this.paused=true;this.play=()=>{this.paused=false;return Promise.resolve()};this.pause=()=>{this.paused=true};this.id = id; this.dataset = dataset; this.events = {}; this.textContent = '';
      this.decode=()=>Promise.resolve();this.width = this.height = 512; this.scrollLeft=0; this.offsetWidth = 1;
      this.style = {setProperty(k, v) {this[k] = v;}};
      const classes = new Set();
      this.classList = {add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), toggle: (v, on) => on ? classes.add(v) : classes.delete(v), contains: v => classes.has(v)};
      this.firstElementChild = {textContent: ''};
    }
    addEventListener(k, fn) {(this.events[k] ||= []).push(fn);}
    dispatch(k, more = {}) {const event = {type: k, target: this, pointerId: 1, preventDefault() {}, ...more}; for (const fn of this.events[k] || []) fn(event);if(this.id==='go'&&k==='click'&&!context.__MANUAL_NAME){elements.get('playerNickname').value='TEST';elements.get('identityContinue').dispatch('click');}}
    setAttribute(k,v){(this.attributes ||= {})[k]=v;}
    getAttribute(k){return this.attributes?.[k]??this[k]??null;}
    get clientWidth(){return this.id==='game' ? parseFloat(this.style.width)||width : width;}
    getBoundingClientRect() {const w=this.id==='game'?parseFloat(this.style.width)||width:width,h=this.id==='game'?parseFloat(this.style.height)||height:height;return {left:0,top:0,bottom:h,right:w,width:w,height:h};}
    getContext() {return {clearRect(){},fillRect(){},save(){},restore(){},translate(){},scale(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},ellipse(){},fill(){},putImageData: data => {this.pixels = data.data;}};}
    setPointerCapture() {}
    scrollBy(options){this.scrollLeft+=options.left;}
    closest(tag) {return tag === 'button' && (this.dataset.tap || this.dataset.hold) ? this : null;}
    appendChild() {}
    remove() {}
  }
  for (const id of [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1])) elements.set(id, new Element(id));
  const buttons = [...html.matchAll(/<button[^>]*data-(hold|tap)="([^"]+)"/g)].map(m => new Element('', {[m[1]]: m[2]}));
  const document = {
    hidden: false,
    documentElement: {},
    querySelector: selector => selector === '#fightLoadError [role=status]' ? (elements.get('fightLoadError').status ||= new Element()) : elements.get(selector.slice(1)),
    querySelectorAll: selector => buttons.filter(x => selector.includes('data-hold') ? x.dataset.hold : selector.includes('data-tap') ? x.dataset.tap : true),
    createElement: () => new Element(),
    addEventListener: (key, fn) => {(events['document:' + key] ||= []).push(fn);}
  };
  const context = {
    BRAX_ONLINE: {start(){},finish(){},challenge(){},leaderboard(doc,progress){const online=context.BRAX_ONLINE;delete context.BRAX_ONLINE;try{return context.BRAX_FEATURES.leaderboard(doc,progress);}finally{context.BRAX_ONLINE=online;}},async saveName(name){await Promise.resolve();if(!/^[\p{L}\p{N} ._-]{2,20}$/u.test(name.trim()))throw Error('Nieprawidłowy pseudonim');return name.trim();}},
    document, innerWidth: width, innerHeight: height, visualViewport,
    performance: {now: () => time}, navigator: {}, screen: {}, console,
    Uint8Array, Uint8ClampedArray, Int16Array, Map, Set, Math,
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    Image: class {decode(){return Promise.resolve()}},
    ImageData: class {constructor(data, w, h) {this.data = data; this.width = w; this.height = h;}},
    requestAnimationFrame: fn => {if(!raf||fn.name==='loop')raf=fn;else timers.set(++timerId,{fn,at:time+16});},
    setTimeout: (fn, ms) => {timers.set(++timerId, {fn, at: time + ms}); return timerId;},
    clearTimeout: id => timers.delete(id),
    addEventListener: (key, fn) => {(events[key] ||= []).push(fn);}
  };
  if(withAudio){
    const resolved=value=>({then(fn){return resolved(fn(value));},catch(){return this;}});
    context.fetch=()=>resolved({ok:true,arrayBuffer:()=>new ArrayBuffer(8)});
    const node=()=>({connect(){},disconnect(){},gain:{value:1}});
    context.AudioContext=class{constructor(){this.state='suspended';this.destination={};}createGain(){return node();}createDynamicsCompressor(){return {...node(),threshold:{value:0},ratio:{value:0}};}decodeAudioData(){return {duration:.4};}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}createBufferSource(){return {...node(),playbackRate:{value:1},start(){},stop(){this.onended?.();}};}};
  }
  context.window = context;
  vm.runInNewContext(fs.readFileSync('game/assets/fighter-names.js','utf8'),context);
  vm.runInNewContext(fs.readFileSync('game/assets/viewport.js','utf8'),context);
  vm.runInNewContext(fs.readFileSync('game/assets/arena-catalog.js','utf8'),context);
  const renderer=who=>{const config=JSON.parse(fs.readFileSync('game/assets/'+who+'-new/config.json'));const frames={};for(const c of Object.values(config))frames[c.asset]={w:c.w,h:c.h,frames:c.durations.map(duration=>({duration}))};return{config,frames,render(){}};};
  context.BRAX_3D=renderer('brax');context.NYXA_3D=renderer('nyxa');context.VEXA_3D=renderer('vexa');context.KROV_3D=renderer('krov');context.NINA_3D=renderer('nina');context.DANNY_3D=renderer('danny');context.BEAR_3D=renderer('bear');context.DEMON_3D=renderer('demon');
  if(options.blood)vm.runInNewContext(fs.readFileSync('game/assets/blood-effects.js','utf8'),context);
  if(options.replay)vm.runInNewContext(fs.readFileSync('game/assets/ko-replay.js','utf8'),context);
  vm.runInNewContext(fs.readFileSync('game/assets/arena-features.js','utf8'),context);
  vm.runInNewContext(fs.readFileSync('game/assets/championship.js','utf8'),context);
  if(options.boot){context.BRAX_BOOT={dispose(){},slot:0,...options.boot};elements.get('survivalScreen').classList.add('off');context.BRAX_INTERFACE={openSurvival(){elements.get('survivalScreen').classList.remove('off');},helpTab(){},syncPause(){},openKeyboard(){}};}
  const exposed="window.__TEST__={B,O,S,K,NET,blood,koReplay,helpRows,showFighterHelp,closeFighterHelp,helpPending:()=>helpPending,namePending:()=>namePending,selectGameMode,startChallenge,featureEvent,recordMatchProgress,trainingDrill,launchCampaign,campaignBoard,showMatchResult,progress,FEATURES,featureState:()=>({activeChallenge,campaign,selectedGameMode}),worldHPercent,beginShowcaseContact,showcaseContactStep,faceOpponents,CFG:()=>CFG,opponentPose,resolvePlayerHit,drawOpponent,damage,evade,jump,endRound,startCountdown,playerButtonAttack,render,actionStep,playerHurtbox,opponentHurtbox,fighterRect,frameAnchorY,frameBox,attackRect,moveTempo,actionTempo,baseActionTempo,showMatchResult,contactClinchStep,beginAction,begin,restore,bufferAction,separateFighters,confineFighters,visibleLimits,sourcePushBody,sourceHeight,sourceContact,sourceMoveSpeed,attackDistance,resolveOpponentHit,opponentStep,physics,knockdown,launchSource,beginSourcePair,sourcePairInput,sourcePairStep,releaseClinch,selectOpponent,setupOpponent,selectSlot};";
  vm.runInNewContext((options.combatSource||script).replace(/\}\)\(\);?\s*$/,exposed+"})();"),context,{timeout:20000});

  const send = (name, more = {}) => {for (const fn of events[name] || []) fn({preventDefault() {}, ...more});};
  const step = (ms, sample = () => {}) => {for (let elapsed = 0; elapsed < ms; elapsed += 16) {time += 16; for (const [id, task] of timers) if (task.at <= time) {timers.delete(id); task.fn();} raf(time);if(context.__TEST__?.helpPending()&&!context.__MANUAL_HELP)elements.get('helpContinue').dispatch('click'); sample();}};
  const tick = ms => {time+=ms;for(const [id,task] of timers)if(task.at<=time){timers.delete(id);task.fn();}raf(time);};
  const key = (name, down = true) => send(down ? 'keydown' : 'keyup', {key: name, repeat: false});
  const proof = context.__BRAX_PROOF__;
  const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve();step(180);for(let i=0;i<6;i++)await Promise.resolve();step(32);};const start=async(name='TEST')=>{context.__MANUAL_NAME=true;elements.get('go').dispatch('click');elements.get('playerNickname').value=name;elements.get('identityContinue').dispatch('click');await flush();assert(!context.__TEST__.namePending(),'identity completed asynchronously');assert(elements.get('playerIdentity').classList.contains('off'));context.__MANUAL_NAME=false;};await flush();return {context,start,flush,tick,test:context.__TEST__, elements, buttons, document, send, step, key, proof, state: proof.state, pixelBytes: () => elements.get('bSprite').pixels, pixels: () => crypto.createHash('sha256').update(elements.get('bSprite').pixels).digest('hex')};
}

module.exports={createGame};
if(require.main===module)(async()=>{const results=[];for(const slot of [0,1]){
 const g=await createGame(844,390,true);await g.start();g.test.selectSlot(slot,true);await g.flush();await g.test.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(320);assert.equal(g.test.B.a,'INTRO','greeting is played after the film');assert(g.test.B.frame>0&&!g.test.CFG().INTRO.freeze,'greeting advances instead of freezing');g.step(14000);
 assert(g.state().running&&!g.state().preFight,'intro and countdown finish');
 const{B,O,S}=g.test;S.training=true;S.trainingBehavior='idle';g.proof.reset();
 assert.equal(g.test.actionTempo(slot?'NYXA':'BRAX',g.test.CFG().LIGHT_PUNCH),g.test.CFG().LIGHT_PUNCH.playbackRate*1.1,'configured tempo with common action multiplier');if(!g.test.CFG().JUMP)assert.equal(g.test.jump(),false,'missing jump safe');else{g.test.jump();assert.equal(B.a,'JUMP');g.step(2000);assert.equal(B.jumpTime,null);}
 for(const direction of [-1,0,1])for(const kind of ['punch','heavy','kick','kick2']){g.proof.reset();g.test.K.left=direction===-1;g.test.K.right=direction===1;assert(g.test.playerButtonAttack(kind),kind+' mapping');g.test.K.left=g.test.K.right=false;g.step(19000);assert(!B.lock,'action returns');}
 const cfg=g.test.CFG(),unique=[...new Set(Object.values(cfg).filter(c=>c.attack))];
 for(const c of unique)for(const face of [1,-1]){
  g.proof.reset();O.stun=1e9;B.x=50;O.x=face>0?75:25;g.test.faceOpponents();const name=Object.keys(cfg).find(n=>cfg[n]===c);const fi=Number(Object.keys(c.hits)[0]),h=c.hits[fi];B.a=name;B.frame=fi;g.test.render(name,fi);const target=g.test.opponentHurtbox(),rect=g.test.attackRect(h.box),root=O.x/100*844,near=face>0?root-target.left:target.right-root,reach=face>0?rect.right-B.x/100*844:B.x/100*844-rect.left;
  const cy=(rect.top+rect.bottom)/2;const caps=O.cfg[O.a].hurtCapsules[O.frame];const cap=caps.map(z=>{const a=g.test.fighterRect(O,O.cfg[O.a],[z.a[0],z.a[1],0,0],O.cfg[O.a].anchorY),b=g.test.fighterRect(O,O.cfg[O.a],[z.b[0],z.b[1],0,0],O.cfg[O.a].anchorY);return {x:(a.left+b.left)/2,y:(a.top+b.top)/2};}).sort((a,b)=>Math.abs(a.y-cy)-Math.abs(b.y-cy))[0];O.x+=((rect.left+rect.right)/2-cap.x)/844*100;g.test.restore();S.comboReserved=true;assert(g.test.beginAction(name));const duration=c.durations.reduce((a,b)=>a+b,0);g.step(duration+150);
  assert(O.hp<100,`${slot} ${name} contact ${face}`);const groups=new Map(Object.values(c.hits).map(h=>[h.group,h.damage]));assert(100-O.hp<=[...groups.values()].reduce((a,b)=>a+b,0)+.01,'single damage per group');
  g.proof.reset();O.stun=1e9;B.x=10;O.x=90;g.test.faceOpponents();S.comboReserved=true;g.test.beginAction(name);g.step(duration+150);assert.equal(O.hp,100,'distant miss '+name);
 }
 results.push({character:slot?'NYXA':'BRAX',uniqueAttacks:unique.length,bothDirections:true,controls:true,missingJumpSafe:true});
}console.log(JSON.stringify({pass:true,results}));})().catch(e=>{console.error(e);process.exitCode=1});
