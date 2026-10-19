/* A touch-first roster. Browsing never confirms a fighter or changes the active role. */
(()=>{
'use strict';
const t=(key,params)=>window.BRAX_I18N.t('content.'+key,params),h=(key,params)=>window.BRAX_I18N.h('content.'+key,params);
const $=id=>document.getElementById(id),roster=window.BRAX_ROSTER;
const board=$('rosterBoard'),original=$('rosterTrack');
if(!board||!original||!roster)return;
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
const label=n=>window.BRAX_FIGHTER_NAME?.(n)||n;
const root=document.createElement('div');root.id='rosterCarousel';
root.setAttribute('role','group');root.setAttribute('aria-roledescription',t('roster.carousel'));
root.setAttribute('aria-label',t('roster.browseLabel'));
const cards=names.map((name,index)=>{
 const source=$('card-'+name.toLowerCase()),card=document.createElement('button');
 card.type='button';card.className='rc-card';card.dataset.index=String(index);
 const image=document.createElement('span');image.className='rc-art';image.innerHTML=roster.portrait(name);
 const number=document.createElement('span');number.className='rc-number';number.textContent=String(index+1).padStart(2,'0');number.setAttribute('aria-hidden','true');
 const copy=document.createElement('span');copy.className='rc-copy';
 const eyebrow=document.createElement('small');eyebrow.className='rc-eyebrow';
 const title=document.createElement('strong');title.textContent=label(name);
 const style=source.querySelector('.fighter-card-style')?.cloneNode(true)||document.createElement('small');
 copy.append(eyebrow,title,style);
 const stats=document.createElement('span');stats.className='rc-stats';
 const metrics=source.querySelector('.fighter-stats')?.cloneNode(true);
 if(metrics){[...metrics.children].slice(3).forEach(row=>row.remove());const power=metrics.children[0].querySelector('span');power.dataset.i18n='content.roster.power';power.textContent=t('roster.power');stats.append(metrics);}
 card.append(image,number,copy,stats);card.insertAdjacentHTML('beforeend',roster.frame());root.append(card);
 return card;
});
original.after(root);
roster.layoutCarousel(root);
original.setAttribute('aria-hidden','true');
for(const card of original.querySelectorAll('button'))card.tabIndex=-1;
const footer=board.querySelector('.roster-footer'),count=document.createElement('span');
count.id='rosterCount';count.setAttribute('aria-live','polite');count.setAttribute('aria-atomic','true');footer.append(count);
const dots=document.createElement('span');dots.className='carousel-dots';dots.setAttribute('aria-hidden','true');dots.innerHTML='<i></i>'.repeat(names.length);footer.append(dots);
let confirming=false;
const automatic=s=>['arcade','tournament','survival'].includes(s.mode);
function paint(){
 const state=roster.state(),current=state[state.role];
 root.dataset.role=state.role;root.setAttribute('aria-roledescription',t('roster.carousel'));root.setAttribute('aria-label',t('roster.browseLabel'));
 cards.forEach((card,index)=>{
  let offset=(index-current+names.length)%names.length;if(offset>names.length/2)offset-=names.length;
  const active=offset===0,near=Math.abs(offset)<=1;
  card.style.setProperty('--offset',offset);card.classList.toggle('rc-focused',active);card.classList.toggle('rc-neighbor',Math.abs(offset)===1);
  card.classList.toggle('rc-edge',Math.abs(offset)===2);
  card.setAttribute('aria-hidden',String(!near));card.setAttribute('aria-pressed',String(active));card.tabIndex=near?0:-1;
  card.setAttribute('aria-label',t('roster.cardLabel',{name:label(names[index]),stats:card.querySelector('.rc-stats').textContent}));
  card.querySelector('.rc-eyebrow').textContent=active?t(state.role==='player'?'roster.yourFighter':'roster.yourOpponent'):index===state.player?t('roster.you'):!automatic(state)&&index===state.opponent?t('roster.rival'):'';
 });
 count.textContent=String(current+1).padStart(2,'0')+' / '+String(names.length).padStart(2,'0');
 [...dots.children].forEach((dot,index)=>dot.classList.toggle('is-current',index===current));
 $('rosterInstruction').textContent=t(state.role==='player'?'roster.swipePlayer':'roster.swipeOpponent');
 $('rosterPlayer').textContent=t('roster.playerNumbered',{name:label(names[state.player])});
 $('rosterOpponent').textContent=t('roster.opponentNumbered',{name:label(names[state.opponent])});
 $('rosterOpponent').hidden=automatic(state);
 $('chooseFighter').textContent=state.role==='player'&&!automatic(state)?t('roster.chooseAction',{name:label(names[current])}):t('roster.next');
 $('chooseFighter').setAttribute('aria-label',state.role==='player'&&!automatic(state)?t('roster.chooseThenOpponent',{name:label(names[current])}):t('roster.confirm'));
}
function step(direction){const state=roster.state();roster.choose((state[state.role]+direction+names.length)%names.length);}
roster.dragCarousel(root,cards,step,()=>confirming);
root.addEventListener('click',event=>{
 const card=event.target.closest('.rc-card');if(!card||confirming)return;
 const index=Number(card.dataset.index),state=roster.state();
 const browsing=card.classList.contains('rc-edge');
 roster.choose(index);
 if(browsing)return;
 if(state.role==='player'&&!automatic(state)){roster.setRole('opponent');return;}
 confirming=true;root.setAttribute('aria-busy','true');$('rosterInstruction').textContent=t('roster.loading');
 // Preserve capture listeners used by challenge eligibility and both menu engines.
 const button=$('chooseFighter'),allowed=button.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
 if(!allowed||!button.disabled){confirming=false;root.setAttribute('aria-busy','false');}
});
root.addEventListener('keydown',event=>{
 if(confirming||!['ArrowLeft','ArrowRight'].includes(event.key))return;
 event.preventDefault();event.stopPropagation();step(event.key==='ArrowRight'?1:-1);cards[roster.state()[roster.state().role]].focus({preventScroll:true});
});
$('chooseFighter').addEventListener('click',event=>{
 const state=roster.state();if(state.role!=='player'||automatic(state))return;
 event.preventDefault();event.stopImmediatePropagation();roster.setRole('opponent');
},true);
new MutationObserver(()=>{if(!$('chooseFighter').disabled)confirming=false;root.setAttribute('aria-busy',String(confirming));if(confirming)$('rosterInstruction').textContent=t('roster.loading');else if($('chooseFighter').dataset.loadState==='retry')$('rosterInstruction').textContent=t('roster.loadFailure');else paint();}).observe($('chooseFighter'),{attributes:true,attributeFilter:['disabled']});
window.addEventListener('brax:roster-change',paint);
window.addEventListener('brax:language',()=>{paint();if(confirming)$('rosterInstruction').textContent=t('roster.loading');else if($('chooseFighter').dataset.loadState==='retry')$('rosterInstruction').textContent=t('roster.loadFailure');});
new MutationObserver(()=>{if(!$('selection').classList.contains('off'))paint();}).observe($('selection'),{attributes:true,attributeFilter:['class']});
paint();
})();
