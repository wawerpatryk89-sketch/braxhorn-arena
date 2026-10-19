/* Touch arena browser. Only the original #arena-<key> click starts combat. */
(()=>{'use strict';
const I=window.BRAX_I18N,t=(key,params)=>I.t('content.'+key,params);
const $=id=>document.getElementById(id),root=$('arenaSelection'),strip=$('arenaStrip'),confirm=$('arenaConfirm');
if(!root||!strip||!confirm)return;
const cards=[...strip.querySelectorAll('.arena-thumb')],categories=$('arenaCategories'),background=$('arenaBackground');
const storage='braxhorn.arena.v1',HOLD_MS=500;
let sources=window.BRAX_ARENA_VIDEOS||{},selected=cards[0],category='all',launch=false,launchPending=false,active=false;
let hold=null,holdFrame=0,resetFrame=0,progress=0,gesture=null,layer=null,changeTimer=0;
const videos=new Map(),key=card=>card.id.slice(6),visible=()=>cards.filter(card=>!card.hidden);
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const sound=action=>{window.dispatchEvent(new CustomEvent('brax:ui-sound',{detail:{action}}));const audio=$('rosterCue');if(audio&&!$('titleAudio')?.muted){const confirmed=action==='arena-confirm';audio.src='/assets/audio/roster-'+(confirmed?'confirm':'select')+'.mp3';audio.volume=confirmed?.45:.28;audio.currentTime=0;audio.play()?.catch(()=>{});}};
function saved(){try{return localStorage.getItem(storage);}catch{return null;}}
function remember(value){try{localStorage.setItem(storage,value);}catch{}}
function setProgress(value){progress=value;confirm.style.setProperty('--hold',String(value));}
function cancelHold(){hold=null;cancelAnimationFrame(holdFrame);cancelAnimationFrame(resetFrame);confirm.classList.remove('is-holding');const start=performance.now(),from=progress;function reset(now){setProgress(from*(1-Math.min(1,(now-start)/160)));if(progress>0)resetFrame=requestAnimationFrame(reset);}resetFrame=requestAnimationFrame(reset);}
function hint(){confirm.classList.remove('is-hint');void confirm.offsetWidth;confirm.classList.add('is-hint');sound('arena-hint');}
function fitName(){const name=$('arenaHeroName'),width=name.parentElement.clientWidth;if(!width)return;name.style.fontSize='58px';const textWidth=name.scrollWidth;if(textWidth>width)name.style.fontSize=Math.max(22,58*width/textWidth-1)+'px';const row=selected?.querySelector('strong');if(row){selected.style.removeProperty('--arena-row-size');const available=strip.clientWidth-38,actual=row.getBoundingClientRect().width;if(actual>available)selected.style.setProperty('--arena-row-size',Math.max(16,26*available/actual)+'px');}}
function releaseVideo(video){video.pause();video.removeAttribute('src');video.load();video.remove();}
function prune(keep){for(const [id,video]of videos)if(!keep.has(id)){releaseVideo(video);videos.delete(id);}}
function revealScene(scene){
 if(!active||layer!==scene||scene.dataset.ready)return;
 scene.dataset.ready='true';requestAnimationFrame(()=>{if(layer===scene)scene.classList.add('is-visible');});
 clearTimeout(changeTimer);changeTimer=setTimeout(()=>{for(const old of [...background.children])if(old!==layer)old.remove();},300);
}
function syncMedia(){
 if(!active||document.hidden){for(const video of videos.values())video.pause();return;}
 const list=visible(),index=list.indexOf(selected),keep=new Set([key(selected)]);
 if(list.length>1)for(const offset of [-1,1])keep.add(key(list[(index+offset+list.length)%list.length]));
 prune(keep);
 for(const id of keep){const source=sources[id]?.preview;if(!source)continue;let video=videos.get(id);
  if(!video){video=document.createElement('video');video.className='arena-preview';video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');video.preload='auto';video.src=source;videos.set(id,video);}
  if(id===key(selected)){layer?.append(video);const reveal=()=>{if(id===key(selected)&&active&&!document.hidden&&video.parentElement===layer){video.classList.add('is-playing');revealScene(layer);}};
   video.onplaying=reveal;Promise.resolve(video.play()).then(reveal).catch(()=>{});
  }else video.pause();
 }
}
function showBackground(){
 if(!active)return;
 const id=key(selected);if(layer?.dataset.arena===id){syncMedia();return;}
 clearTimeout(changeTimer);const previous=layer,next=document.createElement('div');next.className='arena-scene';next.dataset.arena=id;
 const image=document.createElement('img');image.id='arenaHeroImage';image.alt='';image.draggable=false;
 const posterReady=()=>Promise.resolve(image.decode?.()).catch(()=>{}).then(()=>revealScene(next));image.addEventListener('load',posterReady,{once:true});image.src=sources[id]?.src||selected.querySelector('img')?.src||'';next.append(image);
 previous?.querySelector('img')?.removeAttribute('id');background.append(next);layer=next;
 if(image.complete&&image.naturalWidth)posterReady();
 syncMedia();
}
function select(card,{audible=false,scroll=false}={}){
 if(!card||!cards.includes(card)||launchPending)return;
 if(card!==selected)cancelHold();selected=card;remember(key(card));
 for(const item of cards)item.setAttribute('aria-pressed',String(item===card));
 const data=sources[key(card)]||{};$('arenaHeroName').textContent=card.querySelector('strong').textContent;
 $('arenaHeroDescription').textContent=card.querySelector('small').textContent;
 $('arenaHeroCategory').textContent=t('arena.category.'+(data.category||'arena'));
 confirm.disabled=false;showBackground();fitName();if(scroll)card.scrollIntoView({block:'nearest',behavior:reduced()?'instant':'smooth'});if(audible)sound('arena-select');
}
function filter(next){
 cancelHold();category=next;
 for(const item of categories.querySelectorAll('button'))item.setAttribute('aria-pressed',String(item.dataset.category===category));
 for(const card of cards)card.hidden=category!=='all'&&sources[key(card)]?.category!==category;
 const list=visible();if(selected.hidden&&list.length)select(list[0]);else syncMedia();strip.scrollTop=0;confirm.disabled=!list.length;
}
function advance(direction){const list=visible(),index=list.indexOf(selected);if(list.length)select(list[(index+direction+list.length)%list.length],{audible:true,scroll:true});}
function finishLaunch(){launchPending=false;confirm.disabled=false;setProgress(0);}
async function fight(){
 if(!selected||selected.hidden||launch||launchPending||!active)return;
 launchPending=true;confirm.disabled=true;confirm.classList.remove('is-holding');sound('arena-confirm');let dispatched=false;
 try{if(window.BRAX_UI?.versus)await window.BRAX_UI.versus();if(!root.classList.contains('off')){launch=true;try{selected.click();dispatched=true;}finally{launch=false;}}}
 finally{if(!dispatched)finishLaunch();}
}
function startHold(event){
 if(event.button!==undefined&&event.button!==0||confirm.disabled||!active||hold||launchPending)return;
 event.preventDefault();cancelAnimationFrame(resetFrame);setProgress(0);hold={id:event.pointerId,start:performance.now()};
 if(event.pointerId!==undefined)confirm.setPointerCapture?.(event.pointerId);confirm.classList.add('is-holding');
 function tick(now){if(!hold)return;setProgress(Math.min(1,(now-hold.start)/HOLD_MS));if(progress>=1){hold=null;fight();}else holdFrame=requestAnimationFrame(tick);}holdFrame=requestAnimationFrame(tick);
}
confirm.addEventListener('pointerdown',startHold);
confirm.addEventListener('pointermove',event=>{if(!hold||hold.id!==event.pointerId)return;const rect=confirm.getBoundingClientRect();if(event.clientX<rect.left-12||event.clientX>rect.right+12||event.clientY<rect.top-12||event.clientY>rect.bottom+12)cancelHold();});
for(const type of ['pointerup','pointercancel','lostpointercapture'])confirm.addEventListener(type,event=>{if(hold?.id!==event.pointerId)return;if(type==='pointerup'&&hold&&performance.now()-hold.start>=HOLD_MS){hold=null;cancelAnimationFrame(holdFrame);setProgress(1);fight();}else cancelHold();});
confirm.addEventListener('contextmenu',event=>event.preventDefault());
confirm.addEventListener('click',event=>{event.preventDefault();if(!launchPending)hint();});
confirm.addEventListener('keydown',event=>{if(![' ','Enter'].includes(event.key)||event.repeat)return;startHold({preventDefault:()=>event.preventDefault()});});
confirm.addEventListener('keyup',event=>{if([' ','Enter'].includes(event.key))cancelHold();});
confirm.addEventListener('blur',()=>{if(hold)cancelHold();});
root.addEventListener('click',event=>{const card=event.target.closest?.('.arena-thumb');if(!card||launch)return;event.preventDefault();event.stopImmediatePropagation();if(card===selected)hint();else select(card,{audible:true});},true);
categories.addEventListener('click',event=>{const button=event.target.closest?.('[data-category]');if(button&&!launchPending){filter(button.dataset.category);sound('arena-category');}});
$('arenaRandom').addEventListener('click',()=>{if(launchPending)return;const list=visible(),choices=list.filter(card=>card!==selected);select((choices.length?choices:list)[Math.floor(Math.random()*(choices.length||list.length))],{audible:true,scroll:true});});
root.addEventListener('pointerdown',event=>{if(event.target.closest('button,#arenaStrip')||launchPending)return;gesture={id:event.pointerId,x:event.clientX,y:event.clientY};});
root.addEventListener('pointerup',event=>{if(gesture?.id!==event.pointerId)return;const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;gesture=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4)advance(dx<0?1:-1);});
root.addEventListener('pointercancel',()=>{gesture=null;});
strip.addEventListener('keydown',event=>{if(!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(event.key))return;event.preventDefault();advance(['ArrowRight','ArrowDown'].includes(event.key)?1:-1);selected.focus({preventScroll:true});});
function visibility(){const next=!root.classList.contains('off');if(next===active){syncMedia();return;}active=next;cancelHold();
 if(active){root.classList.remove('arena-enter');void root.offsetWidth;root.classList.add('arena-enter');showBackground();fitName();}
 else{gesture=null;finishLaunch();clearTimeout(changeTimer);prune(new Set());for(const scene of [...background.children])scene.remove();layer=null;}
}
new MutationObserver(visibility).observe(root,{attributes:true,attributeFilter:['class']});
const loadError=$('fightLoadError');if(loadError)new MutationObserver(()=>{if(!loadError.classList.contains('off'))finishLaunch();}).observe(loadError,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelHold();syncMedia();});window.addEventListener('pagehide',()=>{cancelHold();prune(new Set());});window.addEventListener('pageshow',syncMedia);
if(window.ResizeObserver)new ResizeObserver(fitName).observe($('arenaHero'));
document.fonts?.ready.then(fitName);
I.onChange(()=>{if(!selected)return;const data=sources[key(selected)]||{};$('arenaHeroName').textContent=selected.querySelector('strong').textContent;$('arenaHeroDescription').textContent=selected.querySelector('small').textContent;$('arenaHeroCategory').textContent=t('arena.category.'+(data.category||'arena'));fitName();});
window.BRAX_ARENA_PICKER={setSources(next){sources=next;filter(category);select(selected);},select(id){const card=cards.find(item=>key(item)===id)||cards[0];if(card.hidden)filter('all');select(card);},selection:()=>key(selected),report:()=>({category,active,selection:key(selected),preloaded:[...videos.keys()],moving:!!layer?.querySelector('video.is-playing'),progress,launchPending})};
for(const [index,card]of cards.entries())card.style.setProperty('--row',String(Math.min(index+1,7)));
I.apply(root);select(cards.find(card=>key(card)===saved())||cards[0]);filter('all');visibility();
})();
