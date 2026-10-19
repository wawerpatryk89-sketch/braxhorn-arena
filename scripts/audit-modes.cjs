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
    getContext() {return {putImageData: data => {this.pixels = data.data;}};}
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
    Uint8Array, Uint8ClampedArray, Int16Array, Map, Set, Math: (()=>{let seed=12345;const m=Object.create(Math);m.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);return m;})(),
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
  vm.runInNewContext(fs.readFileSync('game/assets/nyxa-data.js','utf8'),context);
  vm.runInNewContext(fs.readFileSync('game/assets/roster.js','utf8'),context);
  vm.runInNewContext(script.replace("game.classList.add('menu-open');menuAudio.start();setPose('IDLE');","window.__TEST__={B,O,S,K,DIFFICULTY,displayPixels,separateFighters,faceOpponents,decodeGif,CFG:()=>CFG,opponentPose,resolvePlayerHit,drawOpponent,damage,evade,jump,endRound,startCountdown,playerButtonAttack,render,actionStep,playerHurtbox,opponentHurtbox,fighterRect,frameAnchorY,frameBox,attackRect,moveTempo,actionTempo};game.classList.add('menu-open');menuAudio.start();setPose('IDLE');"), context, {timeout: 20000});
  const send = (name, more = {}) => {for (const fn of events[name] || []) fn({preventDefault() {}, ...more});};
  const step = (ms, sample = () => {}) => {for (let elapsed = 0; elapsed < ms; elapsed += 16) {time += 16; for (const [id, task] of timers) if (task.at <= time) {timers.delete(id); task.fn();} raf(time); sample();}};
  const key = (name, down = true) => send(down ? 'keydown' : 'keyup', {key: name, repeat: false});
  const proof = context.__BRAX_PROOF__;
  const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve();step(180);for(let i=0;i<6;i++)await Promise.resolve();step(32);};await flush();return {flush,test:context.__TEST__, elements, buttons, document, send, step, key, proof, state: proof.state, pixelBytes: () => elements.get('bSprite').pixels, pixels: () => crypto.createHash('sha256').update(elements.get('bSprite').pixels).digest('hex')};
}



