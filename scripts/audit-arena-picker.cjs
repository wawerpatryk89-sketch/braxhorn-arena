// Native DOM audit for the cinematic picker. Full media and phone layout are covered by browser QA.
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const {Window}=await import('happy-dom');
 const w=new Window({url:'http://localhost:8788',settings:{enableJavaScriptEvaluation:true,disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});
 w.ResizeObserver=class{observe(){}};w.HTMLMediaElement.prototype.play=async()=>{};w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.load=()=>{};
 w.document.write(fs.readFileSync('game/index.html','utf8').replace(/<script\b[\s\S]*?<\/script>/gi,''));
 for(const name of ['i18n.js','i18n-common.js','i18n-content.js','i18n-online.js','arena-catalog.js'])w.eval(fs.readFileSync('game/assets/'+name,'utf8'));
 w.BRAX_I18N.missingKeys.clear();w.BRAX_I18N.apply(w.document);
 w.localStorage.setItem('braxhorn.arena.v1','snow');w.eval(fs.readFileSync('game/assets/arena-picker.js','utf8'));
 const $=id=>w.document.getElementById(id),cards=[...$('arenaStrip').querySelectorAll('.arena-thumb')],picker=w.BRAX_ARENA_PICKER;
 const settle=async()=>{for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));},wait=ms=>new Promise(r=>setTimeout(r,ms));
 const hold=async(ms)=>{const button=$('arenaConfirm');button.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await wait(ms);button.dispatchEvent(new w.KeyboardEvent('keyup',{key:'Enter',bubbles:true}));await settle();};
 const expected=['nocny-targ','rooftop-city','metro','brooklyn','harbor','carrier','reactor','beach','himalaya','jungle','savanna','volcano','dragon','aquarium','clocktower','funfair','mine'];assert.deepEqual(cards.map(c=>c.id.slice(6)),expected);assert.deepEqual(Object.keys(w.BRAX_ARENA_VIDEOS),expected);
 assert.equal(picker.selection(),'nocny-targ','removed saved arena falls back to first');assert.equal(w.localStorage.getItem('braxhorn.arena.v1'),'nocny-targ');
 assert(!$('arenaSearch'));assert(!$('arenaHeroNumber'));assert(!$('arenaCount'));assert(!$('arenaNext'));assert(!$('arenaPrevious'));
 $('arenaSelection').classList.remove('off');await settle();let launches=[],versus=0;for(const c of cards)c.addEventListener('click',()=>launches.push(c.id));w.BRAX_UI={versus:async()=>{versus++;}};
 $('arena-aquarium').click();assert.equal(picker.selection(),'aquarium');assert.equal(launches.length,0,'preview never starts combat');assert.equal($('arenaHeroName').textContent,'AKWARIUM');$('arenaConfirm').click();assert.equal(launches.length,0,'tap only hints');
 await hold(90);assert.equal(launches.length,0,'short hold does not start');await wait(200);assert.equal(picker.report().progress,0,'early release restores progress');
 await hold(570);assert.deepEqual(launches,['arena-aquarium']);assert.equal(versus,1);assert(picker.report().launchPending);assert($('arenaConfirm').disabled,'guard persists while combat handoff is pending');$('arenaConfirm').click();assert.equal(versus,1,'pending handoff cannot create a second VS');$('arenaSelection').classList.add('off');await settle();$('arenaSelection').classList.remove('off');await settle();
 for(const category of ['city','nature','fantasy','industry']){$('arenaCategories').querySelector('[data-category='+category+']').click();const visible=cards.filter(c=>!c.hidden);assert(visible.length>0);assert(visible.every(c=>w.BRAX_ARENA_VIDEOS[c.id.slice(6)].category===category));}
 picker.select('nocny-targ');assert.equal(picker.report().category,'all','external selection clears incompatible category');assert.equal(cards.filter(c=>!c.hidden).length,17);
 const randomBefore=picker.selection();$('arenaRandom').click();assert.notEqual(picker.selection(),randomBefore,'random selects another arena');assert.equal(launches.length,1,'random only previews');picker.select('nocny-targ');
 const root=$('arenaSelection');root.dispatchEvent(new w.PointerEvent('pointerdown',{pointerId:42,clientX:500,clientY:110,bubbles:true}));root.dispatchEvent(new w.PointerEvent('pointerup',{pointerId:42,clientX:420,clientY:110,bubbles:true}));assert.equal(picker.selection(),'rooftop-city','horizontal backdrop swipe advances');picker.select('nocny-targ');
 const first=cards[0];first.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));assert.equal(picker.selection(),'mine','wrap previous from first');cards.at(-1).dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(picker.selection(),'nocny-targ','wrap next from last');
 const selected=picker.selection();await w.BRAX_I18N.setLanguage('en');await settle();assert.equal(picker.selection(),selected);assert.equal($('arenaHeroName').textContent,'NIGHT MARKET');assert.equal($('arenaHeroCategory').textContent,'CITY');assert.equal($('arenaHoldHint').textContent,'HOLD');assert.equal(cards.filter(c=>c.getAttribute('aria-pressed')==='true').length,1);assert(picker.report().preloaded.length<=3,'only selected and immediate neighbours are preloaded');
 picker.select('snow');assert.equal(picker.selection(),'nocny-targ');$('arenaSelection').classList.add('off');await settle();assert.equal(picker.report().preloaded.length,0,'hidden picker releases videos');assert.deepEqual([...w.BRAX_I18N.missingKeys],[]);
 console.log('PASS cinematic arena picker: seventeen prepared arenas, removed selection fallback, categories, random/list preview, tap hint, early release, half-second original click after VS, keyboard wrap, PL/EN preservation and at most three preloaded videos. DOM model; real media and layout require browser checks.');
 await w.happyDOM.abort();
})().catch(error=>{console.error(error);process.exitCode=1;});
