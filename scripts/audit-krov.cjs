const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const html = fs.readFileSync(process.argv[2] || 'game/index.html', 'utf8');
const script = fs.readFileSync('game/assets/combat.js','utf8');
const braxData=JSON.parse(fs.readFileSync('game/assets/brax-data.js','utf8').split('window.BRAX_DATA=')[1].trim().replace(/;$/,''));
const assets=braxData.assets,checksums=braxData.sha256,config=braxData.config;
const referenceFrames = JSON.parse(fs.readFileSync('docs/decoded-frame-hashes.json', 'utf8'));
for (const [key, value] of Object.entries(assets)) {
  assert.equal(crypto.createHash('sha256').update(Buffer.from(value, 'base64')).digest('hex'), checksums[key], key + ' unchanged');
}
assert(html.includes('id="backFighter"'),'arena picker has a return control');
assert(!html.includes('id="nyxa"'), 'No unapproved opponent element');
assert(!html.includes('SPARING AI'), 'No misleading opponent HUD');
assert(!html.includes('id="screenHelp"')&&!html.includes('id="movePanel"')&&!html.includes('id="inputHint"'),'No unsolicited help panels');

async function createGame(width, height, withAudio=false, visualViewport=null) {
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
    dispatch(k, more = {}) {const event = {type: k, target: this, pointerId: 1, preventDefault() {}, ...more}; for (const fn of this.events[k] || []) fn(event);}
    setAttribute(k,v){(this.attributes ||= {})[k]=v;}
    get clientWidth(){return this.id==='game' ? parseFloat(this.style.width)||width : width;}
    getBoundingClientRect() {const w=this.id==='game'?parseFloat(this.style.width)||width:width,h=this.id==='game'?parseFloat(this.style.height)||height:height;return {left:0,top:0,bottom:h,right:w,width:w,height:h};}
    getContext() {return {clearRect(){},drawImage(){},putImageData: data => {this.pixels = data.data;}};}
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
    querySelector: selector => elements.get(selector.slice(1)),
    querySelectorAll: selector => buttons.filter(x => selector.includes('data-hold') ? x.dataset.hold : selector.includes('data-tap') ? x.dataset.tap : true),
    createElement: () => new Element(),
    addEventListener: (key, fn) => {(events['document:' + key] ||= []).push(fn);}
  };
  const context = {
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
  vm.runInNewContext(fs.readFileSync('game/assets/brax-data.js','utf8'),context);
  vm.runInNewContext(fs.readFileSync('docs/legacy-nyxa-test-fixture.js','utf8'),context);
  // Legacy data is an offline regression fixture, never shipped to players.
  context.BRAX_3D={config:context.BRAX_DATA.config,frames:{},render(){}};context.KROV_3D={...JSON.parse(fs.readFileSync('game/assets/krov3d/config.json')),render(){}};context.NYXA_3D={config:context.NYXA_DATA.config,frames:{}};Object.assign(context.BRAX_DATA.assets,context.NYXA_DATA.assets);Object.assign(context.BRAX_DATA.sha256,context.NYXA_DATA.sha256);
  vm.runInNewContext(script.replace("game.classList.add('menu-open');menuAudio.start();setPose('IDLE');","window.__TEST__={B,O,S,K,faceOpponents,decodeGif,CFG:()=>CFG,opponentPose,resolvePlayerHit,drawOpponent,damage,evade,jump,endRound,startCountdown,playerButtonAttack,render,actionStep,playerHurtbox,opponentHurtbox,fighterRect,frameAnchorY,frameBox,attackRect,moveTempo,actionTempo,beginAction,finishAction,physics,worldHPercent,beginKrovDash,krovDashStep,beginKrovGrab,resolveKrovGrab,handleKrovClinchInput,krovClinchStep,knockdown,advanceKrovDown,restore,configure(){playerCharacter='KROV';CFG=window.KROV_3D.config;O.cfg=CFG;O.character='KROV';selectedSlot=2;S.running=true;S.preFight=false;S.ended=false;S.training=true;S.trainingBehavior='idle';B.stun=O.stun=0;B.ground=true;B.jumpTime=null;B.downState=O.downState=null;B.hp=O.hp=100;B.x=30;O.x=70;B.face=1;O.face=-1;B.lock=false;B.anim=null;O.locked=false;B.pushTime=O.pushTime=0;S.grabAttempt=S.clinch=S.krovDash=null;for(const k of Object.keys(K))K[k]=false;restore();opponentPose('IDLE');}};game.classList.add('menu-open');menuAudio.start();setPose('IDLE');"), context, {timeout: 20000});
  const send = (name, more = {}) => {for (const fn of events[name] || []) fn({preventDefault() {}, ...more});};
  const step = (ms, sample = () => {}) => {for (let elapsed = 0; elapsed < ms; elapsed += 16) {time += 16; for (const [id, task] of timers) if (task.at <= time) {timers.delete(id); task.fn();} raf(time); sample();}};
  const key = (name, down = true) => send(down ? 'keydown' : 'keyup', {key: name, repeat: false});
  const proof = context.__BRAX_PROOF__;
  const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve();step(180);for(let i=0;i<6;i++)await Promise.resolve();step(32);};await flush();return {flush,test:context.__TEST__, elements, buttons, document, send, step, key, proof, state: proof.state, pixelBytes: () => elements.get('bSprite').pixels, pixels: () => crypto.createHash('sha256').update(elements.get('bSprite').pixels).digest('hex')};
}


