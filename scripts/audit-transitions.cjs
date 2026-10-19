/* Opening-film lifecycle and shared scene transitions. Real clip/browser proof is separate. */
const fs=require('node:fs'),assert=require('node:assert/strict');

(async()=>{
 const {Window}=await import('happy-dom');
 const source=name=>fs.readFileSync('game/assets/'+name,'utf8');
 const settle=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
 let checks=0;
 function fixture({film=true,reduced=false,hidden=false}={}){
  // Only trusted source from this checkout is evaluated; no remote scripts or user input.
  const window=new Window({settings:{enableJavaScriptEvaluation:true,suppressInsecureJavaScriptEnvironmentWarning:true}}),document=window.document;
  document.body.innerHTML='<div id="sceneFade"></div><button id="modePlay">Play</button><audio id="titleAudio"></audio><audio id="crowdAudio"></audio><audio id="startAudio"></audio><audio id="arenaAudio"></audio>';
  Object.defineProperty(document,'hidden',{value:hidden,writable:true,configurable:true});
  let now=0,serial=0;const tasks=new Map(),plays=[];
  window.setTimeout=(fn,delay=0)=>{tasks.set(++serial,{fn,at:now+Number(delay)});return serial;};
  window.clearTimeout=id=>tasks.delete(id);window.requestAnimationFrame=fn=>window.setTimeout(()=>fn(now),16);
  window.matchMedia=()=>({matches:reduced});window.BRAX_I18N={t:key=>key};
  for(const audio of document.querySelectorAll('audio'))audio.pause=()=>{audio.pauseCount=(audio.pauseCount||0)+1;};
  window.BRAX_PLAY_VIDEO=async(video,active)=>{
   assert.equal(document.getElementById('startFilm').hidden,false,'opaque layer is visible before any asynchronous play');
   await new Promise((resolve,reject)=>plays.push({resolve,reject}));
   if(!active())video.pause();
  };
  window.eval(source(film?'start-film.js':'scene-transition.js'));
  const get=id=>document.getElementById(id),video=get('startVideo');
  if(video){
   Object.defineProperties(video,{paused:{value:true,writable:true,configurable:true},error:{value:null,writable:true,configurable:true}});
   video.pause=()=>{video.paused=true;};video.load=()=>{video.error=null;};
  }
  const emit=(node,name)=>node.dispatchEvent(new window.Event(name));
  async function step(ms){
   const target=now+ms;await settle();
   for(let count=0;;count++){
    assert(count<10000,'timer queue must settle');
    const next=[...tasks].filter(([,task])=>task.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];
    if(!next)break;tasks.delete(next[0]);now=next[1].at;next[1].fn();await settle();
   }
   now=target;await settle();
  }
  function visible(value){document.hidden=!value;emit(document,'visibilitychange');}
  async function playing(index=plays.length-1){video.paused=false;emit(video,'playing');plays[index].resolve();await settle();}
  return{window,document,get,video,emit,step,plays,visible,playing,api:window.BRAX_START_FILM};
 }

 // The account integration invokes this modal explicitly, without the removed START/copyright sequence.
 let f=fixture(),completed=0,endedEvents=0;
 f.window.addEventListener('brax:start-film-ended',()=>{assert.equal(f.api.active,false);endedEvents++;});
 assert.equal(f.plays.length,0);assert.equal(f.api.active,false);assert.equal(f.api.played,false);assert.equal(f.get('startFilm').hidden,true);checks++;
 assert.equal(f.api.play(()=>{completed++;assert.equal(f.get('startFilm').hidden,false);assert.equal(f.get('startFilm').classList.contains('start-film-leaving'),false);}),true);
 assert.equal(f.video.getAttribute('src'),'/assets/start-intro-20261007.mp4');
 assert.equal(f.api.play(()=>completed+=100),false);assert.equal(f.plays.length,1);
 assert.equal(f.get('startFilm').classList.contains('start-film-has-frame'),false);
 for(const audio of f.document.querySelectorAll('audio'))assert.equal(audio.pauseCount,1);checks++;
 // Fast skip before media resolves must still deliver exactly one continuation under solid black.
 f.get('startFilmSkip').click();f.get('startFilmSkip').click();f.emit(f.video,'ended');
 assert.equal(completed,1);assert.equal(f.api.played,true);assert.equal(f.api.active,true);
 f.plays[0].resolve();await f.step(16);assert.equal(f.get('startFilm').classList.contains('start-film-leaving'),false);
 await f.step(16);assert.equal(f.get('startFilm').classList.contains('start-film-leaving'),true);assert.equal(f.get('startFilm').hidden,false);
 await f.step(239);assert.equal(f.api.active,true);await f.step(1);
 assert.equal(f.get('startFilm').hidden,true);assert.equal(f.api.active,false);assert.equal(endedEvents,1);checks++;

 // A normal end and muted preference use the same callback path.
 f=fixture();completed=0;f.get('titleAudio').muted=true;f.api.play(()=>completed++);assert.equal(f.video.muted,true);
 await f.playing();assert.equal(f.get('startFilm').classList.contains('start-film-has-frame'),true);
 f.emit(f.video,'ended');f.emit(f.video,'ended');assert.equal(completed,1);assert.equal(f.get('startFilm').classList.contains('start-film-has-frame'),false);
 await f.step(272);assert.equal(f.api.active,false);checks++;

 // Autoplay denial and media errors never fake success or silently skip the owner's film.
 f=fixture();completed=0;f.api.play(()=>completed++);
 f.plays[0].reject(Object.assign(new Error('Denied'),{name:'NotAllowedError'}));await settle();
 assert.equal(f.get('startFilmPlay').hidden,false);assert.equal(f.get('startFilmPlay').disabled,false);assert.equal(completed,0);
 f.get('startFilmPlay').click();assert.equal(f.plays.length,2);await f.playing();assert.equal(f.get('startFilmPlay').hidden,true);checks++;
 f.visible(false);assert.equal(f.video.paused,true);f.visible(true);assert.equal(f.plays.length,3);
 // Rapid hide/show waits for the earlier play promise to settle before a new one can begin.
 f.visible(false);f.visible(true);assert.equal(f.plays.length,3);f.plays[2].resolve();await settle();assert.equal(f.plays.length,4);checks++;
 f.video.error={code:2};f.emit(f.video,'error');f.plays[3].reject(new Error('Network'));await settle();
 assert.equal(completed,0);assert.equal(f.get('startFilm').hidden,false);assert.equal(f.get('startFilmPlay').hidden,false);assert.equal(f.get('startFilmPlay').disabled,false);
 f.visible(false);f.visible(true);assert.equal(f.plays.length,4,'a failed film requires an explicit retry');checks++;
 f.get('startFilmPlay').click();assert.equal(f.video.error,null);await f.playing();f.get('startFilmSkip').click();await f.step(272);assert.equal(completed,1);checks++;

 // Background restores wait for visibility; reduced motion skips the fade after the two opaque frames.
 f=fixture({hidden:true,reduced:true});completed=0;f.api.play(()=>completed++);assert.equal(f.plays.length,0);assert.equal(f.get('startFilm').hidden,false);
 f.visible(true);assert.equal(f.plays.length,1);await f.playing();
 const escape=new f.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true});f.document.dispatchEvent(escape);assert.equal(escape.defaultPrevented,true);
 await f.step(31);assert.equal(f.api.active,true);await f.step(1);assert.equal(f.api.active,false);assert.equal(completed,1);checks++;

 // The independent shared fade serializes changes and stays opaque while an asynchronous change waits.
 f=fixture({film:false});let release;const order=[],fade=f.get('sceneFade');
 f.window.BRAX_TRANSITION.run(()=>{assert(fade.classList.contains('dark'));order.push('first');return new Promise(resolve=>release=resolve);});
 f.window.BRAX_TRANSITION.run(()=>{assert(fade.classList.contains('dark'));order.push('second');});
 await f.step(239);assert.deepEqual(order,[]);await f.step(1);assert.deepEqual(order,['first']);
 await f.step(1000);assert.deepEqual(order,['first']);assert(fade.classList.contains('dark'));assert(fade.classList.contains('busy'));
 release();await f.step(800);assert.deepEqual(order,['first','second']);assert(!fade.classList.contains('dark'));assert(!fade.classList.contains('busy'));checks++;

 // Stalled media readiness releases the scene fade after its bounded fallback.
 f=fixture({film:false});let ready=false;const stalled=f.document.createElement('video');
 f.window.BRAX_TRANSITION.run(()=>f.window.BRAX_TRANSITION.videoReady(stalled).then(()=>ready=true));
 await f.step(2739);assert.equal(ready,false);await f.step(1);assert.equal(ready,true);await f.step(300);
 assert(!f.get('sceneFade').classList.contains('busy'));checks++;
 // A real loaded-data/error event resolves readiness immediately and cancels its fallback timer.
 f=fixture({film:false});let loaded=false,errored=false;
 const loading=f.document.createElement('video'),broken=f.document.createElement('video');
 f.window.BRAX_TRANSITION.videoReady(loading).then(()=>loaded=true);f.window.BRAX_TRANSITION.videoReady(broken).then(()=>errored=true);
 f.emit(loading,'loadeddata');f.emit(broken,'error');await settle();assert(loaded&&errored);checks++;
 console.log(`PASS: ${checks} opening-film and shared-transition lifecycle checks (original clip, opaque entry, once-only completion, retry, visibility race, queued fade, stalled-media fallback)`);
})().catch(error=>{console.error(error);process.exitCode=1;});
