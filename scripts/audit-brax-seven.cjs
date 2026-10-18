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
  vm.runInNewContext(fs.readFileSync('game/assets/nyxa-data.js','utf8'),context);
  vm.runInNewContext(script.replace("game.classList.add('menu-open');menuAudio.start();setPose('IDLE');","window.__TEST__={B,O,S,K,faceOpponents,decodeGif,CFG:()=>CFG,opponentPose,resolvePlayerHit,drawOpponent,damage,evade,jump,endRound,startCountdown,playerButtonAttack,render,actionStep,playerHurtbox,opponentHurtbox,fighterRect,frameAnchorY,frameBox,attackRect,moveTempo,actionTempo};game.classList.add('menu-open');menuAudio.start();setPose('IDLE');"), context, {timeout: 20000});
  const send = (name, more = {}) => {for (const fn of events[name] || []) fn({preventDefault() {}, ...more});};
  const step = (ms, sample = () => {}) => {for (let elapsed = 0; elapsed < ms; elapsed += 16) {time += 16; for (const [id, task] of timers) if (task.at <= time) {timers.delete(id); task.fn();} raf(time); sample();}};
  const key = (name, down = true) => send(down ? 'keydown' : 'keyup', {key: name, repeat: false});
  const proof = context.__BRAX_PROOF__;
  const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve();step(180);for(let i=0;i<6;i++)await Promise.resolve();step(32);};await flush();return {flush,test:context.__TEST__, elements, buttons, document, send, step, key, proof, state: proof.state, pixelBytes: () => elements.get('bSprite').pixels, pixels: () => crypto.createHash('sha256').update(elements.get('bSprite').pixels).digest('hex')};
}



(async()=>{
 const g=await createGame(844,390,true);g.elements.get('go').dispatch('click');await g.flush();g.elements.get('chooseFighter').dispatch('click');g.elements.get('arena-rooftop').dispatch('click');g.elements.get('fighterFilm').dispatch('ended');g.step(7500);
 const {B,O}=g.test;g.proof.reset();O.x=90;O.stun=999999;O.cooldown=999999;
 const seen=new Set();g.step(2800,()=>{seen.add(B.frame);assert.equal(B.a,'IDLE');assert(B.frame<8,'idle must not enter punch sequence');});assert(seen.size===8,'all eight guard frames loop');
 assert(g.proof.attack('LIGHT_PUNCH'));assert.equal(B.frame,8,'jab starts at preparation, not idle pause');g.step(115);assert.equal(B.frame,10,'jab reaches contact promptly');g.step(450);assert.equal(B.a,'IDLE');assert(!B.lock);
 g.test.opponentPose('LIGHT_PUNCH',true);assert.equal(O.frame,0,'Nyxa original start preserved');
 for(const name of ['LEAN','HEAVY_PUNCH','UPPERCUT','HEAVY_KICK','MUAY_THAI_ROUNDHOUSE']){g.proof.reset();O.stun=999999;O.x=90;O.cooldown=999999;assert(g.proof.attack(name));g.step(1400);assert.equal(B.a,'IDLE',name+' returns to guard');assert(!B.lock);}
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('game/assets/brax-selection.gif')).digest('hex'),'c0f70ce5344fb55b3228f1d188e6ce183ddc312b7687e1db6506597cf8e815ee','complete original selection celebration');
 console.log('PASS: Brax guard-only loop, responsive jab, new moves return to guard, original 53-frame selection asset');
})().catch(e=>{console.error(e);process.exit(1)});
