/* Campaign finales: one film per completed winning run; nothing fetched at startup. */
(()=>{
'use strict';
const displayFighterName=id=>window.BRAX_FIGHTER_NAME?.(id)??String(id??'');
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY'],seen=new WeakSet();
const overlay=document.getElementById('victoryCinema'),video=document.getElementById('victoryVideo'),play=document.getElementById('victoryPlay'),skip=document.getElementById('victorySkip');
let active=false,generation=0,previousFocus=null,onlineMusic=null;
function close(){if(!active)return;active=false;generation++;video.pause();video.removeAttribute('src');video.load();if(onlineMusic){onlineMusic.element.volume=onlineMusic.volume;onlineMusic=null;}overlay.classList.remove('online');overlay.classList.add('off');play.classList.add('off');previousFocus?.focus?.();}
async function start(){const token=generation;play.classList.add('off');try{await video.play();}catch{if(active&&token===generation)play.classList.remove('off');}}
function show(run,muted=false){if(!run||!run.finished||run.champion!==run.player||!names.includes(run.champion)||!['arcade','tournament','online_tournament'].includes(run.mode)||seen.has(run))return false;
seen.add(run);close();active=true;generation++;previousFocus=document.activeElement;
document.getElementById('victoryTitle').textContent=(run.mode==='arcade'?'MISTRZ ARCADE · ':'MISTRZ TURNIEJU · ')+(run.mode==='online_tournament'&&run.playerName?run.playerName+' · ':'')+displayFighterName(run.champion);
if(run.mode==='online_tournament'){overlay.classList.add('online');const music=document.getElementById('titleAudio');if(music&&typeof music.volume==='number'){onlineMusic={element:music,volume:music.volume};music.volume=0;}}
video.muted=muted;video.src='/assets/victory/'+run.champion.toLowerCase()+'.mp4';overlay.classList.remove('off');skip.focus();start();return true;}
video.addEventListener('ended',close);video.addEventListener('error',close);skip.addEventListener('click',close);play.addEventListener('click',start);
overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){e.preventDefault();(document.activeElement===skip&&!play.classList.contains('off')?play:skip).focus();}});
window.BRAX_VICTORY={show,close};
})();
