/* Fighter selection: premium touch carousel. Swipe sideways or tap a side card to change the fighter
   for the active role (YOU / OPPONENT). The centre card is always the chosen fighter. The original
   roster cards stay in the page (hidden) as the single source of names, art and stats. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const board=$('rosterBoard'),track=$('rosterTrack');if(!board||!track||!window.BRAX_ROSTER)return;
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
const label=n=>window.BRAX_FIGHTER_NAME?.(n)||n;
const source=n=>$('card-'+n.toLowerCase());
const art=n=>`<img src="/assets/portraits/${n.toLowerCase()}.webp" alt="" draggable="false">`;
const style=n=>source(n).querySelector('.fighter-card-style')?.textContent||'';
const wrap=document.createElement('div');wrap.id='rosterCarousel';wrap.setAttribute('role','group');wrap.setAttribute('aria-label','Zawodnicy — przesuń palcem w bok');
wrap.innerHTML=names.map((n,i)=>`<button type="button" class="rc-card" data-index="${i}" aria-label="${label(n)}, ${style(n)}"><div class="rc-art">${art(n)}</div><span class="rc-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div class="rc-label"><small class="rc-eyebrow"></small><strong>${label(n)}</strong><small class="rc-style">${style(n)}</small></div></button>`).join('');
track.after(wrap);
const footer=board.querySelector('.roster-footer'),count=document.createElement('span');count.id='rosterCount';count.setAttribute('aria-live','polite');footer?.append(count);
const cards=[...wrap.children];
function paint(){const s=window.BRAX_ROSTER.state(),auto=['arcade','tournament','survival'].includes(s.mode),current=s[s.role];
 wrap.dataset.role=s.role;
 cards.forEach((c,i)=>{let d=i-current;if(d>4)d-=8;if(d<-4)d+=8;c.style.setProperty('--offset',d);c.classList.toggle('rc-focused',d===0);c.classList.toggle('rc-neighbor',Math.abs(d)===1);c.setAttribute('aria-pressed',String(d===0));
  const eyebrow=c.querySelector('.rc-eyebrow');eyebrow.textContent=s.role==='player'?'TWÓJ ZAWODNIK':'PRZECIWNIK';
  const mine=s.role==='opponent'&&i===s.player,theirs=!auto&&s.role==='player'&&i===s.opponent;c.classList.toggle('rc-also-player',mine);c.classList.toggle('rc-also-opponent',theirs);c.querySelector('.rc-number').textContent=d!==0&&mine?'TY':d!==0&&theirs?'CPU':String(i+1).padStart(2,'0');});
 count.textContent=String(current+1).padStart(2,'0')+' / '+String(names.length).padStart(2,'0');}
function go(index){const s=window.BRAX_ROSTER.state();index=(index+names.length)%names.length;if(index===s[s.role])return;window.BRAX_ROSTER.choose(index);paint();}
const step=d=>{const s=window.BRAX_ROSTER.state();go(s[s.role]+d);};
let drag=null,swiped=0;
wrap.addEventListener('pointerdown',e=>{if(e.isPrimary===false)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};});
wrap.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(e.clientY-drag.y)){step(dx<0?1:-1);swiped=performance.now();drag=null;}});
for(const t of ['pointerup','pointercancel','pointerleave'])wrap.addEventListener(t,()=>{drag=null;});
wrap.addEventListener('click',e=>{const c=e.target.closest('.rc-card');if(!c||performance.now()-swiped<350)return;const i=+c.dataset.index,s=window.BRAX_ROSTER.state();if(i!==s[s.role])go(i);});
for(const id of ['rosterPlayer','rosterOpponent'])$(id)?.addEventListener('click',()=>requestAnimationFrame(paint));
new MutationObserver(()=>requestAnimationFrame(paint)).observe(board,{subtree:true,attributes:true,attributeFilter:['aria-pressed','disabled']});
new MutationObserver(()=>{if(!$('selection').classList.contains('off'))requestAnimationFrame(paint);}).observe($('selection'),{attributes:true,attributeFilter:['class']});
paint();
})();
