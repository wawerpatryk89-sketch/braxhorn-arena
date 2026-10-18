(()=>{
 'use strict';
 const $=s=>document.querySelector(s),layer=$('#startFilm'),video=$('#startVideo'),retry=$('#startFilmPlay'),status=$('#startFilmStatus'),notice=$('#copyrightNotice'),noticeImage=$('#copyrightImage');
 const fade=$('#sceneFade');let busy=false;const changes=[];
 function transition(change){changes.push(change);if(busy)return;nextTransition()}
 function nextTransition(){const change=changes.shift();if(!change)return;busy=true;const duration=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:240;fade.classList.add('busy');fade.classList.add('dark');setTimeout(()=>{Promise.resolve().then(change).finally(()=>{requestAnimationFrame(()=>requestAnimationFrame(()=>{fade.classList.remove('dark');setTimeout(()=>{busy=false;fade.classList.remove('busy');nextTransition()},duration)}))})},duration)}
 function videoReady(video){return new Promise(resolve=>{if(video.readyState>=2){resolve();return}let timer;const done=()=>{clearTimeout(timer);video.removeEventListener('loadeddata',done);video.removeEventListener('error',done);resolve()};video.addEventListener('loadeddata',done,{once:true});video.addEventListener('error',done,{once:true});timer=setTimeout(done,2500)})}
 window.BRAX_TRANSITION={run:transition,videoReady};
 let phase='idle',done=null,timer=null,remaining=4000,started=0,noticeReady=false;
 function playVideo(){if(phase!=='film')return;video.muted=$('#titleAudio').muted;status.textContent='';if(video.error)video.load();window.BRAX_PLAY_VIDEO(video,()=>phase==='film').then(()=>retry.classList.add('off')).catch(()=>{if(phase==='film'){layer.classList.remove('off');retry.classList.remove('off');status.textContent='Dotknij odtwarzania lub pomiń film.'}})}
 function complete(){if(phase!=='notice')return;clearTimeout(timer);timer=null;phase='leaving';window.BRAX_TRANSITION.run(()=>{notice.classList.add('off');const next=done;done=null;phase='idle';next?.()})}
 function resumeNotice(){if(phase!=='notice'||!noticeReady||document.hidden||timer!==null)return;started=performance.now();timer=setTimeout(complete,remaining)}
 function pauseNotice(){if(timer===null)return;clearTimeout(timer);timer=null;remaining=Math.max(0,remaining-(performance.now()-started))}
 function finishFilm(){if(phase!=='film')return;phase='leavingFilm';video.pause();window.BRAX_TRANSITION.run(()=>{phase='notice';layer.classList.add('off');retry.classList.add('off');remaining=4000;noticeReady=false;notice.classList.remove('off');Promise.resolve(noticeImage.decode?.()).catch(()=>{}).then(()=>{noticeReady=true;resumeNotice()})})}
 window.BRAX_START_FILM={get active(){return phase!=='idle'},play(next){if(phase!=='idle')return;done=next;phase='film';$('#titleAudio').pause();$('#crowdAudio').pause();$('#startAudio').pause();retry.classList.add('off');video.src='/assets/start-intro-20261007.mp4';video.currentTime=0;playVideo()}};
 video.addEventListener('playing',()=>{if(phase==='film'&&layer.classList.contains('off'))window.BRAX_TRANSITION.run(()=>layer.classList.remove('off'))});
 video.addEventListener('ended',finishFilm);$('#startFilmSkip').addEventListener('click',finishFilm);retry.addEventListener('click',playVideo);
 video.addEventListener('error',()=>{if(phase==='film'){layer.classList.remove('off');status.textContent='Nie udało się wczytać filmu. Spróbuj ponownie lub pomiń.';retry.classList.remove('off')}});
 document.addEventListener('visibilitychange',()=>{if(phase==='notice'){if(document.hidden)pauseNotice();else resumeNotice();return}if(phase!=='film')return;if(document.hidden)video.pause();else playVideo()});
 $('#menuSound').addEventListener('click',()=>queueMicrotask(()=>{video.muted=$('#titleAudio').muted}));
})();
