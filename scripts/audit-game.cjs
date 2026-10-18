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
  vm.runInNewContext(fs.readFileSync('docs/legacy-nyxa-test-fixture.js','utf8'),context);
  // Legacy data is an offline regression fixture, never shipped to players.
  context.NYXA_3D={config:context.NYXA_DATA.config,frames:{}};Object.assign(context.BRAX_DATA.assets,context.NYXA_DATA.assets);Object.assign(context.BRAX_DATA.sha256,context.NYXA_DATA.sha256);
  vm.runInNewContext(script.replace("game.classList.add('menu-open');menuAudio.start();setPose('IDLE');","window.__TEST__={B,O,S,K,faceOpponents,decodeGif,CFG:()=>CFG,opponentPose,resolvePlayerHit,drawOpponent,damage,evade,jump,endRound,startCountdown,playerButtonAttack,render,actionStep,playerHurtbox,opponentHurtbox,fighterRect,frameAnchorY,frameBox,attackRect,moveTempo,actionTempo};game.classList.add('menu-open');menuAudio.start();setPose('IDLE');"), context, {timeout: 20000});
  const send = (name, more = {}) => {for (const fn of events[name] || []) fn({preventDefault() {}, ...more});};
  const step = (ms, sample = () => {}) => {for (let elapsed = 0; elapsed < ms; elapsed += 16) {time += 16; for (const [id, task] of timers) if (task.at <= time) {timers.delete(id); task.fn();} raf(time); sample();}};
  const key = (name, down = true) => send(down ? 'keydown' : 'keyup', {key: name, repeat: false});
  const proof = context.__BRAX_PROOF__;
  const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve();step(180);for(let i=0;i<6;i++)await Promise.resolve();step(32);};await flush();return {flush,test:context.__TEST__, elements, buttons, document, send, step, key, proof, state: proof.state, pixelBytes: () => elements.get('bSprite').pixels, pixels: () => crypto.createHash('sha256').update(elements.get('bSprite').pixels).digest('hex')};
}


