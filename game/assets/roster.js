/* Character selection: independent player/opponent choices and a draggable roster. */
(()=>{
'use strict';
const displayFighterName=id=>window.BRAX_FIGHTER_NAME?.(id)??String(id??'');
const $=s=>document.querySelector(s),state={player:0,opponent:1,role:'player',mode:'fight'};let selectPlayer=()=>{};
const label=n=>displayFighterName(n);
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
// Unframed arena illustrations share one live frame in every selection screen.
const portraits={
 BRAX:['/assets/roster-art-a-151.webp','0 0 512 768'],
 NYXA:['/assets/roster-art-a-151.webp','512 0 512 768'],
 VEXA:['/assets/roster-art-a-151.webp','0 768 512 768'],
 KROV:['/assets/roster-art-a-151.webp','512 768 512 768'],
 NINA:['/assets/roster-art-b-151.webp','0 0 512 768'],
 DANNY:['/assets/roster-art-b-151.webp','512 0 512 768'],
 BEAR:['/assets/roster-art-b-151.webp','0 768 512 768'],
 DEMON:['/assets/roster-art-b-151.webp','512 768 512 768']
};
function portrait(name){const p=portraits[name];return p?'<svg class="fighter-portrait" viewBox="'+p[1]+'" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><image href="'+p[0]+'" width="1024" height="1536"/></svg>':'';}

const frame=()=>'<svg class="fighter-frame" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true"><path class="frame-edge" d="M18 2H282L298 18V382L282 398H18L2 382V18Z"/><path class="frame-inset" d="M22 8H278L292 22V378L278 392H22L8 378V22Z"/><path class="frame-glint" d="M24 3H138M298 28V115M276 397H162M2 372V285"/></svg>';
function layoutCarousel(root){
 const fit=()=>{
  const width=root.clientWidth,height=root.clientHeight;if(!width||!height)return;
  const gap=Math.max(8,Math.min(16,width*.015));
  const card=Math.min((width-4*gap)/4,(height-8)*.82),step=card+gap;
  root.style.setProperty('--carousel-card-width',card+'px');
  root.style.setProperty('--carousel-step',step+'px');
  root.style.setProperty('--carousel-edge-inset',Math.max(0,(width-4*step)/2)+'px');
 };
 new ResizeObserver(fit).observe(root);fit();
}
const track=$('#rosterTrack');let drag=null,suppressClickUntil=0;
// Touch uses the browser's native momentum scrolling. Mouse dragging uses capture
// only after movement, so a normal card tap still reaches its own click handler.
track.addEventListener('dragstart',e=>e.preventDefault());
track.addEventListener('pointerdown',e=>{e.stopPropagation();if(e.isPrimary===false||(e.button!==undefined&&e.button!==0))return;drag={id:e.pointerId,x:e.clientX,left:track.scrollLeft,moved:false,touch:e.pointerType==='touch'};});
track.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x;if(!drag.moved&&Math.abs(dx)<8)return;drag.moved=true;suppressClickUntil=performance.now()+400;if(drag.touch)return;if(!track.hasPointerCapture(e.pointerId)){track.setPointerCapture(e.pointerId);track.style.scrollSnapType='none';}track.scrollLeft=drag.left-dx;e.preventDefault();});
track.addEventListener('scroll',()=>{suppressClickUntil=performance.now()+180;},{passive:true});
function finishDrag(e){e.stopPropagation();if(!drag||drag.id!==e.pointerId)return;if(drag.moved)suppressClickUntil=performance.now()+400;track.style.scrollSnapType='';drag=null;}
track.addEventListener('pointerup',finishDrag);track.addEventListener('pointercancel',finishDrag);track.addEventListener('lostpointercapture',finishDrag);
function cue(confirm=false){const audio=$('#rosterCue');if(!audio||$('#titleAudio').muted)return;audio.src=confirm?'/assets/audio/roster-confirm.mp3':'/assets/audio/roster-select.mp3';audio.volume=confirm?.45:.28;audio.currentTime=0;audio.play()?.catch(()=>{});}
const automatic=()=>['arcade','tournament','survival'].includes(state.mode);
function paint(){for(const [index,key] of ['brax','nyxa','vexa','krov','nina','danny','bear','demon'].entries()){const el=$('#card-'+key),player=state.player===index,cpu=!automatic()&&state.opponent===index;el.setAttribute('aria-pressed',String(state[state.role]===index));el.classList.toggle('roster-player',player);el.classList.toggle('roster-cpu',cpu);$('#card-'+key+'-badge').textContent=player&&cpu?'TY + CPU':player?'TY':cpu?'CPU':String(index+1).padStart(2,'0');}$('#rosterPlayer').setAttribute('aria-pressed',String(state.role==='player'));$('#rosterOpponent').setAttribute('aria-pressed',String(state.role==='opponent'));$('#rosterPlayer').textContent='TY · '+label(names[state.player]);$('#rosterOpponent').disabled=automatic();$('#rosterOpponent').textContent=automatic()?'RYWALE · LOSOWANIE':'PRZECIWNIK · '+label(names[state.opponent]);$('#rosterInstruction').textContent=state.role==='player'?'WYBIERZ SWOJEGO ZAWODNIKA':'WYBIERZ PRZECIWNIKA';}
for(const role of ['player','opponent'])$('#roster'+(role==='player'?'Player':'Opponent')).addEventListener('click',()=>{if(automatic()&&role==='opponent')return;state.role=role;paint();cue();});
for(const [index,key] of ['brax','nyxa','vexa','krov','nina','danny','bear','demon'].entries())$('#card-'+key).addEventListener('click',()=>{if(performance.now()<suppressClickUntil)return;state[state.role]=index;if(state.role==='player'){selectPlayer(index);state.role=automatic()?'player':'opponent';}paint();cue();});
$('#rosterBack').addEventListener('click',()=>$('#backTitle').click());
$('#chooseFighter').addEventListener('click',()=>cue(true));
$('#rosterPrev').addEventListener('click',()=>$('#rosterTrack').scrollBy({left:-$('#rosterTrack').clientWidth*.65,behavior:'smooth'}));
$('#rosterNext').addEventListener('click',()=>$('#rosterTrack').scrollBy({left:$('#rosterTrack').clientWidth*.65,behavior:'smooth'}));
const notify=()=>window.dispatchEvent(new Event('brax:roster-change'));
window.BRAX_ROSTER={portrait,frame,layoutCarousel,setMode(mode){state.mode=mode;state.role='player';paint();notify();},setRole(role){if(!['player','opponent'].includes(role)||automatic()&&role==='opponent')return;state.role=role;paint();cue();notify();},choose(index){if(!Number.isInteger(index)||index<0||index>=names.length)return;state[state.role]=index;if(state.role==='player')selectPlayer(index);paint();cue();notify();},bind(fn){selectPlayer=fn;paint();notify();},sync(index){state.player=index;paint();notify();},get opponent(){return names[state.opponent];},state:()=>({...state})};
for(const id of ['rosterPlayer','rosterOpponent'])$('#'+id).addEventListener('click',notify);
paint();
})();
