/* Account identity comes from the server; local progress is only a per-player cache. */
(()=>{
'use strict';
const I=window.BRAX_I18N,L=window.BRAX_ONLINE_I18N,tr=(key,params)=>L.t(key,params);
const F=window.BRAX_FEATURES,base=F.createProgress,instances=[],cache={fighters:{},authenticated:false,name:'',avatar:'/assets/avatar-male.jpg'};
const DEFAULT_AVATAR='/assets/avatar-male.jpg',pendingKey='braxhorn.online.pending.accounts.v1';
let boardView=null,historyRows=null,historyIdentity=null;
let serial=Promise.resolve(),current=null,status=tr("ranking.connecting"),pending=[],activeId=null,boardRequest=0;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const profile=()=>window.BRAX_ACCOUNT?.profile||((cache.id||cache.playerId)?cache:null);
const playerId=p=>p?.id||p?.playerId||null;
const avatarUrl=value=>typeof value==='string'&&/^\/(?!\/)(?:assets\/|api\/)/.test(value)?value:DEFAULT_AVATAR;
const avatarMarkup=(p={},className='account-avatar')=>'<img class="'+escape(className)+'" src="'+escape(avatarUrl(p?.avatar))+'" alt="'+escape(tr('identity.avatarName',{name:p?.name||tr('identity.guest')}))+'" loading="lazy" decoding="async">';
async function api(action,body,params=''){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{const r=await fetch('/api/arena?action='+action+params,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,credentials:'same-origin',signal:controller.signal});const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error||tr("ranking.unavailable")),{status:r.status,code:data.code,params:data.params,rawMessage:data.error});return data;}finally{clearTimeout(timer);}
}
let renderStatus=L.renderer(status);
function show(message){status=message;renderStatus=L.renderer(message);const el=document.getElementById('onlineSaveStatus');if(el)el.textContent=status;}
function persist(){try{const all=JSON.parse(localStorage.getItem(pendingKey)||'{}');if(activeId)all[activeId]=pending.slice(-30);localStorage.setItem(pendingKey,JSON.stringify(all));}catch{}}
function identityChanged(p){
 const id=playerId(p);
 if(id!==activeId){boardView=null;historyRows=null;historyIdentity=null;persist();activeId=id;current=null;cache.fighters={};pending=[];if(p?.authenticated&&id)try{pending=(JSON.parse(localStorage.getItem(pendingKey)||'{}')[id]||[]).filter(item=>item.playerId===id).slice(-30);}catch{}}
 Object.assign(cache,{id,playerId:id,name:p?.name||'',avatar:avatarUrl(p?.avatar),authenticated:!!p?.authenticated,isOwner:!!p?.isOwner,hasPassword:!!p?.hasPassword});
 if(!p?.authenticated){pending=[];persist();show(tr("ranking.guest"));}
 for(const instance of instances)instance.sync();
}
async function ensureProfile(){
 if(window.BRAX_ACCOUNT)await window.BRAX_ACCOUNT.ready;
 const p=window.BRAX_ACCOUNT?.profile||await api('me');identityChanged(p);
 return{...p,avatar:avatarUrl(p?.avatar)};
}
async function flush(){
 const p=profile(),id=playerId(p);if(!p?.authenticated||!id||id!==activeId)return;
 while(pending.length){const item=pending[0];if(item.playerId!==id){pending.shift();persist();continue;}try{await api(item.action,item.body);if(playerId(profile())!==id)return;pending.shift();persist();show(tr("ranking.saved"));}catch(e){if(playerId(profile())!==id)return;if(e.status>=400&&e.status<500&&e.status!==429){pending.shift();persist();show(L.dynamic(()=>tr('ranking.resultRejected',{error:L.error(e)})));continue;}show(L.dynamic(()=>tr('ranking.resultPending',{error:L.error(e)})));break;}}
}
async function refresh(){
 try{const p=await ensureProfile();if(!p.authenticated)return;const id=playerId(p),data=await api('me');if(playerId(profile())!==id)return;Object.assign(cache,data);show(pending.length?tr("ranking.retryPending"):tr("ranking.connected"));}
 catch{show(tr("ranking.offlineNote"));}
}
F.createProgress=storage=>{
 let local,id;const sync=()=>{const p=profile(),next=playerId(p)||'signed-out';if(next!==id){id=next;const scoped=storage?{getItem:key=>storage.getItem(key+':account:'+id),setItem:(key,value)=>storage.setItem(key+':account:'+id,value)}:undefined;local=base(scoped);}if(p?.name&&local.name!==p.name)local.setName(p.name);};sync();
 const instance={sync};instances.push(instance);
 return new Proxy({}, {get(_target,key){sync();if(key==='name')return profile()?.name||'';if(key==='setName'||key==='localSetName')return value=>!!profile()?.name&&value===profile().name&&local.setName(value);if(key==='fighter')return n=>{sync();const l=local.fighter(n),r=cache.authenticated&&cache.fighters[n];return r?{wins:Math.max(l.wins,r.wins),bestSurvival:Math.max(l.bestSurvival,r.bestSurvival),challenges:[...new Set([...l.challenges,...r.challenges])]}:l;};const value=local[key];return typeof value==='function'?value.bind(local):value;}});
};
function start(body){
 const session={promise:null,playerId:null};current=session;
 session.promise=serial=serial.catch(()=>{}).then(async()=>{const p=await ensureProfile();if(current!==session||!p.authenticated)return null;session.playerId=playerId(p);await flush();if(playerId(profile())!==session.playerId)return null;const result=await api('start',body);show(tr("ranking.matchConnected"));return result.match;}).catch(e=>{show(L.dynamic(()=>tr('ranking.matchNotConnected',{error:L.error(e)})));return null;});
}
function submit(action,body){
 const session=current;if(!session)return;
 serial=serial.catch(()=>{}).then(async()=>{const match=await session.promise,p=profile();if(!match||!p?.authenticated||session.playerId!==playerId(p))return;pending.push({playerId:session.playerId,action,body:{...body,match}});persist();await flush();});
}
const time=ms=>Math.floor(ms/60000)+':'+String(Math.floor(ms/1000)%60).padStart(2,'0');
async function history(document){
 const target=document.getElementById('onlineHistory');if(!target)return;
 if(!profile()?.authenticated){target.innerHTML=("<p>"+tr("history.signIn")+"</p>");return;}
 const id=playerId(profile());target.innerHTML=("<p role=\"status\">"+tr("history.loading")+"</p>");
 try{const data=await api('history');if(playerId(profile())!==id)return;historyRows=data;historyIdentity=id;renderHistory(target,data,id);}catch(e){target.textContent=L.error(e);}
}
function renderHistory(target,data,id){target.innerHTML=data.rows?.length?data.rows.map(r=>{const online=r.kind==='online',other=r.opponentName||(r.ownRole==='host'?r.guestName:r.hostName),score=Array.isArray(r.score)?r.score.join(' : '):String(r.score??'—');return'<article class="ui-history-row" data-player-id="'+escape(r.playerId||id)+'">'+avatarMarkup(r)+'<span><strong>'+escape(r.name||profile().name)+'</strong><small>'+escape(online?tr('identity.versus',{name:other||tr('identity.opponent')}):tr('history.mode.'+(['arcade','tournament','survival','versus'].includes(r.mode)?r.mode:r.mode?.startsWith('challenge')?'challenge':'match')))+' · '+new Date(r.created).toLocaleDateString(I.locale)+'</small></span>'+(online?avatarMarkup({name:other,avatar:r.opponentAvatar}):'')+'<b>'+escape(score)+'</b></article>';}).join(''):("<p>"+tr("history.empty")+"</p>");L.bind(target);}
async function leaderboard(document,progress,cached=null){
 const $=id=>document.getElementById(id),mode=$('recordsMode').value,difficulty=$('recordsDifficulty').value,request=++boardRequest;
 $('rankingNote').textContent=tr("ranking.loading");$('leaderboard').innerHTML=("<div aria-label=\""+tr("ranking.loadingLabel")+"\" role=\"status\"><div class=\"ui-skeleton\"></div><div class=\"ui-skeleton\"></div><div class=\"ui-skeleton\"></div></div>");
 let box=$('onlineProfile');if(!box){box=document.createElement('div');box.id='onlineProfile';box.className='online-profile';$('recordsTools').prepend(box);}
 box.innerHTML='<span id="onlineSaveStatus">'+escape(status)+'</span><button id="onlineAccount" type="button">'+(profile()?.authenticated?tr("account.profile"):tr("account.signIn"))+("</button><button id=\"retryOnline\" type=\"button\">"+tr("ranking.refresh")+"</button>");
 $('onlineAccount').onclick=()=>profile()?.authenticated?window.BRAX_ACCOUNT?.openProfile():window.BRAX_ACCOUNT?.show();
 $('retryOnline').onclick=async()=>{await flush();await refresh();leaderboard(document,progress);};
 let historyBox=$('onlineHistorySection');if(!historyBox){historyBox=document.createElement('details');historyBox.id='onlineHistorySection';historyBox.className='ui-history';historyBox.innerHTML=("<summary>"+tr("history.title")+"</summary><div id=\"onlineHistory\"></div>");$('featureRecords').after(historyBox);historyBox.addEventListener('toggle',()=>{if(historyBox.open)history(document);});}
 try{if(!cached)await ensureProfile();const data=cached||await api('board',null,'&mode='+encodeURIComponent(mode)+'&difficulty='+difficulty);if(request!==boardRequest)return;boardView={document,progress,data,mode,difficulty};
 const result=r=>mode==='survival'?tr('ranking.winCount',{count:r.score}):mode==='arcade'?r.score+'/'+(r.targetWins||5)+' · '+(r.completed?tr("ranking.completedLower"):tr("ranking.streak")):mode==='tournament'?tr('ranking.resultTournament',{count:r.score,status:r.completed?tr('ranking.champion'):tr('ranking.streak')}):mode.startsWith('challenge:')?tr("ranking.completed"):tr('ranking.roundAdvantage',{count:r.score});
 $('rankingNote').textContent=tr('ranking.note',{status:!profile()?.authenticated?tr('ranking.guestNote'):data.own?tr('ranking.rank',{rank:data.own.rank}):tr('ranking.noOwnResult')});
 const rows=data.own&&data.own.rank>100?[...data.rows,data.own]:data.rows;
 const row=r=>'<article class="ui-rank-row '+(r.own?'own':'')+'" data-player-id="'+escape(r.playerId)+'" aria-label="'+escape(tr('ranking.rankLabel',{rank:r.rank}))+'"><b>'+r.rank+'</b>'+avatarMarkup(r)+'<strong>'+escape(r.name)+(r.own?tr("identity.youSuffix"):'')+'</strong><span>'+result(r)+'</span><time>'+time(r.elapsed)+'</time></article>';
 $('leaderboard').innerHTML=rows.length?'<div class="ui-podium">'+rows.filter(r=>r.rank<=3).map(row).join('')+'</div><div class="ui-ranking-list">'+rows.filter(r=>r.rank>3).map(row).join('')+'</div>':("<div class=\"ui-empty\"><b aria-hidden=\"true\">♜</b><h3>"+tr("ranking.emptyTitle")+"</h3><p>"+tr("ranking.emptyText")+"</p></div>");
 $('rankingNote').title=tr("ranking.tieBreak");$('recordsTools').classList.remove('ui-offline');window.BRAX_UI?.pinOwnRanking(data.own,result,time);
 if(!cached)await refresh();if(request!==boardRequest)return;$('featureRecords').innerHTML=F.records(progress);if(historyBox.open&&!cached)history(document);L.bind($('recordsTools'));L.bind($('leaderboard'));
 }catch(e){if(request!==boardRequest)return;$('recordsTools').classList.add('ui-offline');$('rankingNote').textContent=tr("ranking.offline");$('leaderboard').innerHTML='<p>'+escape(L.error(e))+("<br>"+tr("ranking.retryHelp")+"</p>");}
}
async function saveName(name){const p=await ensureProfile();if(name!==p.name)throw Error(tr("account.fixedNickname"));return p.name;}
window.BRAX_ONLINE={ensureProfile,saveName,avatarMarkup,avatarUrl,get profile(){return profile();},get name(){return profile()?.name||tr("identity.guestUpper");},get avatar(){return avatarUrl(profile()?.avatar);},start,finish:body=>submit('finish',{...body,elapsed:Math.round(body.elapsed),hp:Math.round(body.hp)}),challenge:(challenge,elapsed,count)=>submit('challenge',{challenge,elapsed:Math.round(elapsed),count}),leaderboard,history,best:async level=>{try{await ensureProfile();const b=await api('board',null,'&mode=survival&difficulty='+level);return{level,row:b.rows[0],own:b.own};}catch{return{level,error:true};}}};
window.addEventListener('brax:account',event=>{identityChanged(event.detail?.profile);++boardRequest;const target=document.getElementById('onlineHistory');if(target)target.replaceChildren();if(event.detail?.profile?.authenticated)refresh();});
I.onChange(()=>{status=renderStatus();const statusNode=document.getElementById('onlineSaveStatus');if(statusNode)statusNode.textContent=status;if(boardView&&document.getElementById('recordsMode').value===boardView.mode&&document.getElementById('recordsDifficulty').value===boardView.difficulty)leaderboard(boardView.document,boardView.progress,boardView.data);if(historyRows&&historyIdentity===playerId(profile())){const target=document.getElementById('onlineHistory');if(target)renderHistory(target,historyRows,historyIdentity);}});
window.addEventListener('online',()=>{serial=serial.catch(()=>{}).then(flush);});refresh();
})();
