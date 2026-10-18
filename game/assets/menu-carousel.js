/* Focus one mode at a time; launch through each mode's existing handler. */
(()=>{'use strict';
const $=id=>document.getElementById(id),root=$('matchSetup'),track=root.querySelector('.mode-card-row');
const cards=[...track.querySelectorAll('.mode-hit')];let index=0,launch=false,gesture=null,ignoreUntil=0;
const nav=document.createElement('div');nav.className='mode-carousel-nav';nav.innerHTML='<button id="modePrevious" aria-label="Poprzedni tryb">‹</button><span id="modePosition" aria-live="polite"></span><button id="modeFollowing" aria-label="Następny tryb">›</button>';
root.appendChild(nav);const play=document.createElement('button');play.id='modePlay';play.textContent='GRAJ →';root.appendChild(play);
track.setAttribute('aria-label','Tryby gry — przesuń w lewo lub w prawo');
function select(next){index=(next+cards.length)%cards.length;cards.forEach((card,i)=>{let delta=(i-index+cards.length)%cards.length;if(delta>cards.length/2)delta-=cards.length;card.style.setProperty('--offset',delta);card.classList.toggle('mode-focused',delta===0);card.classList.toggle('mode-neighbor',Math.abs(delta)===1);card.setAttribute('aria-hidden',String(Math.abs(delta)>1));card.tabIndex=Math.abs(delta)<=1?0:-1;});$('modePosition').textContent=String(index+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');play.setAttribute('aria-label','Otwórz: '+cards[index].getAttribute('aria-label'));$('openModeSettings').hidden=index>3;}
track.addEventListener('click',e=>{if(launch)return;const card=e.target.closest('.mode-hit');if(!card)return;e.preventDefault();e.stopImmediatePropagation();if(performance.now()<ignoreUntil)return;const next=cards.indexOf(card);if(next===index)play.click();else select(next);},true);
play.onclick=()=>{launch=true;try{cards[index].click();}finally{launch=false;}};
$('modePrevious').onclick=()=>select(index-1);$('modeFollowing').onclick=()=>select(index+1);
// Settings follows the focused mode, not the mode last launched.
$('openModeSettings').addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();play.click();},true);
track.addEventListener('pointerdown',e=>{gesture={x:e.clientX,y:e.clientY};});
track.addEventListener('pointerup',e=>{if(!gesture)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture=null;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)){ignoreUntil=performance.now()+400;select(index+(dx<0?1:-1));}});
track.addEventListener('pointercancel',()=>gesture=null);track.addEventListener('dragstart',e=>e.preventDefault());
root.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key)||!$('modeSettings').classList.contains('off'))return;e.preventDefault();select(index+(e.key==='ArrowRight'?1:-1));cards[index].focus();});select(0);
})();
