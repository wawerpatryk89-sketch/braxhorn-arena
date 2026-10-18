/* Character selection: independent player/opponent choices and a draggable roster. */
(()=>{
'use strict';
const displayFighterName=id=>window.BRAX_FIGHTER_NAME?.(id)??String(id??'');
const $=s=>document.querySelector(s),state={player:0,opponent:1,role:'player',mode:'fight'};let selectPlayer=()=>{};
const label=n=>displayFighterName(n);
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
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
window.BRAX_ROSTER={setMode(mode){state.mode=mode;state.role='player';paint();},bind(fn){selectPlayer=fn;paint();},sync(index){state.player=index;paint();},get opponent(){return names[state.opponent];},state:()=>({...state})};paint();
})();
