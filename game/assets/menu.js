/* Small menu boot: combat data is requested only after the fighter is chosen. */
(()=>{

 'use strict';
const t=(key,params)=>window.BRAX_I18N.t('content.'+key,params),h=(key,params)=>window.BRAX_I18N.h('content.'+key,params);
const displayFighterName=id=>window.BRAX_FIGHTER_NAME?.(id)??String(id??'');
 const $=s=>document.querySelector(s),abort=new AbortController(),listen=(el,event,fn)=>el.addEventListener(event,fn,{signal:abort.signal});
 const sources=['/assets/campaign-portraits/brax.webp','/assets/campaign-portraits/nyxa.webp','/assets/campaign-portraits/vexa.webp','/assets/fighter-cards-reference.jpeg','/assets/nina-card-pro.png','/assets/campaign-portraits/danny.webp','/assets/campaign-portraits/bear.webp','/assets/campaign-portraits/demon.webp'],names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
 const ready=sources.map(src=>{const im=new Image();im.src=src;return im.decode().catch(()=>{})});
 let mode="fight",difficulty="normal",behavior="move",challenge=null;
 const features=window.BRAX_FEATURES;let storage;try{storage=window.localStorage;}catch{}const progress=features.createProgress(storage);
 let slot=0,request=0,loading=false,muted=false,touch=null,moved=false,loadLabel=null,featureKind=null;
 const title=$('#titleAudio'),crowd=$('#crowdAudio');title.volume=.72;crowd.volume=.68;
 const play=a=>{if(!muted)a.play().catch(()=>{})};
 function sound(){if(window.BRAX_START_FILM?.active){title.pause();crowd.pause();return;}if($('#selection').classList.contains('off')){crowd.pause();play(title)}else{title.pause();play(crowd)}}
 async function select(index,immediate=false){slot=(index%names.length+names.length)%names.length;window.BRAX_ROSTER?.sync(slot);const serial=++request,next=slot,art=$('#selectionFighter'),name=$('#selectionActions');$('#chooseFighter').disabled=true;art.classList.toggle('switching',!immediate);name.classList.toggle('switching',!immediate);await Promise.all([ready[next],new Promise(r=>setTimeout(r,immediate?0:145))]);if(serial!==request)return;art.classList.toggle('nyxa',next===1);$('#selectionImage').src=sources[next];$('#selectionImage').alt=displayFighterName(names[next]);$('#selectionName').textContent=displayFighterName(names[next]);$('#chooseFighter').setAttribute('aria-label',['arcade','tournament','survival'].includes(mode)?t('menu.confirmPlayer'):t('menu.confirmPair'));await $('#selectionImage').decode().catch(()=>{});if(serial!==request)return;requestAnimationFrame(()=>{art.classList.remove('switching');name.classList.remove('switching');$('#chooseFighter').disabled=loading})}
 window.BRAX_ROSTER?.bind(index=>select(index,true));
 function fitMenu(){const v=window.visualViewport,w=v?.width||innerWidth,h=v?.height||innerHeight,game=$('#game');game.style.width=w+'px';game.style.height=h+'px';game.setAttribute('data-orientation',w<h?'portrait':'landscape');game.style.left=(v?.offsetLeft||0)+'px';game.style.top=(v?.offsetTop||0)+'px';}
 function full(){const root=document.documentElement,enter=root.requestFullscreen||root.webkitRequestFullscreen;if(document.fullscreenElement||document.webkitFullscreenElement)return;try{enter?.call(root,{navigationUI:'hide'})?.then?.(fitMenu)?.catch(()=>{})}catch{}fitMenu()}
 listen(window,'resize',fitMenu);listen(window,'orientationchange',()=>{requestAnimationFrame(fitMenu);setTimeout(fitMenu,200)});listen(document,'fullscreenchange',fitMenu);listen(document,'webkitfullscreenchange',fitMenu);if(window.visualViewport){listen(window.visualViewport,'resize',fitMenu);listen(window.visualViewport,'scroll',fitMenu)}fitMenu();
 function enterAccount(){const profile=window.BRAX_ACCOUNT?.profile;if(!profile)return;for(const id of ['accountEntry','selection','modeSettings','survivalScreen','challengesScreen','featurePanel'])$('#'+id)?.classList.add('off');$('#matchSetup').classList.remove('off');$('#game').classList.add('menu-open');select(0,true);sound();window.BRAX_TOURNAMENTS?.openPending();}
 listen(window,'brax:account-enter',enterAccount);
 listen(window,'brax:start-film-ended',sound);
 listen(window,'brax:account-open',()=>{for(const id of ['selection','matchSetup','modeSettings','survivalScreen','challengesScreen','featurePanel'])$('#'+id)?.classList.add('off');title.pause();crowd.pause();});
 listen($('#backTitle'),'click',()=>{if(loading)return;window.BRAX_TRANSITION.run(()=>{$('#selection').classList.add('off');$('#matchSetup').classList.remove('off');sound()})});

 function settings(next){mode=next;window.BRAX_ROSTER?.setMode(mode);const training=mode==='training';for(const [id,key] of [['fightMode','fight'],['arcadeMode','arcade'],['tournamentMode','tournament'],['mode-training','training']])$('#'+id).setAttribute('aria-pressed',String(mode===key));$('#trainingOptions').classList.toggle('off',!training);$('#drillOptions').classList.add('off');$('#difficultyOptions').classList.toggle('off',training);$('#modeSettingsTitle').textContent=training?t('menu.training'):mode==='arcade'?t('menu.arcade'):mode==='tournament'?t('menu.tournament'):mode==='survival'?t('menu.survival'):t('menu.fight');$('#modeDescription').textContent=training?t('menu.trainingDescription'):t('menu.difficultyDescription');$('#modeSettings').classList.remove('off');if(mode==='survival')window.BRAX_INTERFACE?.openSurvival(progress,difficulty);const goal=features.challenges.find(c=>c.id===challenge);if(goal){$('#trainingOptions').classList.add('off');$('#difficultyOptions').classList.add('off');$('#modeSettingsTitle').textContent=goal.title;$('#modeDescription').textContent=goal.description;}}
 for(const [id,next] of [['fightMode','fight'],['arcadeMode','arcade'],['tournamentMode','tournament'],['mode-training','training']])listen($('#'+id),'click',()=>{challenge=null;settings(next)});
 for(const key of ['easy','normal','hard'])listen($('#mode-'+key),'click',()=>{difficulty=key;for(const other of ['easy','normal','hard'])$('#mode-'+other).setAttribute('aria-pressed',String(key===other));});
 for(const key of ['move','block','spar'])listen($('#training-'+key),'click',()=>{behavior=key;for(const other of ['move','block','spar'])$('#training-'+other).setAttribute('aria-pressed',String(key===other));});

 listen($('#survivalMode'),'click',()=>{challenge=null;settings('survival')});
 function featurePanel(kind){featureKind=kind;$('#liveDrillPanel').classList.add('off');const tasks=kind==='challenges';$('#featureTitle').textContent=tasks?t('menu.challenges'):t('menu.ranking');$('#featureChallenges').classList.toggle('off',!tasks);$('#featureRecords').classList.toggle('off',tasks);$('#recordsTools').classList.toggle('off',tasks);if(!tasks)features.leaderboard(document,progress);if(tasks){for(const [i,c] of features.challenges.entries())$('#challenge-'+c.id).innerHTML=features.challengeCard(c,progress.fighter(names[slot]).challenges.includes(c.id),i);window.BRAX_INTERFACE?.openChallenges(progress,names[slot]);return;}else $('#featureRecords').innerHTML=features.records(progress);$('#progressNotice').textContent=progress.saved?t('menu.progressSaved'):t('menu.progressUnavailable');$('#featurePanel').classList.remove('off');}
 for(const id of ['recordsMode','recordsDifficulty'])listen($('#'+id),'change',()=>features.leaderboard(document,progress));
 listen($('#challengesMode'),'click',()=>featurePanel('challenges'));listen($('#achievementsMode'),'click',()=>featurePanel('records'));listen($('#closeFeatures'),'click',()=>$('#featurePanel').classList.add('off'));
 for(const c of features.challenges)listen($('#challenge-'+c.id),'click',()=>window.BRAX_HUB.inspect(c,()=>{$('#challengesScreen').classList.add('off');$('#challengeHub').classList.add('off');challenge=c.id;settings(c.mode||(c.drill?'training':'fight'));if(c.drill){behavior=c.drill;$('#trainingDrill').value=c.drill;}else{difficulty=c.difficulty||'normal';for(const k of ['easy','normal','hard'])$('#mode-'+k).setAttribute('aria-pressed',String(k===difficulty));}$('#modeDescription').textContent=c.description;$('#modeSettingsTitle').textContent=c.title;$('#trainingOptions').classList.add('off');$('#difficultyOptions').classList.add('off');$('#featurePanel').classList.add('off');$('#modeSettings').classList.add('off');$('#survivalScreen').classList.add('off');$('#matchSetup').classList.add('off');$('#selection').classList.remove('off');sound();}));
 listen($('#trainingDrill'),'change',()=>{const v=$('#trainingDrill').value;behavior=['repeat','counter','grab','bag'].includes(v)?v:'move';});
 listen($('#openModeSettings'),'click',()=>settings(mode));
 listen($('#closeModeSettings'),'click',()=>$('#modeSettings').classList.add('off'));
 listen($('#setupBack'),'click',()=>window.BRAX_ACCOUNT?.openProfile());
 listen($('#setupNext'),'click',()=>{$('#modeSettings').classList.add('off');$('#matchSetup').classList.add('off');$('#selection').classList.remove('off');sound()});
 listen($('#nextFighter'),'click',()=>{if(!loading)select(slot+1)});listen($('#previousFighter'),'click',()=>{if(!loading)select(slot-1)});
 listen($('#selection'),'pointerdown',e=>{if(e.target.closest('#rosterBoard'))return;if(loading||e.target.closest('button')?.id&&e.target.closest('button').id!=='chooseFighter')return;moved=false;touch={x:e.clientX,y:e.clientY,t:performance.now()}});
 listen($('#selection'),'pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3&&performance.now()-touch.t<900){moved=true;select(slot+(dx<0?1:-1))}touch=null});
 listen($('#selection'),'pointercancel',()=>{touch=null;moved=true});
 listen($('#menuSound'),'click',()=>{muted=!muted;title.muted=crowd.muted=muted;$('#menuSound').textContent=muted?'🔇':'🔊';$('#menuSound').setAttribute('aria-label',muted?t('menu.unmute'):t('menu.mute'));if(muted){title.pause();crowd.pause()}else sound()});
 listen(document,'visibilitychange',()=>{if(document.hidden){title.pause();crowd.pause()}else sound()});
 const scripts=new Map();
 function load(src){if(scripts.has(src))return scripts.get(src);const p=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{scripts.delete(src);s.remove();reject(Error('load'))};document.head.appendChild(s)});scripts.set(src,p);return p}
 window.BRAX_LOAD_MULTIPLAYER=async()=>{window.BRAX_BOOT={multiplayer:true,dispose:()=>{abort.abort();title.pause();crowd.pause()}};const source=await import('/assets/fighter-source.js?v=review-147');window.BRAX_PREPARE_PAIR=source.preparePair;await Promise.all(['BRAX','NYXA'].map(async who=>{window[who+'_3D']=await source.prepareMetadata(who);}));await load('/assets/combat.js?v=133');};
 async function confirmFighter(){if(loading)return;loading=true;loadLabel='menu.loading';$('#chooseFighter').dataset.loadState='loading';$('#chooseFighter').disabled=true;$('#selectionName').textContent=t('menu.loading');$('#chooseFighter').textContent=t('menu.loading');window.BRAX_BOOT={slot,muted,mode,difficulty,behavior,challenge,drillAttack:$('#trainingAttack').value,dispose:()=>{abort.abort();title.pause();crowd.pause()}};try{loadLabel='menu.loadingFighters';$('#selectionName').textContent=t('menu.loadingFighters');const source=await import('/assets/fighter-source.js?v=review-147');window.BRAX_PREPARE_PAIR=source.preparePair;await Promise.all(['BRAX','NYXA'].map(async who=>{window[who+'_3D']=await source.prepareMetadata(who);}));await load('/assets/combat.js?v=133')}catch{loading=false;loadLabel='menu.retry';$('#chooseFighter').dataset.loadState='retry';$('#chooseFighter').disabled=false;$('#selectionName').textContent=t('menu.retry');$('#chooseFighter').textContent=t('menu.retry')}}
 // Cards dispatch the original confirmation event after updating the slot.
 // A hidden legacy portrait decoding must not block that deliberate choice.
 listen($('#chooseFighter'),'click',()=>{if(moved)return;confirmFighter()});
 function renderLanguage(){
  const training=mode==='training',goal=features.challenges.find(c=>c.id===challenge);
  for(const id of ['modeSettingsTitle','modeDescription','selectionName','chooseFighter','featureTitle','progressNotice'])$('#'+id)?.removeAttribute('data-i18n');
  $('#chooseFighter').removeAttribute('data-i18n-aria-label');
  $('#modeSettingsTitle').textContent=goal?goal.title:t('menu.'+mode);
  $('#modeDescription').textContent=goal?goal.description:t(training?'menu.trainingDescription':'menu.difficultyDescription');
  $('#menuSound').setAttribute('aria-label',t(muted?'menu.unmute':'menu.mute'));
  if(loadLabel){$('#selectionName').textContent=t(loadLabel);$('#chooseFighter').textContent=t(loading?'menu.loading':loadLabel);}
  else $('#selectionName').textContent=displayFighterName(names[slot]);
  $('#chooseFighter').setAttribute('aria-label',t(['arcade','tournament','survival'].includes(mode)?'menu.confirmPlayer':'menu.confirmPair'));
  if(featureKind){const tasks=featureKind==='challenges';$('#featureTitle').textContent=t(tasks?'menu.challenges':'menu.ranking');
   if(tasks)for(const [i,c] of features.challenges.entries())$('#challenge-'+c.id).innerHTML=features.challengeCard(c,progress.fighter(names[slot]).challenges.includes(c.id),i);
   else if(!$('#featurePanel').classList.contains('off')){features.leaderboard(document,progress);$('#featureRecords').innerHTML=features.records(progress);}
   $('#progressNotice').textContent=t(progress.saved?'menu.progressSaved':'menu.progressUnavailable');}
 }
 listen(window,'brax:language',renderLanguage);
 sound();
})();
