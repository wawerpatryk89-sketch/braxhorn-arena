/* Internet rooms: host owns the simulation; guest sends inputs, never damage. */
(()=>{
'use strict';
const displayFighterName=id=>window.BRAX_FIGHTER_NAME?.(id)??String(id??'');
const $=id=>document.getElementById(id),names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
let session=null,ready=false,loading=false,playing=false,seq=0,received=0,eventId=0,events=[],held={},timer=null,lastOK=0,peer=null,directTimer=null;
let selectionReturn=null,polling=false,urgent=false;
let fighter='BRAX',profileName='GRACZ',reporting=false,terminalAt=0,resultStatus='';
let httpRtt=null;
window.BRAX_LINK_DIAGNOSTICS=()=>({role:session?.role||'offline',transport:!session?'none':peer?.alive?'webrtc':'http',pingMs:!session?null:peer?.alive?peer.rtt:httpRtt});
const fighterLabel=n=>displayFighterName(n);
const art=n=>window.BRAX_ROSTER.portrait(n);
const style=n=>$('card-'+n.toLowerCase()).querySelector('.fighter-card-style').textContent;
const button=document.createElement('button');button.id='multiplayerMode';button.className='mode-hit premium-mode-card';button.setAttribute('aria-label','Multiplayer — walka przez internet');button.innerHTML='<div class="mp-mode-art"><img src="/assets/multiplayer-duel-premium.png" alt="" draggable="false"></div><span class="premium-mode-copy"><small>GRACZ KONTRA GRACZ</small><strong>MULTIPLAYER</strong><span>Walka przez internet</span></span>';document.querySelector('#matchSetup .mode-card-row').appendChild(button);
const panel=document.createElement('section');panel.id='mpPanel';panel.className='off';panel.setAttribute('aria-label','Multiplayer');panel.innerHTML=`
<header class="mp-heading"><div><small>BRAXHORN · MULTIPLAYER</small><h1 id="mpTitle">WYBIERZ ZAWODNIKA</h1></div><button id="mpLeave" class="destination-back">‹ WRÓĆ</button></header>
<div id="mpSelection"><div class="mp-roster" role="group" aria-label="Zawodnicy — przesuń w lewo lub w prawo">${names.map(n=>`<button class="mp-fighter" data-fighter="${n}" aria-label="Wybierz ${displayFighterName(n)}, ${style(n)}" aria-pressed="${n===fighter}"><div class="mp-fighter-art">${art(n)}</div><span class="mp-card-number" aria-hidden="true">${String(names.indexOf(n)+1).padStart(2,'0')}</span><div class="mp-fighter-label"><small class="mp-card-eyebrow">TWÓJ ZAWODNIK</small><strong>${fighterLabel(n)}</strong><small>${style(n)}</small></div>${window.BRAX_ROSTER.frame()}</button>`).join('')}</div><div class="mp-carousel-nav"><button id="mpPrevious" aria-label="Poprzedni zawodnik">‹</button><button id="mpFollowing" aria-label="Następny zawodnik">›</button></div><footer class="mp-selection-footer"><button id="mpNext" class="destination-primary">WYBIERZ →</button><span id="mpPosition" role="status" aria-live="polite"></span></footer></div>
<div id="mpLobby" class="off"><aside class="mp-identity"><div id="mpChosenArt" class="mp-fighter-art"></div><div class="mp-fighter-label"><small>TWÓJ ZAWODNIK</small><strong id="mpChosenName"></strong><span id="mpChosenPlayer" class="mp-player-name"></span></div><button id="mpChange">ZMIEŃ ZAWODNIKA</button></aside><div id="mpEntry"><article class="mp-room-option"><small>01 · ZAPROŚ RYWALA</small><h2>UTWÓRZ POKÓJ</h2><p>Otrzymasz kod, który przekażesz drugiemu graczowi.</p><label for="mpArena">ARENA GOSPODARZA</label><select id="mpArena">${Object.keys(window.BRAX_ARENA_VIDEOS||{}).map(k=>`<option value="${k}"${k==='snow'?' selected':''}>${document.getElementById('arena-'+k)?.querySelector('strong')?.textContent||k}</option>`).join('')}</select><button id="mpCreate" class="destination-primary">UTWÓRZ POKÓJ →</button></article><article class="mp-room-option"><small>02 · MASZ JUŻ KOD?</small><h2>DOŁĄCZ DO WALKI</h2><label for="mpCode">KOD OD DRUGIEGO GRACZA</label><input id="mpCode" maxlength="8" inputmode="text" enterkeyhint="go" autocorrect="off" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="WPISZ KOD"><button id="mpJoin" class="destination-primary">DOŁĄCZ →</button></article></div></div>
<div id="mpRoom" class="off"><div class="mp-versus"><div class="mp-contender"><div id="mpHostArt" class="mp-fighter-art"></div><strong id="mpHostName"></strong><span id="mpHostFighter" class="mp-player-name"></span></div><div class="mp-versus-center"><small>WALKA PRZEZ INTERNET</small><b>VS</b><span id="mpPlayers"></span><div class="mp-connecting"><div class="mp-loading-track" role="progressbar" aria-label="Przygotowanie połączenia" aria-describedby="mpLoadingStage"><i></i></div><strong id="mpLoadingStage">Czekamy na rywala…</strong></div></div><div class="mp-contender"><div id="mpGuestArt" class="mp-fighter-art"><span class="mp-waiting">?</span></div><strong id="mpGuestName">CZEKAM NA RYWALA</strong><span id="mpGuestFighter" class="mp-player-name"></span></div></div><footer class="mp-room-footer"><div><small>KOD POKOJU · PRZEKAŻ RYWALOWI</small><strong id="mpRoomCode"></strong></div><button id="mpCopy">KOPIUJ KOD</button></footer></div>
<p id="mpStatus" role="status" aria-live="polite"></p>`;$('game').appendChild(panel);
const fighterCards=[...panel.querySelectorAll('[data-fighter]')],track=panel.querySelector('.mp-roster');
let heroTouch=null,ignoreUntil=0;
function choose(n){
 if(session||loading||!names.includes(n))return;
 fighter=n;const index=names.indexOf(n);
 fighterCards.forEach((card,i)=>{let delta=(i-index+names.length)%names.length;if(delta>names.length/2)delta-=names.length;
  card.style.setProperty('--offset',delta);card.classList.toggle('mp-focused',delta===0);card.classList.toggle('mp-neighbor',Math.abs(delta)===1);
  card.setAttribute('aria-pressed',String(delta===0));card.setAttribute('aria-hidden',String(Math.abs(delta)>1));card.tabIndex=Math.abs(delta)<=1?0:-1;
 });
 $('mpPosition').textContent=String(index+1).padStart(2,'0')+' / '+String(names.length).padStart(2,'0');
 $('mpNext').setAttribute('aria-label','Wybierz zawodnika: '+displayFighterName(n));
}
for(const b of fighterCards)b.onclick=()=>{if(performance.now()>=ignoreUntil)choose(b.dataset.fighter);};
$('mpPrevious').onclick=()=>choose(names[(names.indexOf(fighter)+names.length-1)%names.length]);$('mpFollowing').onclick=()=>choose(names[(names.indexOf(fighter)+1)%names.length]);
track.addEventListener('pointerdown',e=>{heroTouch={id:e.pointerId,x:e.clientX,y:e.clientY};});
track.addEventListener('pointerup',e=>{if(!heroTouch||heroTouch.id!==e.pointerId)return;const dx=e.clientX-heroTouch.x,dy=e.clientY-heroTouch.y;heroTouch=null;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)){ignoreUntil=performance.now()+400;$(dx<0?'mpFollowing':'mpPrevious').click();}});
track.addEventListener('pointercancel',()=>heroTouch=null);track.addEventListener('dragstart',e=>e.preventDefault());
$('mpSelection').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();e.stopPropagation();$(e.key==='ArrowLeft'?'mpPrevious':'mpFollowing').click();fighterCards[names.indexOf(fighter)].focus();});
choose(fighter);
function selection(){if(session||loading)return;$('mpSelection').classList.remove('off');$('mpLobby').classList.add('off');$('mpRoom').classList.add('off');$('mpTitle').textContent='WYBIERZ ZAWODNIKA';note('');}
$('mpNext').onclick=()=>{if(selectionReturn){const c=selectionReturn;selectionReturn=null;panel.classList.add('off');window.BRAX_TOURNAMENTS.open(c);return;}$('mpChosenArt').innerHTML=art(fighter);$('mpChosenName').textContent=fighterLabel(fighter);$('mpChosenPlayer').textContent=window.BRAX_ONLINE?.name||profileName;$('mpSelection').classList.add('off');$('mpLobby').classList.remove('off');$('mpTitle').textContent='ZAPROŚ RYWALA';note('Utwórz pokój albo dołącz kodem od drugiego gracza.');};$('mpChange').onclick=selection;
let shownHost='',shownGuest='',entryAttempt=0;
function showPlayers(host,guest,hostName=session?.hostName||profileName,guestName=session?.guestName||'GRACZ'){
 if(host!==shownHost){$('mpHostArt').innerHTML=art(host);shownHost=host;}
 if(guest&&guest!==shownGuest){$('mpGuestArt').innerHTML=art(guest);shownGuest=guest;}
 $('mpHostName').textContent=hostName;$('mpHostFighter').textContent=displayFighterName(host);
 $('mpGuestName').textContent=guest?guestName:'CZEKAM NA RYWALA';$('mpGuestFighter').textContent=displayFighterName(guest);
 $('mpPlayers').textContent=guest?'ZAWODNICY GOTOWI DO POŁĄCZENIA':'OCZEKIWANIE NA DRUGIEGO GRACZA';
}

