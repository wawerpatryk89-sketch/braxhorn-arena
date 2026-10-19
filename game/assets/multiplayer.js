/* Internet rooms: host owns the simulation; guest sends inputs, never damage. */
(()=>{
'use strict';
const I=window.BRAX_I18N,L=window.BRAX_ONLINE_I18N,tr=(key,params)=>L.t(key,params);
const displayFighterName=id=>window.BRAX_FIGHTER_NAME?.(id)??String(id??'');
const $=id=>document.getElementById(id),names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
let session=null,ready=false,loading=false,playing=false,seq=0,received=0,eventId=0,events=[],held={},timer=null,lastOK=0,peer=null,directTimer=null;
let selectionReturn=null,polling=false,urgent=false;
let fighter='BRAX',profileName=tr("identity.player"),reporting=false,terminalAt=0,resultStatus='';
let httpRtt=null,lastResultState=null;
window.BRAX_LINK_DIAGNOSTICS=()=>({role:session?.role||'offline',transport:!session?'none':peer?.alive?'webrtc':'http',pingMs:!session?null:peer?.alive?peer.rtt:httpRtt});
const fighterLabel=n=>displayFighterName(n);
const art=n=>window.BRAX_ROSTER.portrait(n);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const identity=(name,avatar)=>window.BRAX_ONLINE.avatarMarkup({name,avatar})+'<strong>'+esc(name)+'</strong>';
function syncChosenIdentity(){const p=window.BRAX_ONLINE.profile;if($('mpChosenPlayer'))$('mpChosenPlayer').innerHTML=identity(p?.name||profileName,p?.avatar);}
const style=n=>$('card-'+n.toLowerCase()).querySelector('.fighter-card-style').textContent;
const stats=n=>{const rows=$('card-'+n.toLowerCase()).querySelector('.fighter-stats').cloneNode(true);[...rows.children].slice(3).forEach(row=>row.remove());rows.children[0].querySelector('span').textContent=tr("fighter.power");return rows.outerHTML;};
const button=document.createElement('button');button.id='multiplayerMode';button.className='mode-hit premium-mode-card';button.setAttribute('aria-label',tr("multiplayer.modeLabel"));button.innerHTML=("<div class=\"mp-mode-art\"><img src=\"/assets/multiplayer-duel-premium.png\" alt=\"\" draggable=\"false\"></div><span class=\"premium-mode-copy\"><small>"+tr("multiplayer.playerVsPlayer")+"</small><strong>"+tr("multiplayer.name")+"</strong><span>"+tr("multiplayer.internetMatch")+"</span></span>");document.querySelector('#matchSetup .mode-card-row').appendChild(button);
const panel=document.createElement('section');panel.id='mpPanel';panel.className='off';panel.setAttribute('aria-label',tr('multiplayer.label'));panel.innerHTML=`
<header class="mp-heading"><div><small>${tr("multiplayer.brandHeading")}</small><h1 id="mpTitle">${tr("multiplayer.chooseFighter")}</h1></div><button id="mpLeave" class="destination-back">${tr("navigation.back")}</button></header>
<div id="mpSelection"><div class="mp-roster" role="group" aria-label="${tr("multiplayer.rosterLabel")}">${names.map(n=>`<button class="mp-fighter" data-fighter="${n}" aria-label="${esc(tr('multiplayer.chooseNamedFighter',{name:displayFighterName(n),style:style(n)}))}" aria-pressed="${n===fighter}"><div class="mp-fighter-art">${art(n)}</div><span class="mp-card-number" aria-hidden="true">${String(names.indexOf(n)+1).padStart(2,'0')}</span><div class="mp-fighter-label"><small class="mp-card-eyebrow">${tr("multiplayer.yourFighter")}</small><strong>${fighterLabel(n)}</strong><small>${style(n)}</small></div><div class="mp-card-stats">${stats(n)}</div>${window.BRAX_ROSTER.frame()}</button>`).join('')}</div><div class="mp-carousel-nav"><button id="mpPrevious" aria-label="${tr("multiplayer.previousFighter")}">‹</button><button id="mpFollowing" aria-label="${tr("multiplayer.nextFighter")}">›</button></div><footer class="mp-selection-footer"><button id="mpNext" class="destination-primary">${tr("multiplayer.select")}</button><span id="mpRosterHint">${tr("multiplayer.swipe")}<b aria-hidden="true">↔</b></span><span class="carousel-dots" aria-hidden="true">${names.map(()=>'<i></i>').join('')}</span><span id="mpPosition" role="status" aria-live="polite"></span></footer></div>
<div id="mpLobby" class="off"><aside class="mp-identity"><div id="mpChosenArt" class="mp-fighter-art"></div><div class="mp-fighter-label"><small>${tr("multiplayer.yourFighter")}</small><strong id="mpChosenName"></strong><span id="mpChosenPlayer" class="mp-player-name"></span></div><button id="mpChange">${tr("multiplayer.changeFighter")}</button></aside><div id="mpEntry"><article class="mp-room-option"><small>${tr("multiplayer.inviteStep")}</small><h2>${tr("multiplayer.createRoom")}</h2><p>${tr("multiplayer.codeHelp")}</p><label for="mpArena">${tr("multiplayer.hostArena")}</label><select id="mpArena">${Object.keys(window.BRAX_ARENA_VIDEOS||{}).map(k=>`<option value="${k}"${k==='snow'?' selected':''}>${document.getElementById('arena-'+k)?.querySelector('strong')?.textContent||k}</option>`).join('')}</select><button id="mpCreate" class="destination-primary">${tr("multiplayer.createRoomAction")}</button></article><article class="mp-room-option"><small>${tr("multiplayer.haveCode")}</small><h2>${tr("multiplayer.joinMatch")}</h2><label for="mpCode">${tr("multiplayer.otherPlayerCode")}</label><input id="mpCode" maxlength="8" inputmode="text" enterkeyhint="go" autocorrect="off" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${tr("code.enter")}"><button id="mpJoin" class="destination-primary">${tr("multiplayer.joinAction")}</button></article></div></div>
<div id="mpRoom" class="off"><div class="mp-versus"><div class="mp-contender"><div id="mpHostArt" class="mp-fighter-art"></div><div id="mpHostIdentity" class="mp-account-identity"><strong id="mpHostName"></strong><span id="mpHostFighter" class="mp-player-name"></span></div></div><div class="mp-versus-center"><small>${tr("multiplayer.internetMatchUpper")}</small><b>VS</b><span id="mpPlayers"></span><div class="mp-connecting"><div class="mp-loading-track" role="progressbar" aria-label="${tr("multiplayer.preparingConnection")}" aria-describedby="mpLoadingStage"><i></i></div><strong id="mpLoadingStage">${tr("multiplayer.waitingOpponent")}</strong></div></div><div class="mp-contender"><div id="mpGuestArt" class="mp-fighter-art"><span class="mp-waiting">?</span></div><div id="mpGuestIdentity" class="mp-account-identity"><strong id="mpGuestName">${tr("multiplayer.waitingOpponentUpper")}</strong><span id="mpGuestFighter" class="mp-player-name"></span></div></div></div><footer class="mp-room-footer"><div><small>${tr("multiplayer.shareRoomCode")}</small><strong id="mpRoomCode"></strong></div><button id="mpCopy">${tr("multiplayer.copyCode")}</button></footer></div>
<p id="mpStatus" role="status" aria-live="polite"></p>`;$('game').appendChild(panel);
const fighterCards=[...panel.querySelectorAll('[data-fighter]')],track=panel.querySelector('.mp-roster');
window.BRAX_ROSTER.layoutCarousel(track);
function choose(n){
 if(session||loading||!names.includes(n))return;
 fighter=n;const index=names.indexOf(n);
 fighterCards.forEach((card,i)=>{let delta=(i-index+names.length)%names.length;if(delta>names.length/2)delta-=names.length;
  card.style.setProperty('--offset',delta);card.classList.toggle('mp-focused',delta===0);card.classList.toggle('mp-neighbor',Math.abs(delta)===1);
  card.classList.toggle('mp-edge',Math.abs(delta)===2);
  card.setAttribute('aria-pressed',String(delta===0));card.setAttribute('aria-hidden',String(Math.abs(delta)>1));card.tabIndex=Math.abs(delta)<=1?0:-1;
 });
 $('mpPosition').textContent=String(index+1).padStart(2,'0')+' / '+String(names.length).padStart(2,'0');
 [...$('mpSelection').querySelector('.carousel-dots').children].forEach((dot,i)=>dot.classList.toggle('is-current',i===index));
 $('mpNext').setAttribute('aria-label',tr('multiplayer.selectNamedFighter',{name:displayFighterName(n)}));
}
for(const b of fighterCards)b.onclick=()=>{const browsing=b.classList.contains('mp-edge');choose(b.dataset.fighter);if(!browsing)$('mpNext').click();};
$('mpPrevious').onclick=()=>choose(names[(names.indexOf(fighter)+names.length-1)%names.length]);$('mpFollowing').onclick=()=>choose(names[(names.indexOf(fighter)+1)%names.length]);
window.BRAX_ROSTER.dragCarousel(track,fighterCards,direction=>choose(names[(names.indexOf(fighter)+direction+names.length)%names.length]),()=>loading||!!session);
$('mpSelection').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();e.stopPropagation();$(e.key==='ArrowLeft'?'mpPrevious':'mpFollowing').click();fighterCards[names.indexOf(fighter)].focus();});
choose(fighter);
function selection(){if(session||loading)return;$('mpSelection').classList.remove('off');$('mpLobby').classList.add('off');$('mpRoom').classList.add('off');$('mpTitle').textContent=tr("multiplayer.chooseFighter");note('');}
$('mpNext').onclick=()=>{if(selectionReturn){const c=selectionReturn;selectionReturn=null;panel.classList.add('off');window.BRAX_TOURNAMENTS.open(c);return;}$('mpChosenArt').innerHTML=art(fighter);$('mpChosenName').textContent=fighterLabel(fighter);syncChosenIdentity();$('mpSelection').classList.add('off');$('mpLobby').classList.remove('off');$('mpTitle').textContent=tr("multiplayer.inviteOpponent");note(tr("multiplayer.lobbyHelp"));};$('mpChange').onclick=selection;
let shownHost='',shownGuest='',entryAttempt=0,presentedPlayers=null;
function showPlayers(host,guest,hostName=session?.hostName||profileName,guestName=session?.guestName||tr("identity.guestUpper"),hostAvatar=session?.hostAvatar,guestAvatar=session?.guestAvatar){
 presentedPlayers=[host,guest,hostName,guestName,hostAvatar,guestAvatar];
 if(host&&host!==shownHost){$('mpHostArt').innerHTML=art(host);shownHost=host;}
 if(guest&&guest!==shownGuest){$('mpGuestArt').innerHTML=art(guest);shownGuest=guest;}
 $('mpHostName').textContent=hostName;$('mpHostFighter').textContent=displayFighterName(host);
 $('mpGuestName').textContent=guest?guestName:tr("multiplayer.waitingOpponentUpper");$('mpGuestFighter').textContent=displayFighterName(guest);
 for(const [side,playerName,avatar,exists]of [['Host',hostName,hostAvatar,!!(session?.hostPlayerId||host)],['Guest',guestName,guestAvatar,!!(session?.guestPlayerId||guest)]]){const box=$('mp'+side+'Identity');box.dataset.playerId=(side==='Host'?session?.hostPlayerId:session?.guestPlayerId)||'';let image=box.querySelector('.account-avatar');if(!exists){image?.remove();continue;}const src=window.BRAX_ONLINE.avatarUrl(avatar);if(!image){image=document.createElement('img');image.className='account-avatar';box.prepend(image);}if(image.getAttribute('src')!==src)image.src=src;image.alt=tr('identity.avatarName',{name:playerName});}
 $('mpPlayers').textContent=guest?tr("multiplayer.readyToConnect"):tr("multiplayer.waitingSecondPlayer");
}

