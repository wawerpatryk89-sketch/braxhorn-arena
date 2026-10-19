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
  const card=Math.min(width/3.35,(height-8)*.76),step=card*1.16;
  root.style.setProperty('--carousel-card-width',card+'px');
  root.style.setProperty('--carousel-step',step+'px');
  root.style.setProperty('--carousel-edge-inset','0px');
 };
 new ResizeObserver(fit).observe(root);fit();
}
// Both rosters follow the finger, rotating whole slots during long drags.
// The final partial slot snaps into place without treating release as a card tap.
function dragCarousel(root,cards,advance,blocked=()=>false){
 let gesture=null,ignoreUntil=0;
 const spacing=()=>parseFloat(getComputedStyle(root).getPropertyValue('--carousel-step'))||root.clientWidth/4;
 function draw(dx,step){
  root.style.setProperty('--carousel-drag',dx+'px');
  for(const card of cards){
   const distance=Math.abs(Number(card.style.getPropertyValue('--offset'))+dx/step);
   const opacity=distance<=1?1-distance*.12:Math.max(0,.88*(2-distance));
   card.style.setProperty('--carousel-opacity',opacity);
   card.style.setProperty('--carousel-scale',Math.max(.83,1-distance*.17));
  }
 }
 root.addEventListener('dragstart',event=>event.preventDefault());
 root.addEventListener('pointerdown',event=>{
  if(blocked()||event.isPrimary===false||event.button>0)return;
  ignoreUntil=0;gesture={id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,moved:false};
 });
 root.addEventListener('pointermove',event=>{
  if(!gesture||gesture.id!==event.pointerId)return;
  let dx=event.clientX-gesture.x;const dy=event.clientY-gesture.y,step=spacing();
  if(!gesture.moved){
   if(Math.abs(dx)<8||Math.abs(dx)<=Math.abs(dy))return;
   gesture.moved=true;root.classList.add('is-dragging');root.setPointerCapture?.(event.pointerId);
  }
  ignoreUntil=performance.now()+400;
  while(Math.abs(dx)>=step){const direction=dx<0?1:-1;advance(direction);gesture.x-=direction*step;dx+=direction*step;}
  gesture.dx=dx;draw(dx,step);
 });
 function finish(event,cancel=false){
  if(!gesture||gesture.id!==event.pointerId)return;
  const last=gesture;gesture=null;if(!last.moved)return;
  const step=spacing();let dx=cancel?last.dx:event.clientX-last.x;
  if(!cancel&&Math.abs(dx)>Math.min(35,step*.22)){const direction=dx<0?1:-1;advance(direction);dx+=direction*step;}
  draw(dx,step);ignoreUntil=performance.now()+400;
  // Commit the finger position before enabling the snap transition.
  void root.offsetWidth;root.classList.remove('is-dragging');root.style.setProperty('--carousel-drag','0px');
 }
 root.addEventListener('pointerup',event=>finish(event));
 root.addEventListener('pointercancel',event=>finish(event,true));
 // Ignore the bubbled loss of the card's implicit capture when the root takes it.
 root.addEventListener('lostpointercapture',event=>{if(event.target===root)finish(event,true);});
 root.addEventListener('click',event=>{if(performance.now()<ignoreUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
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
window.BRAX_ROSTER={portrait,frame,layoutCarousel,dragCarousel,setMode(mode){state.mode=mode;state.role='player';paint();notify();},setRole(role){if(!['player','opponent'].includes(role)||automatic()&&role==='opponent')return;state.role=role;paint();cue();notify();},choose(index){if(!Number.isInteger(index)||index<0||index>=names.length)return;state[state.role]=index;if(state.role==='player')selectPlayer(index);paint();cue();notify();},bind(fn){selectPlayer=fn;paint();notify();},sync(index){state.player=index;paint();notify();},get opponent(){return names[state.opponent];},state:()=>({...state})};
for(const id of ['rosterPlayer','rosterOpponent'])$('#'+id).addEventListener('click',notify);
paint();
})();
