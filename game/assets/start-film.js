/* Preserve the owner's original opening clip; account entry decides when it starts. */
(()=>{
 'use strict';
 const layer=document.createElement('section');
 layer.id='startFilm';layer.hidden=true;layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.tabIndex=-1;
 layer.innerHTML='<video id="startVideo" class="start-film-video" playsinline preload="none" disablepictureinpicture></video><button id="startFilmSkip" class="start-film-skip" type="button"><span id="startFilmSkipLabel"></span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 5 10 7L5 19V5Zm13 0v14"/></svg></button><div class="start-film-feedback"><button id="startFilmPlay" class="start-film-play" type="button" hidden><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m8 5 11 7-11 7V5Z"/></svg><span id="startFilmPlayLabel"></span></button><p id="startFilmStatus" role="status" aria-live="polite"></p></div>';
 document.body.append(layer);
 const video=layer.querySelector('video'),skip=layer.querySelector('#startFilmSkip'),retry=layer.querySelector('#startFilmPlay'),status=layer.querySelector('#startFilmStatus');
 let phase='idle',played=false,done=null,previousFocus=null,statusKey='',attempt=0,pending=false,resumeOnVisible=false;
 const t=key=>window.BRAX_I18N.t('common.film.'+key);
 function render(){
  layer.setAttribute('aria-label',t('introLabel'));skip.setAttribute('aria-label',t('skip'));retry.setAttribute('aria-label',t('play'));
  layer.querySelector('#startFilmSkipLabel').textContent=t('skip');layer.querySelector('#startFilmPlayLabel').textContent=t('play');status.textContent=statusKey?t(statusKey):'';status.hidden=!statusKey;
 }
 function message(key){statusKey=key;render();}
 function failed(key){if(phase!=='film')return;attempt++;resumeOnVisible=false;retry.disabled=pending;retry.hidden=false;layer.setAttribute('aria-busy','false');message(key);}
 async function playVideo(){
  if(phase!=='film'||pending)return;
  if(document.hidden){resumeOnVisible=true;return;}
  const request=++attempt;pending=true;resumeOnVisible=false;retry.disabled=true;retry.hidden=true;layer.setAttribute('aria-busy','true');message('loading');
  video.muted=!!document.getElementById('titleAudio')?.muted;
  if(video.error)video.load();
  try{
   await window.BRAX_PLAY_VIDEO(video,()=>phase==='film'&&request===attempt&&!document.hidden);
   if(phase!=='film'||request!==attempt)return;
   if(document.hidden){resumeOnVisible=true;video.pause();return;}
   if(!video.paused){layer.setAttribute('aria-busy','false');message('');}
  }catch(error){
   if(phase!=='film'||request!==attempt)return;
   if(document.hidden){resumeOnVisible=true;return;}
   failed(error.name==='NotAllowedError'?'retry':'error');
  }finally{
   pending=false;retry.disabled=false;
   if(phase==='film'&&resumeOnVisible&&!document.hidden)playVideo();
  }
 }
 function finish(){
  if(phase!=='film')return;
  phase='leaving';played=true;attempt++;resumeOnVisible=false;video.pause();
  // Cover the outgoing frame with solid black before the account view changes.
  layer.classList.remove('start-film-has-frame');retry.hidden=true;skip.hidden=true;message('');layer.setAttribute('aria-busy','false');
  const next=done;done=null;
  const reveal=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(phase!=='leaving')return;
   const duration=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:240;
   layer.classList.add('start-film-leaving');
   setTimeout(()=>{
    layer.hidden=true;layer.classList.remove('start-film-leaving');phase='idle';
    window.dispatchEvent(new CustomEvent('brax:start-film-ended'));
    if(layer.contains(document.activeElement)){
     const target=previousFocus?.isConnected&&previousFocus.getClientRects().length&&!previousFocus.disabled?previousFocus:document.getElementById('modePlay');
     if(target?.getClientRects().length)target.focus({preventScroll:true});else document.activeElement?.blur();
    }
   },duration);
  }));
  try{Promise.resolve(next?.()).then(reveal,error=>{reveal();setTimeout(()=>{throw error;},0);});}
  catch(error){reveal();setTimeout(()=>{throw error;},0);}
 }
 window.BRAX_START_FILM={
  get active(){return phase!=='idle';},get played(){return played;},
  play(next){
   if(phase!=='idle')return false;
   phase='film';done=typeof next==='function'?next:null;previousFocus=document.activeElement;
   layer.classList.remove('start-film-has-frame','start-film-leaving');skip.hidden=false;retry.hidden=true;retry.disabled=false;
   // This is deliberately synchronous: no login or arena art can show through while media loads.
   layer.hidden=false;message('loading');layer.setAttribute('aria-busy','true');skip.focus({preventScroll:true});
   for(const id of ['titleAudio','crowdAudio','startAudio','arenaAudio'])document.getElementById(id)?.pause();
   if(!video.getAttribute('src'))video.setAttribute('src','/assets/start-intro-20261007.mp4');
   else video.currentTime=0;
   playVideo();return true;
  }
 };
 video.addEventListener('playing',()=>{
  if(phase!=='film')return;
  if(document.hidden){resumeOnVisible=true;video.pause();return;}
  layer.classList.add('start-film-has-frame');retry.hidden=true;layer.setAttribute('aria-busy','false');message('');
 });
 video.addEventListener('waiting',()=>{if(phase==='film'){layer.setAttribute('aria-busy','true');message('loading');}});
 video.addEventListener('error',()=>failed('error'));
 video.addEventListener('ended',finish);skip.addEventListener('click',finish);retry.addEventListener('click',playVideo);
 document.addEventListener('visibilitychange',()=>{
  if(phase!=='film')return;
  if(document.hidden){resumeOnVisible=resumeOnVisible||pending||!video.paused;attempt++;video.pause();}
  else if(resumeOnVisible)playVideo();
 });
 window.addEventListener('pagehide',()=>{if(phase==='film'){resumeOnVisible=pending||!video.paused;attempt++;video.pause();}});
 window.addEventListener('pageshow',()=>{if(phase==='film'&&!document.hidden&&resumeOnVisible)playVideo();});
 document.addEventListener('keydown',event=>{
  if(phase==='idle')return;
  // Keep the account dialog's focus trap and the game's controls below this modal inactive.
  event.stopImmediatePropagation();
  if(event.key==='Escape'){event.preventDefault();finish();return;}
  if(event.key!=='Tab')return;
  event.preventDefault();const buttons=[skip,retry].filter(button=>!button.hidden&&!button.disabled);
  if(!buttons.length){layer.focus({preventScroll:true});return;}
  const current=buttons.indexOf(document.activeElement),step=event.shiftKey?-1:1;
  buttons[current<0?(event.shiftKey?buttons.length-1:0):(current+step+buttons.length)%buttons.length].focus({preventScroll:true});
 },true);
 window.addEventListener('brax:language',render);render();
})();