const badge=document.createElement('div');badge.id='mpBadge';badge.className='off';badge.innerHTML='<span id="mpConnection"></span><button id="mpExit">OPUŚĆ</button>';$('game').appendChild(badge);
function requestSync(){urgent=true;if(!polling&&session){clearTimeout(timer);timer=setTimeout(poll,0);}}
function sendInput(){if(!session||session.role!=='guest'||!playing)return;window.BRAX_MULTIPLAYER_ENGINE.localInput?.({held,events,visible:!document.hidden});if(!peer?.send('input',{held,events,visible:!document.hidden})){if(!peer?.alive)flushGuestInput();}}
// An input change must not sit behind an already pending room poll.
let inputFlight=null;
function flushGuestInput(){
 const current=session;if(!current||current.role!=='guest'||!playing)return;
 if(inputFlight?.session===current){inputFlight.dirty=true;return;}
 const flight={session:current,dirty:false};inputFlight=flight;
 api({code:current.code,token:current.token,role:'guest',action:'sync',ready,seq:++seq,input:{held,events,visible:!document.hidden,signal:peer?.signal,voice:window.BRAX_VOICE?.signal}}).then(r=>{
  if(session!==current||peer?.alive)return;
  if(r.status==='closed'){requestSync();return;}
  if(r.seq>received&&r.snapshot){received=r.seq;window.BRAX_MULTIPLAYER_ENGINE.receive(r.snapshot);events=events.filter(e=>e.id>r.snapshot.ack);}
 }).catch(()=>{if(session===current)requestSync();}).finally(()=>{
  if(inputFlight!==flight)return;inputFlight=null;
  if(session===current&&flight.dirty&&!peer?.alive)flushGuestInput();
 });
}
let networkSteps=0,lastKeyframe=-Infinity,lastHttpKeyframe=-Infinity;window.BRAX_NETWORK_STEP=p=>{if(playing&&session?.role==='host'&&peer?.open&&++networkSteps%2===0){const now=performance.now(),keyframe=now-lastKeyframe>=2000;if(keyframe&&peer.keyOpen){if(peer.sendKey(window.BRAX_MULTIPLAYER_ENGINE.snapshot(true)))lastKeyframe=now;peer.send('state',p);return;}if(keyframe)p=window.BRAX_MULTIPLAYER_ENGINE.snapshot(true);if(peer.send('state',p)&&keyframe)lastKeyframe=now;}};
function makePeer(){if(peer||!session)return;lastKeyframe=lastHttpKeyframe=-Infinity;try{peer=window.BRAX_PEER?.create({host:session.role==='host',rtc:session.rtc,onSignal:requestSync,onMismatch:message=>{leave(message);},onKey:k=>window.BRAX_MULTIPLAYER_ENGINE?.receiveKey?.(k),onInput:i=>{const e=window.BRAX_MULTIPLAYER_ENGINE;e.input(i);e.connection(true);},onState:p=>{window.BRAX_MULTIPLAYER_ENGINE.connection(true);window.BRAX_MULTIPLAYER_ENGINE.receive(p);events=events.filter(e=>e.id>p.ack);}});}catch{peer=null;}directTimer=setInterval(()=>{if(!playing||!peer?.open)return;const engine=window.BRAX_MULTIPLAYER_ENGINE;if(session?.role==='guest')peer.send('input',{held,events,visible:!document.hidden});},20);}
const note=s=>{$('mpStatus').textContent=s;if(session&&!playing)$('mpLoadingStage').textContent=s;};
async function api(body){body={...body,compat:window.BRAX_COMPAT};const began=performance.now();const c=new AbortController(),timeout=setTimeout(()=>c.abort(),5000);try{const r=await fetch('/api/duel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(Object.entries(body).filter(([key])=>!['rtc','rtcPromise','voiceDecision'].includes(key)))),signal:c.signal,credentials:'same-origin'});let data;try{data=await r.json();}catch{throw Error('Nie udało się połączyć z multiplayerem.');}if(!r.ok)throw Object.assign(Error(data.error||'Błąd połączenia.'),{status:r.status});httpRtt=performance.now()-began;return data;}finally{clearTimeout(timeout);}}
function open(){panel.classList.remove('off');selection();profileName=window.BRAX_ONLINE?.name||'GRACZ';}
button.onclick=open;
function activate(joined){
 $('mpResultBack').disabled=true;session=joined;session.rtc=window.BRAX_RTC.fallback;session.rtcPromise=window.BRAX_RTC.configure(joined).then(config=>{joined.rtc=config;return config;});ready=false;playing=false;reporting=false;terminalAt=0;resultStatus='';seq=received=eventId=0;events=[];held={};lastOK=performance.now();
 panel.classList.remove('off');$('mpSelection').classList.add('off');$('mpLobby').classList.add('off');$('mpTitle').textContent='POKÓJ WALKI';shownHost=shownGuest='';
 $('mpGuestArt').innerHTML='<span class="mp-waiting">?</span>';$('mpGuestName').textContent='CZEKAM NA RYWALA';$('mpGuestFighter').textContent='';
 if(session.role==='host')showPlayers(fighter,null);else{$('mpHostArt').innerHTML='<span class="mp-waiting">?</span>';$('mpHostName').textContent=session.hostName||'GOSPODARZ';$('mpGuestArt').innerHTML=art(fighter);$('mpGuestName').textContent=session.guestName||profileName;$('mpGuestFighter').textContent=fighterLabel(fighter);}
 $('mpRoom').classList.remove('off');$('mpRoomCode').textContent=session.code;note(session.tournamentCode?'Łączenie z wyznaczoną walką turniejową…':session.role==='host'?'Podaj kod drugiemu graczowi.':'Dołączono. Przygotowanie walki…');poll();
}
async function enter(action){
 if(session||loading)return;if(action==='join'&&!/^[A-F0-9]{8}$/.test($('mpCode').value.trim().toUpperCase())){note('Kod pokoju ma 8 znaków.');return;}
 $('mpCode').blur();panel.classList.remove('mp-code-entry');loading=true;const attempt=++entryAttempt;$('mpCreate').disabled=$('mpJoin').disabled=true;note('Zapisywanie profilu i łączenie…');
 try{profileName=(await window.BRAX_ONLINE.ensureProfile()).name;const joined=await api({action,fighter,...(action==='create'?{arena:$('mpArena').value}:{}),code:$('mpCode').value.trim().toUpperCase()});if(attempt!==entryAttempt){api({...joined,action:'leave'}).catch(()=>{});return;}activate(joined);}
 catch(e){if(attempt===entryAttempt)note(e.message);}finally{if(attempt===entryAttempt){loading=false;$('mpCreate').disabled=$('mpJoin').disabled=false;}}
}

window.BRAX_CODE_INPUT.attach($('mpCode'),{length:8,title:'KOD POKOJU',onSubmit:()=>enter('join')});
$('mpCreate').onclick=()=>enter('create');$('mpJoin').onclick=()=>enter('join');$('mpCopy').onclick=async()=>{try{await navigator.clipboard.writeText(session.code);note('Kod skopiowany.');}catch{note('Kod pokoju: '+session.code);}};
async function leave(message=''){const old=session;++entryAttempt;$('mpOnlineResult').classList.add('off');session=null;clearTimeout(timer);clearInterval(directTimer);peer?.close();peer=null;window.BRAX_VOICE?.stop();held={};events=[];ready=false;playing=false;window.BRAX_MULTIPLAYER_ENGINE?.stop();badge.classList.add('off');panel.classList.toggle('off',!message);$('mpRoom').classList.add('off');loading=false;$('mpCreate').disabled=$('mpJoin').disabled=false;selection();note(message);if(old)api({...old,action:'leave'}).catch(()=>{});if(old?.tournamentCode)window.BRAX_TOURNAMENTS?.open(old.tournamentCode);}
$('mpLeave').onclick=()=>{if(selectionReturn){const c=selectionReturn;selectionReturn=null;panel.classList.add('off');window.BRAX_TOURNAMENTS.open(c);}else leave();};$('mpExit').onclick=()=>leave();
async function poll(){const current=session;if(!current||polling)return;polling=true;urgent=false;const start=performance.now(),engine=window.BRAX_MULTIPLAYER_ENGINE;try{
 const body={code:current.code,token:current.token,role:current.role,action:'sync',ready,seq:++seq};if(ready&&current.role==='host')body.snapshot={...engine.snapshot(performance.now()-lastHttpKeyframe>=2000),signal:peer?.signal,voice:window.BRAX_VOICE?.signal};if(body.snapshot?.keyframe)lastHttpKeyframe=performance.now();if(ready&&current.role==='guest')body.input={held,events,visible:!document.hidden,signal:peer?.signal,voice:window.BRAX_VOICE?.signal};
 const r=await api(body);if(session!==current)return;lastOK=performance.now();
 if(r.status==='closed'){leave('Drugi gracz opuścił pokój.');return;}
 current.hostName=r.hostName;current.guestName=r.guestName;showPlayers(r.hostFighter,r.guestFighter,r.hostName,r.guestName);if(r.scheduledAt>Date.now())note('START O '+new Date(r.scheduledAt).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})+' · Czekamy na termin i gotowość obu graczy.');
 if(r.guestFighter&&!ready&&!current.preparing){current.preparing=true;note('Ładowanie obu zawodników…');(async()=>{try{if(!window.BRAX_ENGINE_READY)await window.BRAX_LOAD_MULTIPLAYER();if(session!==current)return;await window.BRAX_MULTIPLAYER_ENGINE.start(current.role,r);if(session!==current){window.BRAX_MULTIPLAYER_ENGINE.stop();return;}note('Łączenie graczy…');await current.rtcPromise;if(session!==current)return;lastOK=performance.now();lastOK=performance.now();note('Wybierz zgodę na rozmowę głosową.');current.voiceDecision=window.BRAX_VOICE?.begin({host:current.role==='host',rtc:current.rtc,onSignal:requestSync});await current.voiceDecision;if(session!==current)return;lastOK=performance.now();ready=true;makePeer();note('Twój zawodnik gotowy. Czekamy na gotowość rywala…');}catch(e){leave('Nie udało się wczytać walki. Spróbuj ponownie.');}})();}
 if(ready){const signal=current.role==='host'?r.input?.signal:r.snapshot?.signal;peer?.accept(signal);window.BRAX_VOICE?.accept(current.role==='host'?r.input?.voice:r.snapshot?.voice);}
 if(ready&&r.status==='playing'){
  if(!playing){playing=true;panel.classList.add('off');badge.classList.remove('off');window.BRAX_MULTIPLAYER_ENGINE.go();}
  const stale=!peer?.alive&&r.now-r.peerSeen>2500;window.BRAX_MULTIPLAYER_ENGINE.connection(!stale);
  const state=current.role==='host'?body.snapshot?.state:r.snapshot?.state;if(state?.matchOver)finishResult(current,state);
  $('mpConnection').textContent=state?.matchOver?(state.wins[0]===state.wins[1]?'REMIS':((state.wins[0]>state.wins[1])===(current.role==='host')?'WYGRYWASZ':'WYGRYWA RYWAL'))+' · '+state.wins.join(':'):stale?'Czekam na połączenie rywala…':(current.role==='host'?'TY: LEWA STRONA':'TY: PRAWA STRONA')+(peer?.alive?' · '+(peer.route==='relay'?'TURN':peer.route==='direct'?'BEZPOŚREDNIO':'ONLINE')+(peer.rtt===null?'':' · '+Math.round(peer.rtt)+' ms'):' · POŁĄCZENIE ZAPASOWE · '+Math.round(performance.now()-start)+' ms');
  if(!state?.matchOver&&!peer?.alive&&r.now-r.peerSeen>20000){leave('Rywal utracił połączenie. Walka zakończona.');return;}
  if(!peer?.alive&&r.seq>received){received=r.seq;if(current.role==='host'&&r.input)engine.input(r.input);if(current.role==='guest'&&r.snapshot){engine.receive(r.snapshot);events=events.filter(e=>e.id>r.snapshot.ack);}}
 }
}catch(e){if(session!==current)return;note(e.message);if(playing&&!peer?.alive){window.BRAX_MULTIPLAYER_ENGINE?.connection(false);$('mpConnection').textContent='Przywracanie połączenia…';}if(e.status===409&&e.message==='Odśwież grę — inna wersja u przeciwnika'){leave(e.message);return;}if(e.status===404||e.status===403||(!peer?.alive&&performance.now()-lastOK>(current.preparing&&!ready?90000:20000))){leave(e.status===404?'Pokój został zamknięty.':'Połączenie przerwane. Otwórz nowy pokój.');return;}}finally{polling=false;if(session&&session!==current)requestSync();}
 if(session===current)timer=setTimeout(poll,urgent?0:playing?(peer?.alive?500:Math.max(0,50-(performance.now()-start))):250);
}
let lastDir={key:null,time:0,released:true};
// Double-tap timing is measured on the guest's own device; network jitter must not decide whether the fighter runs.
function direction(kind,down){const now=performance.now();if(!down){if(lastDir.key===kind)lastDir.released=true;return;}const double=lastDir.key===kind&&lastDir.released&&now-lastDir.time<300;lastDir={key:kind,time:now,released:false};const engine=window.BRAX_MULTIPLAYER_ENGINE;if(engine)engine.localRun?.(double?kind:null);send(kind,{double});}
function send(kind,extra){if(!session||session.role!=='guest'||!playing)return;events.push({id:++eventId,kind,...extra});events=events.slice(-64);sendInput();}
const keys={a:'punch',f:'heavy',s:'kick',g:'kick2',q:'special',c:'grab',e:'evade',u:'evade'},holds={arrowleft:'left',arrowright:'right',arrowdown:'down',d:'block'};
const guest=()=>session?.role==='guest'&&playing;
for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{if(!guest())return;const k=e.key.toLowerCase(),h=holds[k];if(!h&&!keys[k])return;e.preventDefault();e.stopImmediatePropagation();if(h){held[h]=type==='keydown';if((h==='left'||h==='right')&&!e.repeat)direction(h,type==='keydown');}else if(type==='keydown'&&!e.repeat)send(keys[k]);sendInput();},true);
const pointers=new Map();
window.addEventListener('pointerdown',e=>{if(!guest())return;const b=e.target.closest?.('#controls button,#airAttackModifier');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const h=b.dataset.hold,t=b.dataset.tap;if(h){held[h]=true;pointers.set(e.pointerId,h);if(h==='left'||h==='right')direction(h,true);}else if(t)send(t);sendInput();},true);
for(const type of ['pointerup','pointercancel'])window.addEventListener(type,e=>{const h=pointers.get(e.pointerId);if(!h)return;held[h]=false;pointers.delete(e.pointerId);if(h==='left'||h==='right')direction(h,false);sendInput();e.preventDefault();e.stopImmediatePropagation();},true);
window.addEventListener('blur',()=>{held={};pointers.clear();sendInput();});document.addEventListener('visibilitychange',()=>{if(document.hidden){held={};pointers.clear();sendInput();}});
const resultPanel=document.createElement('section');resultPanel.id='mpOnlineResult';resultPanel.className='off';resultPanel.setAttribute('aria-label','Wynik walki online');resultPanel.innerHTML='<small>BRAXHORN · WYNIK WALKI</small><h2 id="mpResultTitle"></h2><p id="mpResultNames"></p><strong id="mpResultScore"></strong><p id="mpResultStatus" role="status"></p><button id="mpResultBack" class="destination-primary" disabled>WRÓĆ DO MULTIPLAYERA →</button><button id="mpResultReview" class="off">ZGŁOŚ BRAK POTWIERDZENIA</button>';$('game').appendChild(resultPanel);
$('mpResultBack').onclick=()=>leave();
$('mpResultReview').onclick=async()=>{if(!session)return;try{await api({...session,action:'review'});resultStatus='disputed';$('mpResultStatus').textContent='Wynik oczekuje na decyzję organizatora.';$('mpResultBack').disabled=false;$('mpResultReview').classList.add('off');}catch(e){$('mpResultStatus').textContent=e.message;}};
async function finishResult(current,state){
 if(!terminalAt)terminalAt=performance.now();if(performance.now()-terminalAt<2500)return;
 resultPanel.classList.remove('off');const win=state.wins[0]===state.wins[1]?-1:state.wins[0]>state.wins[1]?0:1;
 $('mpResultTitle').textContent=win<0?'REMIS':(win===0?current.hostName:current.guestName)+' WYGRYWA';$('mpResultNames').textContent=current.hostName+' — '+current.guestName;$('mpResultScore').textContent=state.wins.join(' : ');$('mpResultBack').textContent=current.tournamentCode?'WRÓĆ DO TURNIEJU →':'WRÓĆ DO MULTIPLAYERA →';
 if(['confirmed','disputed'].includes(resultStatus))return;
 $('mpResultStatus').textContent='Zapisywanie wyniku · czekamy na potwierdzenie obu połączeń…';
 if(performance.now()-terminalAt>15000){if(current.tournamentCode)$('mpResultReview').classList.remove('off');else{$('mpResultBack').disabled=false;$('mpResultStatus').textContent='Brakuje potwierdzenia drugiego gracza. Wynik nie został zatwierdzony.';}}
 if(reporting)return;reporting=true;try{const r=await api({...current,action:'result',score:state.wins});if(session!==current)return;resultStatus=r.resultStatus;if(resultStatus==='confirmed'){$('mpResultStatus').textContent=win<0&&current.tournamentCode?'Remis zapisany. Organizator wyznaczy powtórkę.':'Wynik zapisany · zgodne zgłoszenia obu graczy.';$('mpResultBack').disabled=false;$('mpResultReview').classList.add('off');if(current.tournamentCode)window.BRAX_TOURNAMENTS.finishedAsChampion(current.tournamentCode).then(champion=>{if(champion&&session===current)leave();}).catch(()=>{});}else if(resultStatus==='disputed'){$('mpResultStatus').textContent='Niezgodność wyników. Organizator rozstrzygnie tę walkę.';$('mpResultBack').disabled=false;}}
 catch(e){if(session===current)$('mpResultStatus').textContent='Ponawiam zapis wyniku… '+e.message;}finally{reporting=false;}
}

window.BRAX_MULTIPLAYER={get active(){return!!session;},get role(){return session?.role;},get fighter(){return fighter;},art,leave,open,selectForTournament(code){if(session||loading)return;selectionReturn=code;open();},async enterTournament(joined,n){if(session)throw Error('Najpierw opuść obecną walkę.');choose(n);profileName=(await window.BRAX_ONLINE.ensureProfile()).name;$('mpResultBack').disabled=true;activate(joined);}};
})();