(async()=>{
 const g=await createGame(844,390,true);g.elements.get('go').dispatch('click');await g.flush();g.elements.get('chooseFighter').dispatch('click');g.elements.get('mode-training').dispatch('click');assert(!g.elements.get('matchSetup').classList.contains('off'));g.elements.get('setupNext').dispatch('click');assert(g.elements.get('matchSetup').classList.contains('off'));g.elements.get('backFighter').dispatch('click');assert(!g.elements.get('matchSetup').classList.contains('off'));assert(g.test.S.training);g.elements.get('setupBack').dispatch('click');assert(g.elements.get('matchSetup').classList.contains('off'));g.elements.get('chooseFighter').dispatch('click');g.elements.get('setupNext').dispatch('click');g.elements.get('arena-rooftop-city').dispatch('click');g.elements.get('fighterFilm').dispatch('ended');g.step(7500);
 const {B,O,S,DIFFICULTY}=g.test;assert(S.training);const hp=B.hp,ox=O.x;g.step(65000);assert.equal(B.hp,hp);assert.equal(O.x,ox);assert.equal(S.t,60);assert(!S.ended);assert.equal(g.elements.get('clock').textContent,'∞');
 g.test.damage(O,999);assert.equal(O.hp,1);assert(!S.ended);g.step(1500);assert.equal(O.hp,100,'training target recovers');g.elements.get('pause').dispatch('click');B.hp=32;g.elements.get('trainingReset').dispatch('click');assert.equal(B.hp,100);assert.equal(B.en,100);assert(!S.paused);
 g.elements.get('training-block').dispatch('click');g.step(1000);assert.equal(O.a,'BLOCK');const before=O.hp;g.test.damage(O,20);assert(O.hp>before-20,'dummy blocks');g.elements.get('training-spar').dispatch('click');let sparAttack=false;g.step(20000,()=>{if(O.cfg[O.a].attack)sparAttack=true;});assert(sparAttack,'training sparring attacks');assert(!S.ended);g.test.damage(B,999);g.step(1600);assert(B.hp>1,'player health recovers');g.elements.get('training-idle').dispatch('click');g.elements.get('trainingReset').dispatch('click');
 const distances=[];for(const mode of ['easy','normal','hard']){g.elements.get('mode-'+mode).dispatch('click');assert(!S.training);assert.equal(S.difficulty,mode);assert.equal(g.elements.get('mode-'+mode).attributes['aria-pressed'],'true');g.proof.reset();B.x=10;O.x=90;O.cooldown=999999;g.step(1000);distances.push(90-O.x);}assert(distances[0]<distances[1]&&distances[1]<distances[2],'three AI approach speeds');assert(DIFFICULTY.easy.reaction>DIFFICULTY.normal.reaction&&DIFFICULTY.normal.reaction>DIFFICULTY.hard.reaction);
 // Color transform changes only warm hues; neon greens and alpha are exact.
 const cfg=g.test.CFG().IDLE,frame=g.test.decodeGif(cfg.asset).frames[0],graded=g.test.displayPixels(frame,cfg.asset);let changed=0;for(let i=0;i<graded.length;i+=4){assert.equal(graded[i+3],frame.pixels[i+3]);if(frame.pixels[i+1]>=frame.pixels[i])for(let j=0;j<3;j++)assert.equal(graded[i+j],frame.pixels[i+j]);if(graded[i]!==frame.pixels[i])changed++;}assert(changed>1000);assert.strictEqual(g.test.displayPixels(frame,'legacy'),frame.pixels);
 // Result art follows the actual winner and the rematch resets the match.
 g.proof.reset();S.wins=[1,0];B.hp=80;O.hp=0;g.test.endRound();assert(S.matchOver);assert.equal(g.elements.get('resultText').textContent,'BRAX');assert(g.elements.get('resultArt').src.endsWith('brax-selection.gif'));g.elements.get('rematch').dispatch('click');assert(!S.matchOver);assert.equal(S.round,1);assert.equal(B.hp,100);
 // Separate grounded bodies without reversing their order.
 g.proof.reset();B.x=50;O.x=50.1;B.face=1;g.test.separateFighters();assert(O.x-B.x>2);
 // Short knee reaches a grounded opponent at the body separation distance.
 g.step(7500);g.elements.get('mode-training').dispatch('click');for(const face of [1,-1]){g.proof.reset();B.x=50;O.x=50+face*.1;B.face=face;O.face=-face;g.test.separateFighters();assert(g.proof.attack('CLINCH_KNEE'));g.step(1600);assert(O.hp<100,'short knee connects facing '+face);}
 g.elements.get('mode-normal').dispatch('click');
 // Audit rejected hits: evasion must not grant hit counters or energy.
 g.proof.reset();const c=g.test.CFG().LIGHT_PUNCH,fi=Number(Object.keys(c.hits)[0]);B.a='LIGHT_PUNCH';B.frame=fi;B.x=45;O.x=53;g.test.render(B.a,fi);O.cfg.IDLE.evadeFrames=[0,7];O.frame=0;B.en=0;g.test.resolvePlayerHit();assert.equal(O.hp,100);assert.equal(B.en,0);assert.equal(S.combo,0);delete O.cfg.IDLE.evadeFrames;
 // Nyxa AI must attack at neutral and recover under repeated light punches.
 g.elements.get('mode-normal').dispatch('click');g.proof.reset();B.x=43;O.x=57;let attacked=false;g.step(12000,()=>{if(O.cfg[O.a].attack)attacked=true;B.hp=100;O.hp=100;});assert(attacked,'Nyxa opponent attacks');
 g.proof.reset();B.x=45;O.x=55;let ticks=0,counters=0,guards=0,received=0;g.step(20000,()=>{ticks+=16;if(ticks>=480){ticks=0;g.test.playerButtonAttack('punch');}if(O.cfg[O.a].attack)counters++;if(O.a==='BLOCK')guards++;if(B.hp<100){received+=100-B.hp;B.hp=100;}O.hp=100;});assert(guards>0,'Nyxa returns to defense after hits');assert(counters>0,'Nyxa is not permanently trapped in hit recovery');assert(received>0,'Nyxa lands a counterattack during repeated punches');
 for(const slot of [0,1])for(const rival of ['BRAX','NYXA']){const pair=await createGame(844,390,true);pair.elements.get('go').dispatch('click');if(slot)pair.elements.get('nextFighter').dispatch('click');await pair.flush();pair.elements.get('rosterOpponent').dispatch('click');pair.elements.get('card-'+rival.toLowerCase()).dispatch('click');pair.elements.get('chooseFighter').dispatch('click');assert.equal(pair.elements.get('rosterOpponent').textContent,'PRZECIWNIK · '+rival);pair.elements.get('setupNext').dispatch('click');pair.elements.get('arena-rooftop-city').dispatch('click');pair.elements.get('fighterFilm').dispatch('ended');pair.step(7500);assert.equal(pair.state().character,slot?'NYXA':'BRAX');assert.equal(pair.state().opponent.character,rival);const {B:pb,O:po,S:ps}=pair.test;let hits=0;pair.step(16000,()=>{if(pb.hp<100){hits+=100-pb.hp;pb.hp=100;}po.hp=100;});assert(hits>0,'AI lands attacks for pairing '+slot+'/'+rival);for(const level of ['easy','normal','hard']){pair.elements.get('mode-'+level).dispatch('click');pair.proof.reset();let attacks=0;pair.step(10000,()=>{if(po.cfg[po.a].attack)attacks++;pb.hp=po.hp=100;});assert(attacks>0,'AI attacks on '+level);}pair.elements.get('mode-training').dispatch('click');pair.proof.reset();pair.step(65000);assert(!ps.ended);assert.equal(pb.hp,100);assert.equal(ps.t,60);assert.equal(pair.state().opponent.character,rival);console.log('PASS pairing '+pair.state().character+' / '+rival+': 3 levels + training');}
 console.log('Nyxa repeated-punch simulation: attack frames '+counters+', block frames '+guards+', damage dealt '+received);
 console.log('PASS: 3 AI levels, 65s training, health recovery/reset, warm-color correction preserves greens/alpha, result/rematch, body spacing and rejected-hit accounting');
})().catch(e=>{console.error(e);process.exit(1)});