(async()=>{
 const g=await createGame(844,390),t=g.test,c=t.CFG;const reset=()=>t.configure();reset();
 for(const [kind,direction,name,T,P,A,damage] of [['punch',0,'OVERHAND',46,17,19,12],['heavy',0,'BODY_HOOK',34,12,14,8],['punch',1,'ELBOW',36,11,12,10],['punch',-1,'UPPERCUT',54,21,23,13],['kick2',0,'KNEE',43,16,18,10],['kick',0,'LOW_KICK',49,19,21,9]]){reset();t.K.left=direction<0;t.K.right=direction>0;assert(t.playerButtonAttack(kind));assert.equal(t.B.a,name);const cfg=c()[name];assert.equal(cfg.durations.length,T);assert.deepEqual(Object.keys(cfg.hits).map(Number),Array.from({length:A-P+1},(_,i)=>P+i));assert.equal(cfg.hits[P].damage,damage);t.actionStep((T-1)*1000/60);assert.equal(t.B.a,name);t.actionStep(1000/60+.001);assert.equal(t.B.a,'IDLE');}
 reset();t.B.face=-1;t.K.right=true;t.playerButtonAttack('punch');assert.equal(t.B.a,'UPPERCUT');
 reset();const H=t.worldHPercent();t.K.right=true;t.physics(200);assert(Math.abs(t.B.x-30-H*.75*.2)<1e-6);reset();t.K.left=true;t.physics(200);assert(Math.abs(t.B.x-30+H*.60*.2)<1e-6);
 reset();t.beginKrovDash(-1);for(let i=0;i<24;i++){t.krovDashStep(10);t.actionStep(10);}assert(Math.abs(t.B.x-30+H*.25)<1e-6);assert(t.B.lock);t.actionStep(160.01);assert(!t.B.lock);
 reset();t.beginAction('LEAN');t.B.frame=6;assert.equal(t.damage(t.B,10,null,{target:'HEAD',strength:2}),false);assert.equal(t.damage(t.B,10,null,{target:'BODY',strength:2}),true);assert.equal(t.B.a,'HIT_R2_BODY');
 reset();t.K.block=true;t.damage(t.B,10,null,{target:'LEG',strength:2});assert.equal(t.B.hp,90);reset();t.K.block=true;t.damage(t.B,10,null,{target:'HEAD',strength:3});assert.equal(t.B.hp,98.2);
 reset();t.O.x=t.B.x+H*.32;assert(t.beginKrovGrab(t.B));t.actionStep(13*1000/60+.01);assert(t.S.clinch);t.krovClinchStep(210);t.K.down=true;assert(t.handleKrovClinchInput('grab'));t.krovClinchStep(701);assert.equal(t.O.hp,85);assert.equal(t.O.a,'LAND');t.advanceKrovDown(t.O);assert.equal(t.O.a,'DOWN');t.advanceKrovDown(t.O);assert.equal(t.O.a,'GETUP');t.advanceKrovDown(t.O);assert.equal(t.O.downState,null);
 reset();assert(t.beginKrovGrab(t.B));t.actionStep(46*1000/60+.01);assert.equal(t.S.clinch,null);assert.equal(t.B.a,'IDLE');
 reset();t.B.a='OVERHAND';t.B.phase='STARTUP';t.damage(t.B,13,null,{masterId:'K04',target:'HEAD',strength:3});assert.equal(t.B.a,'FALL');t.advanceKrovDown(t.B);assert.equal(t.B.a,'LAND');
 reset();t.S.training=false;t.B.hp=5;t.damage(t.B,12,null,{target:'HEAD',strength:3});assert.equal(t.B.a,'FALL');t.advanceKrovDown(t.B);assert.equal(t.B.a,'KO_HOLD');

 reset();const left=g.buttons.find(b=>b.dataset.hold==='left'),punch=g.buttons.find(b=>b.dataset.tap==='punch');left.dispatch('pointerdown',{pointerId:21});punch.dispatch('pointerdown',{pointerId:22});assert.equal(t.B.a,'UPPERCUT');punch.dispatch('pointerup',{pointerId:22});assert(t.K.left);left.dispatch('pointerup',{pointerId:21});assert(!t.K.left);
 reset();t.B.x=60;t.O.x=60-H*.32;assert(t.beginKrovGrab(t.O));t.O.frame=13;t.resolveKrovGrab();assert(t.S.clinch);assert(t.handleKrovClinchInput('grab'));assert.equal(t.S.clinch,null);assert.equal(t.B.pushTime,300);
 reset();t.O.x=30+H*.32;t.beginKrovGrab(t.B);t.actionStep(217);t.krovClinchStep(210);t.handleKrovClinchInput('kick2');t.krovClinchStep(317);assert.equal(t.O.hp,90);assert.equal(t.S.clinch,null);assert.equal(t.B.a,'CLINCH_KNEE');assert(t.B.lock);
 reset();t.O.x=30+H*.32;t.B.en=100;t.playerButtonAttack('special');t.actionStep(1901);assert(t.S.clinch?.combo);assert.equal(t.B.frame,114);t.krovClinchStep(700);assert.equal(t.S.clinch,null);assert.equal(t.O.a,'LAND');
 console.log('PASS Krov: 6 master moves/timing, facing, movement, dash braking, region guard/evasion, clinch throw/miss, counter KD, KO');
})().catch(e=>{console.error(e);process.exitCode=1;});