(async()=>{
const results=[];
for(const [width,height] of [[844,390],[568,320]])for(const slot of [0,1]){
 const g=await createGame(width,height,true);g.elements.get('go').dispatch('click');if(slot)g.elements.get('nextFighter').dispatch('click');await g.flush();assert.equal(g.proof.selectedSlot(),slot);
 assert.equal(g.elements.get('selectionName').textContent,slot?'NYXA':'BRAX');
 g.elements.get('chooseFighter').dispatch('click');g.elements.get('arena-rooftop').dispatch('click');assert(g.state().cinematic);assert(g.elements.get('fighterFilm').src.endsWith(slot?'nyxa-intro-20261007.mp4':'brax-intro-20261007.mp4'));g.step(1000);assert.equal(g.state().time,60);g.elements.get('fighterFilm').dispatch('ended');g.step(7500);
 assert.deepEqual(Array.from(g.proof.audio().played.filter(x=>['three','two','one','fight'].includes(x.key)),x=>x.key),['three','two','one','fight'],'spoken countdown in order');assert(g.proof.audio().played.some(x=>x.key==='gong'),'gong begins the fight');assert(g.proof.audio().played.some(x=>x.key===(slot?'nyxa-ready':'brax-ready')),'character introduction voice');
 assert(g.state().running&&!g.state().preFight);assert.equal(g.state().character,slot?'NYXA':'BRAX');assert.equal(g.state().opponent.character,slot?'BRAX':'NYXA');
 const {B,O}=g.test;
 // Independent touch pointers: moving and punching together, cancellation releases movement.
 g.proof.reset();const right=g.buttons.find(x=>x.dataset.hold==='right'),punch=g.buttons.find(x=>x.dataset.tap==='punch');right.dispatch('pointerdown',{pointerId:11});punch.dispatch('pointerdown',{pointerId:22});assert(g.test.K.right&&B.lock,'two thumbs act independently');right.dispatch('pointercancel',{pointerId:11});punch.dispatch('pointerup',{pointerId:22});assert(!g.test.K.right,'cancelled touch cannot leave movement stuck');g.proof.reset();

 for(const [px,ox] of [[25,75],[75,25]]){B.x=px;O.x=ox;g.test.faceOpponents();assert.equal(B.face,px<ox?1:-1);assert.equal(O.face,-B.face);}
 const names=slot?['LIGHT_PUNCH','HEAVY_PUNCH','TEEP','LIGHT_KICK','HEAVY_KICK','CLINCH_KNEE','LUNGE_PUNCH','CROUCH_KICK','HOOK','COMBO']:['LIGHT_PUNCH','HEAVY_PUNCH','CROUCH_PUNCH','LIGHT_KICK','HEAVY_KICK','CROUCH_KICK','MUAY_THAI_ROUNDHOUSE','UPPERCUT','DOUBLE_PUNCH','CHAIN_STRIKES','COMBO'];
 for(const name of names){g.proof.reset();O.x=90;O.cooldown=100000;B.x=15;B.en=100;assert(g.proof.attack(name),name);const visited=new Set();g.step(4000,()=>{if(B.a===name)visited.add(B.frame)});assert(visited.size>1,name+' animates');assert(!B.lock,name+' exits');assert(B.hp>0)}
 // Natural encounter: AI must approach close enough for either fighter's jab.
 for(const face of [1,-1]){g.proof.reset();B.x=face>0?28:72;O.x=face>0?72:28;O.cooldown=100000;g.step(6500);O.stun=100000;assert(g.proof.attack('LIGHT_PUNCH'));g.step(1600);assert(O.hp<100,`${slot?'NYXA':'BRAX'} jab reaches at AI stopping distance, ${width}px, facing ${face}`);}
 // Visible standing body, excluding transparent sprite margins, fills at least 60% of phone height.
 g.proof.reset();const idle=g.test.CFG().IDLE,bodyHeight=(idle.boxes[0][3]-idle.boxes[0][1])*parseFloat(g.elements.get('bSprite').style.height)/g.elements.get('bSprite').height;assert(bodyHeight>=height*.60-.5,`fighter too small: ${bodyHeight}/${height}`);
 // Regression: real contact on both facing directions, miss at distance, no duplicate damage.
 if(width===844){
  const cfg=g.test.CFG();
  for(const name of names.filter(n=>n!=='COMBO'))for(const face of [1,-1]){
   g.proof.reset();O.stun=100000;B.x=50;O.x=face>0?75:25;g.test.faceOpponents();
   const c=cfg[name],h=Object.values(c.hits)[0],target=g.test.opponentHurtbox(),root=O.x/100*width,near=face>0?root-target.left:target.right-root;
   B.a=name;B.frame=Number(Object.keys(c.hits)[0]);g.test.render(name,B.frame);
   const rect=g.test.attackRect(h.box),reach=face>0?rect.right-B.x/100*width:B.x/100*width-rect.left;
   O.x=B.x+face*(reach+near-7)/width*100;B.a='IDLE';B.frame=0;g.test.render('IDLE',0);
   assert(g.proof.attack(name));g.step(1800);
   assert(O.hp<100,`${slot?'NYXA':'BRAX'} ${name} contact facing ${face}`);
   const expected=Object.values(c.hits).reduce((m,h)=>(m.set(h.group,h.damage),m),new Map());
   assert(100-O.hp<=[...expected.values()].reduce((a,b)=>a+b,0)+.001,'one damage per contact group');
   g.proof.reset();O.stun=100000;B.x=10;O.x=90;g.test.faceOpponents();assert(g.proof.attack(name));g.step(1800);assert.equal(O.hp,100,name+' cannot hit across arena');
  }
  assert.equal(g.test.moveTempo('NYXA'),1.22);assert.equal(g.test.actionTempo('NYXA',cfg.LIGHT_PUNCH,0),1.22);
 }
 if(!slot&&width===844){for(const [asset,hashes] of Object.entries(referenceFrames)){if(!assets[asset])continue;const a=g.test.decodeGif(asset);assert.equal(a.frames.length,hashes.length);for(let i=0;i<hashes.length;i++){const bytes=Buffer.from(a.frames[i].pixels);for(let j=0;j<bytes.length;j+=4)if(!bytes[j+3])bytes.fill(0,j,j+3);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hashes[i],asset+' decoded frame '+i)}}}
 // Every NYXA file decodes identically to independent Pillow RGBA frames.
 if(slot){const refs=JSON.parse(fs.readFileSync('docs/nyxa-decoded-hashes.json','utf8'));for(const [asset,hashes] of Object.entries(refs)){const a=g.test.decodeGif(asset);assert.equal(a.frames.length,hashes.length);for(let i=0;i<hashes.length;i++){const bytes=Buffer.from(a.frames[i].pixels);for(let j=0;j<bytes.length;j+=4)if(!bytes[j+3])bytes.fill(0,j,j+3);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hashes[i],asset+' frame '+i)}}}
 g.proof.reset();O.x=90;O.cooldown=100000;B.x=20;g.key('ArrowRight');g.step(500);g.key('ArrowRight',false);assert(B.x>20,'movement translates');g.step(32);const contact=g.proof.groundContact();assert(Math.abs(contact.floor-contact.feet)<3,'grounded feet');
 const gongs=g.proof.audio().played.filter(x=>x.key==='gong').length;g.elements.get('pause').dispatch('click');const before=B.x;g.step(500);assert.equal(B.x,before);g.elements.get('pause').dispatch('click');assert.equal(g.proof.audio().played.filter(x=>x.key==='gong').length,gongs,'resume does not repeat opening gong');
 g.proof.reset();O.cooldown=100000;B.en=100;B.x=45;O.x=53;g.test.faceOpponents();assert(g.proof.attack('LIGHT_PUNCH'));g.step(550);assert(O.hp<100,'real collision damages opponent');
 g.proof.reset();O.cooldown=100000;O.x=90;B.x=20;g.test.K.block=true;g.test.damage(B,10);assert(Math.abs(B.hp-98.2)<.001,'block reduces damage');g.test.K.block=false;assert(g.test.evade());if(!slot){const root=B.x;g.step(155);assert(B.frame>=3&&B.frame<=6,'Brax evade is in its visible lean phase');assert.equal(B.x,root,'Brax evade does not teleport');}const hp=B.hp;g.test.damage(B,10);assert.equal(B.hp,hp,'evade protects during its window');g.step(1600);g.test.damage(B,10);assert.equal(B.hp,hp-10,'evade expires');
 {g.proof.reset();O.cooldown=100000;O.x=90;g.test.jump();g.step(slot?320:460);assert(!B.ground,'jump becomes airborne');assert(g.proof.attack('JUMP_PUNCH'),'jumping knee starts');g.step(2000);assert(B.ground&&!B.lock,'jumping knee lands and unlocks');}
 // Combo consumes a full meter once, closes distance, cannot exceed 2 per round.
 g.proof.reset();O.x=85;O.cooldown=100000;B.x=15;B.en=99;assert(!g.proof.attack('COMBO'));B.en=100;assert(g.proof.attack('COMBO'));assert.equal(B.en,0);assert.equal(g.state().comboUses,1);assert(!g.proof.attack('COMBO'));g.step(4000);assert(B.x>15);assert(O.hp<100,'automatic combo reaches opponent');B.en=100;assert(g.proof.attack('COMBO'));g.step(4000);B.en=100;assert(!g.proof.attack('COMBO'));assert.equal(g.state().comboUses,2);
 // Time pauses, round scoring progresses and the third round terminates the match.
 g.proof.reset();g.test.S.round=1;g.test.S.wins=[0,0];g.test.S.matchOver=false;B.hp=90;O.hp=50;g.test.S.t=.02;g.step(32);assert(g.test.S.ended);assert.equal(g.test.S.wins[0],1);g.step(2300);assert.equal(g.test.S.round,2);assert.equal(g.test.S.comboUses,0);g.step(5000);B.hp=40;O.hp=90;g.test.endRound();g.step(2300);assert.equal(g.test.S.round,3);g.step(5000);B.hp=90;O.hp=20;g.test.endRound();assert(g.test.S.matchOver);assert.equal(g.test.S.wins[0],2);g.step(2500);assert.equal(g.test.S.round,3);assert(!g.elements.get('matchEnd').classList.contains('off'));g.elements.get('rematch').dispatch('click');assert.equal(g.test.S.round,1);assert(!g.test.S.matchOver);
 g.proof.reset();B.x=45;O.x=55;g.step(20000);assert(Number.isFinite(B.hp)&&Number.isFinite(O.hp),'AI close combat remains valid');
 results.push({viewport:`${width}x${height}`,player:slot?'NYXA':'BRAX',actions:names.length,facing:'both sides',movement:'pass',hits:'pass'});
}
// Only the two supplied fighters are in the carousel.
{const g=await createGame(844,390);g.elements.get('go').dispatch('click');await g.flush();g.elements.get('previousFighter').dispatch('click');await g.flush();assert.equal(g.proof.selectedSlot(),1);g.elements.get('nextFighter').dispatch('click');await g.flush();assert.equal(g.proof.selectedSlot(),0);assert(!g.elements.get('chooseFighter').disabled);}
const report={status:'pass',results,regressions:['contact both directions','no ranged phantom hits','single damage per group','Nyxa movement and attack tempo','menu wraps two fighters','original animation pixel hashes','recorded 3 2 1 FIGHT in order and gong','independent movement and attack touches with cancellation','pause resumes without gong','AI close combat without missing-move errors','both fighters jab reaches at natural stopping distance in both directions','visible standing fighter height at least 60 percent of phone screen']};fs.writeFileSync('docs/current-review-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
