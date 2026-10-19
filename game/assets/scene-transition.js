/* Shared scene fade; opening START, nickname, film and notice screens were removed. */
(()=>{'use strict';
 const $=s=>document.querySelector(s);
 const fade=$('#sceneFade');let busy=false;const changes=[];
 function transition(change){changes.push(change);if(busy)return;nextTransition()}
 function nextTransition(){const change=changes.shift();if(!change)return;busy=true;const duration=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:240;fade.classList.add('busy');fade.classList.add('dark');setTimeout(()=>{Promise.resolve().then(change).finally(()=>{requestAnimationFrame(()=>requestAnimationFrame(()=>{fade.classList.remove('dark');setTimeout(()=>{busy=false;fade.classList.remove('busy');nextTransition()},duration)}))})},duration)}
 function videoReady(video){return new Promise(resolve=>{if(video.readyState>=2){resolve();return}let timer;const done=()=>{clearTimeout(timer);video.removeEventListener('loadeddata',done);video.removeEventListener('error',done);resolve()};video.addEventListener('loadeddata',done,{once:true});video.addEventListener('error',done,{once:true});timer=setTimeout(done,2500)})}
 window.BRAX_TRANSITION={run:transition,videoReady};
})();
