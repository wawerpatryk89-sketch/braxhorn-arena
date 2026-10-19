/* Shared, synchronous PL/EN presentation. Game IDs and user content stay unchanged. */
(()=>{
 'use strict';
 const supported=new Set(['pl','en']),storageKey='braxhorn.language',catalog=new Map(),legacy=new Map(),errorKeys=new Map(),listeners=new Set(),missingKeys=new Set();
 let language='pl',profile=null,identity=null,epoch=0,pendingEntryChoice=null,explicitPreference=null,saveRevision=0,saveQueue=Promise.resolve(),activeSave=null,observer=null;
 try{const saved=localStorage.getItem(storageKey);if(supported.has(saved))language=saved;}catch{}
 const locale=()=>language==='en'?'en-GB':'pl-PL';
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function pluralForm(value,params){
  if(typeof value==='function')return value(params);
  if(value&&typeof value==='object'){
   const count=Number(params.count??params.n??0),form=new Intl.PluralRules(locale()).select(count);
   return (count===0&&value.zero!==undefined?value.zero:value[form])??value.other??value.one??Object.values(value)[0]??'';
  }
  return value;
 }
 function t(key,params={}){
  const entry=catalog.get(key);
  if(!entry){missingKeys.add(key);return catalog.get('common.error.unavailable')?.[language]||'—';}
  let value=entry[language];
  if(value===undefined){missingKeys.add(language+':'+key);value=entry.pl??entry.en??'';}
  value=pluralForm(value,params);
  return String(value??'').replace(/\{([\w.]+)\}/g,(_,name)=>Object.prototype.hasOwnProperty.call(params,name)?String(params[name]??''):'');
 }
 function register(namespace,entries){
  for(const [key,value] of Object.entries(entries||{})){
   if(value&&typeof value==='object'&&('pl' in value||'en' in value))catalog.set(namespace?namespace+'.'+key:key,value);
   else if(value&&typeof value==='object')register(namespace?namespace+'.'+key:key,value);
  }
  if(document.readyState!=='loading')apply(document);
  return api;
 }
 function registerLegacy(entries){for(const [text,key] of Object.entries(entries||{}))legacy.set(text,key);return api;}
 function registerErrors(entries){for(const [code,key] of Object.entries(entries||{}))errorKeys.set(code,key);return api;}
 function translateText(value){const text=String(value??''),key=legacy.get(text);return key?t(key):text;}
 function error(value,fallbackKey='common.error.generic'){
  if(!value)return t(fallbackKey);
  const code=typeof value==='object'?value.code:null,params=typeof value==='object'?value.params||{}:{};
  const key=code&&(errorKeys.get(code)||(['common.error.','account.error.','online.error.'].map(prefix=>prefix+code).find(candidate=>catalog.has(candidate))));
  if(key)return t(key,params);
  const raw=typeof value==='string'?value:value.rawMessage||value.message||value.error||'',known=legacy.get(raw);
  return known?t(known,params):t(fallbackKey);
 }
 function parameters(node){try{return JSON.parse(node.getAttribute('data-i18n-params')||'{}');}catch{return{};}}
 function applyNode(node){
  const params=parameters(node),key=node.getAttribute('data-i18n');
  if(key&&catalog.has(key)){const next=t(key,params);if(node.textContent!==next)node.textContent=next;}
  else if(key)missingKeys.add(key);
  for(const attr of ['aria-label','title','placeholder','alt','data-pause-label','data-arena-hint']){
   const attrKey=node.getAttribute('data-i18n-'+attr);if(!attrKey)continue;
   if(!catalog.has(attrKey)){missingKeys.add(attrKey);continue;}const next=t(attrKey,params);if(node.getAttribute(attr)!==next)node.setAttribute(attr,next);
  }
  const bindings=node.getAttribute('data-i18n-attr');
  if(bindings)for(const binding of bindings.split(';')){const split=binding.indexOf(':');if(split<1)continue;const attr=binding.slice(0,split).trim(),attrKey=binding.slice(split+1).trim();if(!catalog.has(attrKey)){missingKeys.add(attrKey);continue;}const next=t(attrKey,params);if(node.getAttribute(attr)!==next)node.setAttribute(attr,next);}
 }
 const selector='[data-i18n],[data-i18n-attr],[data-i18n-aria-label],[data-i18n-title],[data-i18n-placeholder],[data-i18n-alt],[data-i18n-data-pause-label],[data-i18n-data-arena-hint]';
 function apply(root=document){if(root.nodeType===1&&root.matches(selector))applyNode(root);root.querySelectorAll?.(selector).forEach(applyNode);syncSwitches();}
 function bind(node,key,params={},attribute='textContent'){
  if(attribute==='textContent')node.dataset.i18n=key;else node.setAttribute('data-i18n-'+attribute,key);
  node.setAttribute('data-i18n-params',JSON.stringify(params));applyNode(node);return node;
 }
 function persistLocal(){try{localStorage.setItem(storageKey,language);}catch{}}
 function renderLanguage(source){
  document.documentElement.lang=language;document.documentElement.dataset.language=language;apply(document);
  const detail={language,locale:locale(),source};
  for(const listener of [...listeners]){try{listener(detail);}catch(failure){console.error('Language render failed',failure);}}
  window.dispatchEvent(new CustomEvent('brax:language',{detail}));
 }
 function saveLanguage(target){
  const expectedIdentity=identity,expectedEpoch=epoch,revision=++saveRevision;
  const operation=async()=>{
   if(!profile?.authenticated||expectedIdentity!==identity||expectedEpoch!==epoch)return false;
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);activeSave={controller,identity:expectedIdentity,language:target};
   try{
    const response=await fetch('/api/account?action=language',{method:'POST',credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({language:target})});
    let result;try{result=await response.json();}catch{throw new Error('Invalid server response');}
    if(!response.ok){const failure=new Error(result.error||'Language save failed');failure.code=result.code;failure.params=result.params;throw failure;}
    if(expectedIdentity!==identity||expectedEpoch!==epoch)return false;
    const currentPreference=explicitPreference?.identity===identity?explicitPreference.language:target;
    if(profile)profile.language=currentPreference;
    if(window.BRAX_ACCOUNT?.profile&&window.BRAX_ACCOUNT.profile===profile)window.BRAX_ACCOUNT.profile.language=currentPreference;
    window.dispatchEvent(new CustomEvent('brax:language-saved',{detail:{language:target,profile:result.player||profile}}));return true;
   }catch(failure){
    if(expectedIdentity!==identity||expectedEpoch!==epoch)return false;
    if(revision===saveRevision){const message=t('common.language.saveFailed');window.dispatchEvent(new CustomEvent('brax:language-error',{detail:{language:target,error:failure,message}}));showLanguageStatus(message);}
    return false;
   }finally{clearTimeout(timer);if(activeSave?.controller===controller)activeSave=null;}
  };
  saveQueue=saveQueue.catch(()=>false).then(operation);return saveQueue;
 }
 function setLanguage(next,options={}){
  if(!supported.has(next))throw new RangeError('Unsupported language');
  const changed=language!==next;language=next;persistLocal();
  if(options.explicit&&!profile?.authenticated)pendingEntryChoice=next;
  if(options.explicit&&profile?.authenticated){profile.language=next;explicitPreference={identity,language:next};}
  if(changed)renderLanguage(options.explicit?'explicit':'profile');else syncSwitches();
  return options.explicit&&profile?.authenticated?saveLanguage(next):Promise.resolve(true);
 }
 function syncProfile(next){
  const previousIdentity=identity,newIdentity=next?.authenticated?String(next.id??next.playerId??next.name??'authenticated'):null;
  if(previousIdentity!==newIdentity){epoch++;activeSave?.controller.abort();activeSave=null;explicitPreference=null;identity=newIdentity;}
  profile=next||null;
  if(!profile?.authenticated){if(previousIdentity)pendingEntryChoice=null;return Promise.resolve(true);}
  if(pendingEntryChoice){const selected=pendingEntryChoice;pendingEntryChoice=null;profile.language=selected;explicitPreference={identity,language:selected};setLanguage(selected);return saveLanguage(selected);}
  // Avatar/password requests may finish with a profile captured before the language POST.
  // Keep this session's explicit choice until a different account is selected.
  if(explicitPreference?.identity===identity){profile.language=explicitPreference.language;return setLanguage(explicitPreference.language);}
  if(activeSave?.identity===identity)return Promise.resolve(true);
  return setLanguage(supported.has(profile.language)?profile.language:'pl');
 }
 function languageFlag(lang){
  const flag=lang==='pl'?'<path fill="#fff" d="M0 0h60v20H0z"/><path fill="#dc2344" d="M0 20h60v20H0z"/>':'<path fill="#172d56" d="M0 0h60v40H0z"/><path stroke="#fff" stroke-width="8" d="m0 0 60 40M60 0 0 40"/><path fill="#ce2842" d="M0 0v3l25.5 17H30L0 0zM60 0h-4.5L30 17v3L60 0zM60 40v-3L34.5 20H30L60 40zM0 40h4.5L30 23v-3L0 40z"/><path stroke="#fff" stroke-width="13" d="M30 0v40M0 20h60"/><path stroke="#ce2842" stroke-width="7" d="M30 0v40M0 20h60"/>';
  return '<span class="brax-language-flag" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" aria-hidden="true" focusable="false">'+flag+'</svg></span>';
 }
 function makeSwitch(){
  const group=document.createElement('div');group.className='brax-language-switch';group.dataset.languageSwitch='';group.setAttribute('role','group');group.setAttribute('data-i18n-aria-label','common.language.label');
  for(const lang of ['pl','en']){const button=document.createElement('button');button.type='button';button.dataset.language=lang;button.lang=lang;button.setAttribute('aria-label',lang==='pl'?'Polski':'English');group.append(button);}
  return group;
 }
 function mountSwitches(){
  for(const id of ['accountEntry','accountRegister','accountCrop','accountProfile']){
   const root=document.getElementById(id);if(!root||root.querySelector('[data-language-switch]'))continue;
   const control=makeSwitch();
   if(id==='accountEntry'){control.classList.add('brax-language-entry');root.append(control);}
   else{const heading=root.querySelector('.account-photo-heading,.account-profile-header');control.classList.add('brax-language-modal');if(heading)heading.insertBefore(control,heading.querySelector('.account-close'));else root.append(control);}
  }
  syncSwitches();
 }
 function syncSwitches(){
  document.querySelectorAll('[data-language-switch]').forEach(group=>{group.setAttribute('aria-label',catalog.has('common.language.label')?t('common.language.label'):'Language');group.querySelectorAll('[data-language]').forEach(button=>{const lang=button.dataset.language;if(button.dataset.flagLanguage!==lang){button.innerHTML=languageFlag(lang);button.dataset.flagLanguage=lang;button.title=lang==='pl'?'Polski':'English';}button.setAttribute('aria-pressed',String(lang===language));});});
 }
 function showLanguageStatus(message){let status=document.getElementById('braxLanguageStatus');if(!status){status=document.createElement('p');status.id='braxLanguageStatus';status.className='brax-language-status';status.setAttribute('role','status');document.body.append(status);}status.textContent=message;status.hidden=false;clearTimeout(showLanguageStatus.timer);showLanguageStatus.timer=setTimeout(()=>status.hidden=true,7000);}
 function date(value,options={}){const parsed=value instanceof Date?value:new Date(value);return Number.isNaN(parsed.getTime())?'—':new Intl.DateTimeFormat(locale(),{day:'numeric',month:'short',year:'numeric',...options}).format(parsed);}
 function time(value,options={}){const parsed=value instanceof Date?value:new Date(value);return Number.isNaN(parsed.getTime())?'—':new Intl.DateTimeFormat(locale(),{hour:'2-digit',minute:'2-digit',...options}).format(parsed);}
 function number(value,options={}){return new Intl.NumberFormat(locale(),options).format(value);}
 function duration(value,options={}){const seconds=Math.max(0,Math.floor(Number(value)||0)),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60),rest=seconds%60;if(options.style==='long')return [hours?new Intl.NumberFormat(locale(),{style:'unit',unit:'hour',unitDisplay:'long'}).format(hours):'',minutes?new Intl.NumberFormat(locale(),{style:'unit',unit:'minute',unitDisplay:'long'}).format(minutes):'',rest||(!hours&&!minutes)?new Intl.NumberFormat(locale(),{style:'unit',unit:'second',unitDisplay:'long'}).format(rest):''].filter(Boolean).join(' ');return hours?hours+':'+String(minutes).padStart(2,'0')+':'+String(rest).padStart(2,'0'):minutes+':'+String(rest).padStart(2,'0');}
 const api={get language(){return language;},get locale(){return locale();},get profile(){return profile;},get ready(){return Promise.resolve(language);},t,h:(key,params)=>escape(t(key,params)),escape,register,registerLegacy,registerErrors,translateText,error,message:error,apply,bind,setLanguage,syncProfile,onChange(listener){listeners.add(listener);return()=>listeners.delete(listener);},plural:(key,count,params={})=>t(key,{...params,count}),date,time,number,duration,formatDate:date,formatTime:time,formatNumber:number,formatDuration:duration,missingKeys,get keys(){return [...catalog.keys()];},get catalog(){return Object.fromEntries(catalog);},mountSwitches};
 window.BRAX_I18N=api;
 window.addEventListener('brax:account',event=>syncProfile(event.detail?.profile));
 window.addEventListener('brax:account-open',()=>mountSwitches());
 document.addEventListener('click',event=>{const button=event.target.closest?.('[data-language-switch] [data-language]');if(!button)return;event.preventDefault();setLanguage(button.dataset.language,{explicit:true});});
 function init(){document.documentElement.lang=language;document.documentElement.dataset.language=language;apply(document);mountSwitches();observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)apply(node);mountSwitches();});observer.observe(document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
