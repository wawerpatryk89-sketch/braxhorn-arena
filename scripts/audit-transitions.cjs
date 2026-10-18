const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 let now=0,id=0;const tasks=new Map(),elements=new Map(),events={};
 function element(name){const classes=new Set(['startFilm','startFilmPlay','copyrightNotice'].includes(name)?['off']:[]),listeners={};return {classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},muted:false,readyState:0,decode:()=>Promise.resolve(),pause(){},play(){this.readyState=2;this.emit('playing');return Promise.resolve()},addEventListener(n,f){(listeners[n]??=[]).push(f)},removeEventListener(n,f){listeners[n]=(listeners[n]||[]).filter(v=>v!==f)},emit(n){for(const f of listeners[n]||[])f()},textContent:''}}
 for(const name of ['startFilm','startVideo','startFilmPlay','startFilmStatus','copyrightNotice','copyrightImage','sceneFade','titleAudio','crowdAudio','startAudio','startFilmSkip','menuSound'])elements.set(name,element(name));
 const doc={hidden:false,querySelector:s=>elements.get(s.slice(1)),addEventListener:(n,f)=>events[n]=f};
 const set=(f,ms)=>{tasks.set(++id,{f,at:now+ms});return id};
 const ctx={document:doc,performance:{now:()=>now},setTimeout:set,clearTimeout:i=>tasks.delete(i),requestAnimationFrame:f=>set(f,16),queueMicrotask,Promise};ctx.window=ctx;
 ctx.BRAX_PLAY_VIDEO=video=>video.play();vm.runInNewContext(fs.readFileSync('game/assets/start-film.js','utf8'),ctx);
 async function step(ms){for(let t=0;t<ms;t+=16){now+=16;for(const [i,v] of tasks)if(v.at<=now){tasks.delete(i);v.f()}for(let k=0;k<8;k++)await Promise.resolve()}}
 let completed=0;ctx.BRAX_START_FILM.play(()=>completed++);ctx.BRAX_START_FILM.play(()=>completed+=100);
 assert(elements.get('startFilm').classList.contains('off'),'opening art stays until the film plays and fades');await step(300);assert(!elements.get('startFilm').classList.contains('off'));
 // A fast skip during the first fade must not lose the next screen.
 elements.get('startFilmSkip').emit('click');elements.get('startFilmSkip').emit('click');await step(900);assert(!elements.get('copyrightNotice').classList.contains('off'));assert.equal(completed,0);
 doc.hidden=true;events.visibilitychange();await step(6000);assert.equal(completed,0,'notice timer pauses while hidden');doc.hidden=false;events.visibilitychange();await step(4500);assert.equal(completed,1);assert(!ctx.BRAX_START_FILM.active);assert(!elements.get('sceneFade').classList.contains('busy'));
 // Network stalls release the fade instead of blocking all controls forever.
 let finished=false;ctx.BRAX_TRANSITION.run(()=>ctx.BRAX_TRANSITION.videoReady(element('stalled')).then(()=>finished=true));await step(3100);assert(finished);assert(!elements.get('sceneFade').classList.contains('busy'));
 console.log('PASS: startup, fast skip, four-second notice, hidden-tab pause, single completion, stalled-video fallback');
})().catch(e=>{console.error(e);process.exitCode=1});
