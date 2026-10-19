/* A touch-first roster. Browsing never confirms a fighter or changes the active role. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),roster=window.BRAX_ROSTER;
const board=$('rosterBoard'),original=$('rosterTrack');
if(!board||!original||!roster)return;
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
const label=n=>window.BRAX_FIGHTER_NAME?.(n)||n;
const root=document.createElement('div');root.id='rosterCarousel';
root.setAttribute('role','group');root.setAttribute('aria-roledescription','karuzela');
root.setAttribute('aria-label','Zawodnicy. Przesuń w bok, dotknij wybranej karty, aby zobaczyć statystyki.');
const cards=names.map((name,index)=>{
 const source=$('card-'+name.toLowerCase()),card=document.createElement('button');
 card.type='button';card.className='rc-card';card.dataset.index=String(index);
 const image=document.createElement('img');image.src='/assets/campaign-portraits/'+name.toLowerCase()+'.webp';image.alt='';image.draggable=false;image.decoding='async';
 const number=document.createElement('span');number.className='rc-number';number.textContent=String(index+1).padStart(2,'0');number.setAttribute('aria-hidden','true');
 const copy=document.createElement('span');copy.className='rc-copy';
 const eyebrow=document.createElement('small');eyebrow.className='rc-eyebrow';
 const title=document.createElement('strong');title.textContent=label(name);
 const style=document.createElement('small');style.textContent=source.querySelector('.fighter-card-style')?.textContent||'';
 copy.append(eyebrow,title,style);
 const stats=document.createElement('span');stats.className='rc-stats';
 const statsTitle=document.createElement('strong');statsTitle.textContent=label(name);
 const metrics=source.querySelector('.fighter-stats')?.cloneNode(true);
 stats.append(statsTitle);if(metrics)stats.append(metrics);
 card.append(image,number,copy,stats);root.append(card);
 return card;
});
original.after(root);
original.setAttribute('aria-hidden','true');
for(const card of original.querySelectorAll('button'))card.tabIndex=-1;
const footer=board.querySelector('.roster-footer'),count=document.createElement('span');
count.id='rosterCount';count.setAttribute('aria-live','polite');count.setAttribute('aria-atomic','true');footer.append(count);
let signature='',detail=false,gesture=null,ignoreClickUntil=0;
const automatic=s=>['arcade','tournament','survival'].includes(s.mode);
function paint(){
 const state=roster.state(),current=state[state.role],nextSignature=[state.player,state.opponent,state.role,state.mode].join(':');
 if(signature!==nextSignature){detail=false;signature=nextSignature;}
 root.dataset.role=state.role;root.classList.toggle('rc-detail',detail);
 cards.forEach((card,index)=>{
  let offset=(index-current+names.length)%names.length;if(offset>names.length/2)offset-=names.length;
  const active=offset===0,near=Math.abs(offset)<=1;
  card.style.setProperty('--offset',offset);card.classList.toggle('rc-focused',active);card.classList.toggle('rc-neighbor',Math.abs(offset)===1);
  card.setAttribute('aria-hidden',String(!near));card.setAttribute('aria-pressed',String(active));card.tabIndex=near?0:-1;
  card.setAttribute('aria-label',label(names[index])+(active?', dotknij, aby '+(detail?'wrócić do portretu':'zobaczyć statystyki'):', dotknij, aby wybrać'));
  card.querySelector('.rc-eyebrow').textContent=active?(state.role==='player'?'TWOJA POSTAĆ':'TWÓJ RYWAL'):index===state.player?'TY':!automatic(state)&&index===state.opponent?'RYWAL':'';
 });
 count.textContent=String(current+1).padStart(2,'0')+' / '+String(names.length).padStart(2,'0');
 $('rosterInstruction').textContent=detail?'Dotknij karty · wróć do portretu':'Przesuń · zmień postać  /  Dotknij · statystyki';
 $('rosterPlayer').textContent='01  TY · '+label(names[state.player]);
 $('rosterOpponent').textContent='02  RYWAL · '+label(names[state.opponent]);
 $('rosterOpponent').hidden=automatic(state);
 $('chooseFighter').textContent=state.role==='player'&&!automatic(state)?'WYBIERZ '+label(names[current])+' →':'DALEJ →';
 $('chooseFighter').setAttribute('aria-label',state.role==='player'&&!automatic(state)?'Wybierz '+label(names[current])+' i przejdź do wyboru rywala':'Zatwierdź wybór zawodników');
}
function step(direction){const state=roster.state();roster.choose((state[state.role]+direction+names.length)%names.length);}
root.addEventListener('dragstart',event=>event.preventDefault());
root.addEventListener('pointerdown',event=>{if(event.isPrimary===false||event.button>0)return;gesture={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};});
root.addEventListener('pointermove',event=>{
 if(!gesture||event.pointerId!==gesture.id)return;
 const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
 if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)){gesture.moved=true;root.setPointerCapture?.(event.pointerId);}
});
root.addEventListener('pointerup',event=>{
 if(!gesture||event.pointerId!==gesture.id)return;
 const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y,moved=gesture.moved;gesture=null;
 if(moved){ignoreClickUntil=performance.now()+400;if(Math.abs(dx)>32&&Math.abs(dx)>Math.abs(dy))step(dx<0?1:-1);}
});
root.addEventListener('pointercancel',()=>{gesture=null;});
// Touch starts with implicit capture on the card. Its transfer to the carousel
// bubbles a lostpointercapture event; that event must not cancel the swipe.
root.addEventListener('lostpointercapture',event=>{if(event.target===root)gesture=null;});
root.addEventListener('click',event=>{
 const card=event.target.closest('.rc-card');if(!card||performance.now()<ignoreClickUntil)return;
 const index=Number(card.dataset.index),state=roster.state();
 if(index!==state[state.role])roster.choose(index);else{detail=!detail;paint();}
});
root.addEventListener('keydown',event=>{
 if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
 event.preventDefault();event.stopPropagation();step(event.key==='ArrowRight'?1:-1);cards[roster.state()[roster.state().role]].focus({preventScroll:true});
});
$('chooseFighter').addEventListener('click',event=>{
 const state=roster.state();if(state.role!=='player'||automatic(state))return;
 event.preventDefault();event.stopImmediatePropagation();roster.setRole('opponent');
},true);
window.addEventListener('brax:roster-change',paint);
new MutationObserver(()=>{if(!$('selection').classList.contains('off'))paint();}).observe($('selection'),{attributes:true,attributeFilter:['class']});
paint();
})();