const badge=document.createElement('div');badge.id='mpBadge';badge.className='off';badge.innerHTML=("<span id=\"mpConnection\"></span><button id=\"mpExit\">"+tr("multiplayer.leave")+"</button>");$('game').appendChild(badge);
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
let noteRender=()=>'',connectionRender=null;
const note=s=>{noteRender=L.renderer(s);$('mpStatus').textContent=s;if(session&&!playing)$('mpLoadingStage').textContent=s;};
async function api(body){body={...body,compat:window.BRAX_COMPAT};const began=performance.now();const c=new AbortController(),timeout=setTimeout(()=>c.abort(),5000);try{const r=await fetch('/api/duel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(Object.entries(body).filter(([key])=>!['rtc','rtcPromise','voiceDecision'].includes(key)))),signal:c.signal,credentials:'same-origin'});let data;try{data=await r.json();}catch{throw Error(tr("multiplayer.connectionFailed"));}if(!r.ok)throw Object.assign(Error(data.error||tr("multiplayer.connectionError")),{status:r.status,code:data.code,params:data.params,rawMessage:data.error});httpRtt=performance.now()-began;return data;}finally{clearTimeout(timeout);}}
function open(){panel.classList.remove('off');selection();profileName=window.BRAX_ONLINE?.name||tr("identity.guestUpper");syncChosenIdentity();}
button.onclick=open;
function activate(joined){
 $('mpResultBack').disabled=true;session=joined;session.rtc=window.BRAX_RTC.fallback;session.rtcPromise=window.BRAX_RTC.configure(joined).then(config=>{joined.rtc=config;return config;});ready=false;playing=false;reporting=false;terminalAt=0;resultStatus='';lastResultState=null;connectionRender=null;seq=received=eventId=0;events=[];held={};lastOK=performance.now();
 panel.classList.remove('off');$('mpSelection').classList.add('off');$('mpLobby').classList.add('off');$('mpTitle').textContent=tr("multiplayer.roomTitle");shownHost=shownGuest='';
 $('mpHostArt').innerHTML='<span class="mp-waiting">?</span>';
 $('mpGuestArt').innerHTML='<span class="mp-waiting">?</span>';$('mpGuestName').textContent=tr("multiplayer.waitingOpponentUpper");$('mpGuestFighter').textContent='';
 showPlayers(session.hostFighter||(session.role==='host'?fighter:null),session.guestFighter||(session.role==='guest'?fighter:null),session.hostName||profileName,session.guestName||profileName,session.hostAvatar,session.guestAvatar);
 $('mpRoom').classList.remove('off');$('mpRoomCode').textContent=session.code;note(session.tournamentCode?tr("multiplayer.connectingTournament"):session.role==='host'?tr("multiplayer.giveCode"):tr("multiplayer.joinedPreparing"));poll();
}
async function enter(action){
 if(session||loading)return;if(action==='join'&&!/^[A-F0-9]{8}$/.test($('mpCode').value.trim().toUpperCase())){note(tr("multiplayer.codeLength"));return;}
 $('mpCode').blur();panel.classList.remove('mp-code-entry');loading=true;const attempt=++entryAttempt;$('mpCreate').disabled=$('mpJoin').disabled=true;note(tr("multiplayer.savingConnecting"));
 try{profileName=(await window.BRAX_ONLINE.ensureProfile()).name;const joined=await api({action,fighter,...(action==='create'?{arena:$('mpArena').value}:{}),code:$('mpCode').value.trim().toUpperCase()});if(attempt!==entryAttempt){api({...joined,action:'leave'}).catch(()=>{});return;}activate(joined);}
 catch(e){if(attempt===entryAttempt)note(L.error(e));}finally{if(attempt===entryAttempt){loading=false;$('mpCreate').disabled=$('mpJoin').disabled=false;}}
}

window.BRAX_CODE_INPUT.attach($('mpCode'),{length:8,titleKey:'multiplayer.roomCode',onSubmit:()=>enter('join')});
$('mpCreate').onclick=()=>enter('create');$('mpJoin').onclick=()=>enter('join');$('mpCopy').onclick=async()=>{try{await navigator.clipboard.writeText(session.code);note(tr("multiplayer.copied"));}catch{note(tr('multiplayer.codeNotice',{code:session.code}));}};
async function leave(message=''){const old=session;++entryAttempt;$('mpOnlineResult').classList.add('off');session=null;lastResultState=null;connectionRender=null;clearTimeout(timer);clearInterval(directTimer);peer?.close();peer=null;window.BRAX_VOICE?.stop();held={};events=[];ready=false;playing=false;window.BRAX_MULTIPLAYER_ENGINE?.stop();badge.classList.add('off');panel.classList.toggle('off',!message);$('mpRoom').classList.add('off');loading=false;$('mpCreate').disabled=$('mpJoin').disabled=false;selection();note(message);if(old)api({...old,action:'leave'}).catch(()=>{});if(old?.tournamentCode&&window.BRAX_ONLINE.profile?.authenticated)window.BRAX_TOURNAMENTS?.open(old.tournamentCode);}
$('mpLeave').onclick=()=>{if(selectionReturn){const c=selectionReturn;selectionReturn=null;panel.classList.add('off');window.BRAX_TOURNAMENTS.open(c);}else leave();};$('mpExit').onclick=()=>leave();
async function poll(){const current=session;if(!current||polling)return;polling=true;urgent=false;const start=performance.now(),engine=window.BRAX_MULTIPLAYER_ENGINE;try{
 const body={code:current.code,token:current.token,role:current.role,action:'sync',ready,seq:++seq};if(ready&&current.role==='host')body.snapshot={...engine.snapshot(performance.now()-lastHttpKeyframe>=2000),signal:peer?.signal,voice:window.BRAX_VOICE?.signal};if(body.snapshot?.keyframe)lastHttpKeyframe=performance.now();if(ready&&current.role==='guest')body.input={held,events,visible:!document.hidden,signal:peer?.signal,voice:window.BRAX_VOICE?.signal};
 const r=await api(body);if(session!==current)return;lastOK=performance.now();
 if(r.status==='closed'){leave(tr("multiplayer.peerLeft"));return;}
 Object.assign(current,{hostName:r.hostName,guestName:r.guestName,hostAvatar:r.hostAvatar,guestAvatar:r.guestAvatar,hostPlayerId:r.hostPlayerId,guestPlayerId:r.guestPlayerId});showPlayers(r.hostFighter,r.guestFighter,r.hostName,r.guestName,r.hostAvatar,r.guestAvatar);if(r.scheduledAt>Date.now())note(L.dynamic(()=>tr('multiplayer.scheduledNotice',{time:new Date(r.scheduledAt).toLocaleTimeString(I.locale,{hour:'2-digit',minute:'2-digit'})})));
 if(r.guestFighter&&!ready&&!current.preparing){current.preparing=true;note(tr("multiplayer.loadingFighters"));(async()=>{try{if(!window.BRAX_ENGINE_READY)await window.BRAX_LOAD_MULTIPLAYER();if(session!==current)return;await window.BRAX_MULTIPLAYER_ENGINE.start(current.role,r);if(session!==current){window.BRAX_MULTIPLAYER_ENGINE.stop();return;}note(tr("multiplayer.connectingPlayers"));await current.rtcPromise;if(session!==current)return;lastOK=performance.now();lastOK=performance.now();note(tr("multiplayer.voiceConsent"));current.voiceDecision=window.BRAX_VOICE?.begin({host:current.role==='host',rtc:current.rtc,onSignal:requestSync});await current.voiceDecision;if(session!==current)return;lastOK=performance.now();ready=true;makePeer();note(tr("multiplayer.fighterReady"));}catch(e){leave(tr("multiplayer.matchLoadFailed"));}})();}
 if(ready){const signal=current.role==='host'?r.input?.signal:r.snapshot?.signal;peer?.accept(signal);window.BRAX_VOICE?.accept(current.role==='host'?r.input?.voice:r.snapshot?.voice);}
 if(ready&&r.status==='playing'){
  if(!playing){playing=true;panel.classList.add('off');badge.classList.remove('off');window.BRAX_MULTIPLAYER_ENGINE.go();}
  const stale=!peer?.alive&&r.now-r.peerSeen>2500;window.BRAX_MULTIPLAYER_ENGINE.connection(!stale);
  const state=current.role==='host'?body.snapshot?.state:r.snapshot?.state;if(state?.matchOver)finishResult(current,state);
  connectionRender=()=>state?.matchOver?(state.wins[0]===state.wins[1]?tr("multiplayer.draw"):((state.wins[0]>state.wins[1])===(current.role==='host')?tr("multiplayer.youWin"):tr("multiplayer.opponentWins")))+' · '+state.wins.join(':'):stale?tr("multiplayer.waitingConnection"):(current.role==='host'?tr("multiplayer.youLeft"):tr("multiplayer.youRight"))+(peer?.alive?' · '+(peer.route==='relay'?tr('multiplayer.relayTransport'):peer.route==='direct'?tr("multiplayer.direct"):tr('multiplayer.onlineTransport'))+(peer.rtt===null?'':' · '+Math.round(peer.rtt)+' ms'):tr("multiplayer.fallback")+Math.round(performance.now()-start)+' ms');$('mpConnection').textContent=L.dynamic(connectionRender);
  if(!state?.matchOver&&!peer?.alive&&r.now-r.peerSeen>20000){leave(tr("multiplayer.peerDisconnected"));return;}
  if(!peer?.alive&&r.seq>received){received=r.seq;if(current.role==='host'&&r.input)engine.input(r.input);if(current.role==='guest'&&r.snapshot){engine.receive(r.snapshot);events=events.filter(e=>e.id>r.snapshot.ack);}}
 }
}catch(e){if(session!==current)return;note(L.error(e));if(playing&&!peer?.alive){window.BRAX_MULTIPLAYER_ENGINE?.connection(false);connectionRender=()=>tr('multiplayer.reconnecting');$('mpConnection').textContent=connectionRender();}if(e.status===409&&(e.code==='build_mismatch'||e.code==='BUILD_MISMATCH'||e.code==='COMPAT_MISMATCH'||L.isLegacyMessage(e,'multiplayer.versionMismatch'))){leave(L.error(e));return;}if(e.status===404||e.status===403||(!peer?.alive&&performance.now()-lastOK>(current.preparing&&!ready?90000:20000))){leave(e.status===404?tr("multiplayer.roomClosed"):tr("multiplayer.connectionLost"));return;}}finally{polling=false;if(session&&session!==current)requestSync();}
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
const resultPanel=document.createElement('section');resultPanel.id='mpOnlineResult';resultPanel.className='off';resultPanel.setAttribute('aria-label',tr("multiplayer.resultLabel"));resultPanel.innerHTML=("<small>"+tr("multiplayer.resultHeading")+"</small><h2 id=\"mpResultTitle\"></h2><div id=\"mpResultIdentities\" class=\"mp-result-identities\"></div><p id=\"mpResultNames\"></p><strong id=\"mpResultScore\"></strong><p id=\"mpResultStatus\" role=\"status\"></p><button id=\"mpResultBack\" class=\"destination-primary\" disabled>"+tr("multiplayer.backToMultiplayer")+"</button><button id=\"mpResultReview\" class=\"off\">"+tr("multiplayer.reportUnconfirmed")+"</button>");$('game').appendChild(resultPanel);
$('mpResultBack').onclick=()=>leave();
$('mpResultReview').onclick=async()=>{if(!session)return;try{await api({...session,action:'review'});resultStatus='disputed';$('mpResultStatus').textContent=tr("multiplayer.organizerReview");$('mpResultBack').disabled=false;$('mpResultReview').classList.add('off');}catch(e){$('mpResultStatus').textContent=L.error(e);}};
async function finishResult(current,state,presentationOnly=false){
 if(!terminalAt)terminalAt=performance.now();if(performance.now()-terminalAt<2500)return;
 lastResultState=state;resultPanel.classList.remove('off');const win=state.wins[0]===state.wins[1]?-1:state.wins[0]>state.wins[1]?0:1;
 $('mpResultTitle').textContent=win<0?tr("multiplayer.draw"):tr('multiplayer.winner',{name:win===0?current.hostName:current.guestName});$('mpResultNames').textContent=current.hostName+' — '+current.guestName;$('mpResultScore').textContent=state.wins.join(' : ');$('mpResultBack').textContent=current.tournamentCode?tr("multiplayer.backToTournament"):tr("multiplayer.backToMultiplayer");
 const identities=$('mpResultIdentities'),signature=[current.hostPlayerId,current.guestPlayerId,current.hostAvatar,current.guestAvatar,current.hostName,current.guestName].join('|');if(identities.dataset.signature!==signature){identities.dataset.signature=signature;identities.innerHTML='<span data-player-id="'+esc(current.hostPlayerId)+'">'+identity(current.hostName,current.hostAvatar)+'</span><b>VS</b><span data-player-id="'+esc(current.guestPlayerId)+'">'+identity(current.guestName,current.guestAvatar)+'</span>';}
 if(presentationOnly||['confirmed','disputed'].includes(resultStatus))return;
 $('mpResultStatus').textContent=tr("multiplayer.savingResult");
 if(performance.now()-terminalAt>15000){if(current.tournamentCode)$('mpResultReview').classList.remove('off');else{$('mpResultBack').disabled=false;$('mpResultStatus').textContent=tr("multiplayer.unconfirmed");}}
 if(reporting)return;reporting=true;try{const r=await api({...current,action:'result',score:state.wins});if(session!==current)return;resultStatus=r.resultStatus;if(resultStatus==='confirmed'){$('mpResultStatus').textContent=win<0&&current.tournamentCode?tr("multiplayer.drawReplay"):tr("multiplayer.resultConfirmed");$('mpResultBack').disabled=false;$('mpResultReview').classList.add('off');if(current.tournamentCode)window.BRAX_TOURNAMENTS.finishedAsChampion(current.tournamentCode).then(champion=>{if(champion&&session===current)leave();}).catch(()=>{});}else if(resultStatus==='disputed'){$('mpResultStatus').textContent=tr("multiplayer.resultDisputed");$('mpResultBack').disabled=false;}}
 catch(e){if(session===current)$('mpResultStatus').textContent=L.dynamic(()=>tr('multiplayer.resultRetry',{error:L.error(e)}));}finally{reporting=false;}
}

window.addEventListener('brax:account',event=>{const p=event.detail?.profile;profileName=p?.name||tr("identity.guestUpper");syncChosenIdentity();if(session){const own=session.role==='host'?session.hostPlayerId:session.guestPlayerId;if(!p||own&&(p.id||p.playerId)!==own)leave();}});
I.onChange(()=>{L.refresh();syncChosenIdentity();for(const n of names){const card=panel.querySelector('[data-fighter="'+n+'"]');card.setAttribute('aria-label',tr('multiplayer.chooseNamedFighter',{name:displayFighterName(n),style:style(n)}));const copy=card.querySelector('.mp-fighter-label>small:last-child');if(copy)copy.textContent=style(n);}for(const option of $('mpArena').options)option.textContent=$('arena-'+option.value)?.querySelector('strong')?.textContent||option.value;if(session&&presentedPlayers)showPlayers(...presentedPlayers);note(noteRender());if(connectionRender&&session)$('mpConnection').textContent=connectionRender();if(session&&lastResultState)finishResult(session,lastResultState,true);});
window.BRAX_MULTIPLAYER={get active(){return!!session;},get role(){return session?.role;},get fighter(){return fighter;},get players(){return session?{host:{id:session.hostPlayerId,name:session.hostName,avatar:session.hostAvatar},guest:{id:session.guestPlayerId,name:session.guestName,avatar:session.guestAvatar}}:null;},art,leave,open,selectForTournament(code){if(session||loading)return;selectionReturn=code;open();},async enterTournament(joined,n){if(session)throw Error(tr("multiplayer.leaveFirst"));choose(n);const p=await window.BRAX_ONLINE.ensureProfile();if(!p.authenticated)throw Error(tr("tournament.signInPlay"));profileName=p.name;$('mpResultBack').disabled=true;activate(joined);}};
})();
