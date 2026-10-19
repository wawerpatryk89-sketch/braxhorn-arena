/* One server-backed account, one entry screen. No credentials or player IDs are stored locally. */
(()=>{
 'use strict';
 const I=window.BRAX_I18N,t=(key,params)=>I.t('account.'+key,params);
 const copy=key=>'data-account-i18n="'+key+'"';
 const attr=(name,key)=>'data-account-i18n-'+name+'="'+key+'"';
 const text=key=>'<span '+copy(key)+'></span>';
 const keyedError=key=>Object.assign(new Error(t(key)),{accountKey:key});
 const message=value=>!value?'':typeof value==='string'?t(value):value.accountKey?t(value.accountKey):(I.message||I.error).call(I,value,'account.error.save');
 const messages={entry:'',register:'',profile:'',camera:''};
 const PRESETS={male:'/assets/avatar-male.jpg',female:'/assets/avatar-female.jpg'},SIZE=384;
 const icons={user:'<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-8 9v-3c0-3 3-5 8-5s8 2 8 5v3H4Z"/>',lock:'<path d="M7 10V7a5 5 0 0 1 10 0v3h2v12H5V10h2Zm2 0h6V7a3 3 0 0 0-6 0v3Zm2 4v4h2v-4h-2Z"/>',photo:'<path d="M3 3h18v18H3V3Zm2 2v10l4-4 4 4 3-3 3 3V5H5Zm0 13v1h14v-1l-3-3-3 3-4-4-4 4Zm10-9a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/>',camera:'<path d="m8 3-2 3H2v15h20V6h-4l-2-3H8Zm1 2h6l2 3h3v11H4V8h3l2-3Zm3 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/>',trophy:'<path d="M6 2h12v3h4v5c0 3-2 5-5 5-1 2-2 3-4 3v3h4v2H7v-2h4v-3c-2 0-4-1-5-3-3 0-5-2-5-5V5h5V2Zm12 5v5c1 0 2-1 2-2V7h-2ZM3 7v3c0 1 1 2 2 2V7H3Z"/>'};
 const svg=(name,cls='')=>'<svg class="'+cls+'" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">'+icons[name]+'</svg>';
 const presetButtons=prefix=>`<div class="account-avatar-choices" role="group" ${attr('aria-label','avatar.choose')}><button id="${prefix}AvatarMale" class="account-avatar-choice" type="button" data-avatar="male" ${attr('aria-label','avatar.maleLabel')} aria-pressed="true"><img src="${PRESETS.male}" ${attr('alt','avatar.maleAlt')}>${text('avatar.male')}</button><button id="${prefix}AvatarFemale" class="account-avatar-choice" type="button" data-avatar="female" ${attr('aria-label','avatar.femaleLabel')} aria-pressed="false"><img src="${PRESETS.female}" ${attr('alt','avatar.femaleAlt')}>${text('avatar.female')}</button><button id="${prefix}Upload" class="account-avatar-choice" type="button" data-avatar="upload" ${attr('aria-label','avatar.uploadLabel')}>${svg('photo')}${text('avatar.photo')}</button><button id="${prefix}Selfie" class="account-avatar-choice" type="button" data-avatar="selfie" ${attr('aria-label','avatar.selfieLabel')}>${svg('camera')}${text('avatar.selfie')}</button></div>`;
 let profile=null,mode='login',busy=false,profileBusy=false,pendingRegistration=false,restoreFocus=null;
 const choices={entry:{kind:'male',blob:null,url:PRESETS.male},profile:{kind:'male',blob:null,url:PRESETS.male}};
 let editor=null,cameraStream=null,cameraSequence=0,uploadContext='entry';
 const $=id=>document.getElementById(id);
 function makeUI(){
  const entry=document.createElement('section');entry.id='accountEntry';entry.dataset.mode='login';entry.setAttribute('data-account-i18n-aria-label','entry.label');
  entry.innerHTML=`<img class="account-reference" src="/assets/account-login-reference.jpg" ${attr('alt','entry.artAlt')} draggable="false"><div class="account-veil" aria-hidden="true"></div><div class="account-panel"><div class="account-tabs" role="tablist" ${attr('aria-label','entry.tabs')}><button id="accountLoginTab" type="button" role="tab" aria-selected="true" aria-controls="accountForm" ${copy('login')}></button><button id="accountRegisterTab" type="button" role="tab" aria-selected="false" aria-controls="accountForm" ${copy('register')}></button></div><form id="accountForm" class="account-form" novalidate><div class="account-fields"><label class="account-field">${svg('user')}<span class="account-sr-only" ${copy('field.nick')}></span><input id="accountNick" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" minlength="2" ${attr('placeholder','field.nick')} required></label><label class="account-field">${svg('lock')}<span class="account-sr-only" ${copy('field.password')}></span><input id="accountPassword" name="password" type="password" autocomplete="current-password" minlength="8" maxlength="128" ${attr('placeholder','field.password')} required></label></div><button id="accountSubmit" class="account-primary" type="submit"></button></form><button id="accountGuest" class="account-guest" type="button" ${copy('guest')}></button><div class="account-feedback"><span id="accountNoteIcon">${svg('trophy','account-trophy')}</span><p id="accountNote" class="account-note" ${copy('entry.note')}></p><p id="accountError" role="alert" aria-live="assertive" hidden></p></div></div><button id="accountLegacy" class="account-legacy" type="button" ${copy('entry.legacy')}></button>`;
  const sourceMask=document.createElement('div');sourceMask.className='account-source-mask';sourceMask.setAttribute('aria-hidden','true');entry.querySelector('.account-reference').after(sourceMask);
  document.body.append(entry);
  const register=document.createElement('section');register.id='accountRegister';register.hidden=true;register.setAttribute('role','dialog');register.setAttribute('aria-modal','true');register.setAttribute('aria-labelledby','accountRegisterTitle');
  register.innerHTML=`<div class="account-register-panel"><div class="account-photo-heading"><h2 id="accountRegisterTitle" ${copy('register')}></h2><button id="accountRegisterClose" class="account-close" type="button" ${attr('aria-label','register.close')}>×</button></div><form id="accountRegisterForm" class="account-register-form" novalidate><div class="account-register-fields"><label class="account-field account-register-nick">${svg('user')}<span class="account-sr-only" ${copy('field.nick')}></span><input id="accountRegisterNick" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" minlength="2" ${attr('placeholder','field.nick')} required></label><label class="account-field">${svg('lock')}<span class="account-sr-only" ${copy('field.passwordMinimum')}></span><input id="accountRegisterPassword" name="new-password" type="password" autocomplete="new-password" minlength="8" maxlength="128" ${attr('placeholder','field.password')} required></label><label class="account-field">${svg('lock')}<span class="account-sr-only" ${copy('field.repeatPassword')}></span><input id="accountRegisterRepeat" name="repeat-password" type="password" autocomplete="new-password" minlength="8" maxlength="128" ${attr('placeholder','field.repeatPassword')} required></label></div><div class="account-register-avatar"><h3 ${copy('register.avatar')}></h3><div id="accountAvatarOptions">${presetButtons('account')}</div></div><button id="accountRegisterSubmit" class="account-primary" type="submit"></button><p id="accountRegisterError" role="alert" aria-live="assertive" hidden></p></form></div>`;
  document.body.append(register);
  const dialog=document.createElement('section');dialog.id='accountProfile';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','accountProfileName');
  dialog.innerHTML=`<div class="account-profile-panel"><div class="account-profile-header"><img id="accountProfileAvatar" src="${PRESETS.male}" ${attr('alt','profile.avatar')}><div class="account-profile-title"><small ${copy('profile.title')}></small><h2 id="accountProfileName"></h2></div><button id="accountProfileClose" class="account-close" type="button" ${attr('aria-label','profile.close')}>×</button></div><div class="account-profile-section"><h3 ${copy('profile.avatar')}></h3>${presetButtons('accountProfile')}<button id="accountProfileSave" class="account-primary" type="button" ${copy('profile.saveAvatar')}></button></div><form id="accountPasswordForm" class="account-profile-section" novalidate><h3 id="accountPasswordHeading" ${copy('profile.passwordHeading')}></h3><div id="accountProfilePasswordFields" class="account-password-fields"><label id="accountCurrentPasswordLabel"><span class="account-sr-only" ${copy('field.currentPassword')}></span><input id="accountProfileCurrentPassword" type="password" autocomplete="current-password" maxlength="128" ${attr('placeholder','field.currentPassword')}></label><label><span class="account-sr-only" ${copy('field.newPasswordMinimum')}></span><input id="accountProfilePassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" ${attr('placeholder','field.newPassword')}></label></div><button id="accountPasswordSave" type="submit" ${copy('profile.savePassword')}></button></form><p id="accountProfileMessage" class="account-profile-message" role="status" aria-live="polite"></p><button id="accountLogout" type="button" ${copy('profile.logout')}></button></div>`;
  document.body.append(dialog);
  const crop=document.createElement('section');crop.id='accountCrop';crop.hidden=true;crop.setAttribute('role','dialog');crop.setAttribute('aria-modal','true');crop.setAttribute('aria-labelledby','accountCropTitle');
  crop.innerHTML=`<div class="account-photo-panel"><div class="account-photo-heading"><div style="flex:1"><h2 id="accountCropTitle"></h2><p id="accountCropHelp" ${copy('crop.help')}></p></div><button id="accountCropClose" class="account-close" type="button" ${attr('aria-label','crop.close')}>×</button></div><div class="account-photo-workspace"><canvas id="accountCropCanvas" width="384" height="384" ${attr('aria-label','crop.canvasLabel')}></canvas><video id="accountCameraVideo" autoplay muted playsinline hidden></video></div><p id="accountCameraMessage" class="account-camera-message" role="status" hidden></p><label id="accountCropZoomLabel" class="account-photo-zoom">${text('crop.zoom')}<input id="accountCropZoom" type="range" min="1" max="4" step="0.01" value="1" ${attr('aria-label','crop.zoomLabel')}></label><div class="account-photo-actions"><button id="accountCropCancel" type="button" ${copy('crop.cancel')}></button><button id="accountCropConfirm" class="account-primary" type="button" ${copy('crop.confirm')}></button><button id="accountCameraCapture" class="account-primary" type="button" hidden ${copy('camera.capture')}></button></div></div>`;
  document.body.append(crop);
  const file=document.createElement('input');file.id='accountPhotoInput';file.type='file';file.accept='image/*';file.hidden=true;document.body.append(file);
  renderLanguage();
 }
 function applyCopy(root){
  for(const node of [root,...root.querySelectorAll('*')]){
   if(node.hasAttribute('data-account-i18n'))node.textContent=t(node.getAttribute('data-account-i18n'));
   for(const name of ['aria-label','alt','placeholder'])if(node.hasAttribute('data-account-i18n-'+name))node.setAttribute(name,t(node.getAttribute('data-account-i18n-'+name)));
  }
 }
 function renderMessages(){
  for(const [context,id] of [['entry','accountError'],['register','accountRegisterError']]){const node=$(id);node.textContent=message(messages[context]);node.hidden=!messages[context];}
  $('accountNote').hidden=!!messages.entry;$('accountNoteIcon').hidden=!!messages.entry;
  $('accountProfileMessage').textContent=message(messages.profile);$('accountCameraMessage').textContent=message(messages.camera);
 }
 function renderBusy(){
  $('accountSubmit').textContent=t(busy?'pending':'login');$('accountRegisterSubmit').textContent=t(busy?'pending':pendingRegistration?'register.finishAvatar':'register');
 }
 function renderLanguage(){
  for(const id of ['accountEntry','accountRegister','accountProfile','accountCrop'])if($(id))applyCopy($(id));
  if(!$('accountEntry'))return;renderBusy();renderMessages();$('accountCropTitle').textContent=t(editor?.camera?'camera.title':'crop.title');layout();
 }
 async function request(action,data,method='POST'){
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),20000);
  try{
   const options={method,credentials:'same-origin',cache:'no-store',signal:abort.signal,headers:{}};
   if(data instanceof Blob){options.body=data;options.headers['Content-Type']=data.type||'image/jpeg';}
   else if(method!=='GET'){options.headers['Content-Type']='application/json';options.body=JSON.stringify(data||{});}
   const response=await fetch('/api/account?action='+encodeURIComponent(action),options);
   let result;try{result=await response.json();}catch{throw keyedError('error.serverResponse');}
   if(!response.ok)throw result.error?Object.assign(new Error(result.error),{code:result.code,params:result.params,status:response.status}):keyedError('error.save');
   return result;
  }catch(error){if(error.name==='AbortError')throw keyedError('error.timeout');if(error instanceof TypeError)throw keyedError('error.connection');throw error;}
  finally{clearTimeout(timer);}
 }
 function setProfile(next){profile=next?{...next,language:next.language==='en'?'en':'pl'}:null;window.dispatchEvent(new CustomEvent('brax:account',{detail:{profile}}));}
 function error(value=''){messages[$('accountRegister').hidden?'entry':'register']=value;renderMessages();layout();}
 function setBusy(value){busy=value;$('accountEntry').setAttribute('aria-busy',String(value));document.querySelectorAll('#accountForm button,#accountForm input,#accountRegister button,#accountRegister input,#accountLoginTab,#accountRegisterTab,#accountGuest,#accountLegacy').forEach(el=>{if(!el.closest('[data-language-switch]'))el.disabled=value;});renderBusy();}
 function setProfileBusy(value){profileBusy=value;$('accountProfile').setAttribute('aria-busy',String(value));$('accountProfile').querySelectorAll('button,input').forEach(el=>{if(!el.closest('[data-language-switch]'))el.disabled=value;});}
 function profileMessage(value,isError=false){messages.profile=value;$('accountProfileMessage').textContent=message(value);$('accountProfileMessage').dataset.error=String(isError);}
 function cameraMessage(value){messages.camera=value;$('accountCameraMessage').textContent=message(value);}
 function layout(){
  const root=$('accountEntry');if(!root||root.hidden)return;
  // The approved composition's important artwork occupies source rows 40–680.
  // Limit cover cropping on wide phones so the logo and both fighters' feet stay visible.
  const w=root.clientWidth,h=root.clientHeight,computed=getComputedStyle(root),safeTop=parseFloat(computed.paddingTop)||0,safeBottom=parseFloat(computed.paddingBottom)||0;
  const rise=Math.min(10,safeBottom/2),s=Math.min(Math.max(w/1280,h/720),(h-rise)/640),top=(h-720*s)/2+215*s-rise,bottom=(h-720*s)/2+582*s-rise;
  root.style.setProperty('--account-art-width',1280*s+'px');root.style.setProperty('--account-art-height',720*s+'px');
  root.style.setProperty('--account-art-rise',rise+'px');
  root.style.setProperty('--account-reference-bottom',bottom+'px');
  // Erase the reference's printed form independently of the live form's size.
  // The illustration, logo and fighters keep their original source mapping.
  root.style.setProperty('--account-source-left',((w-1280*s)/2+453*s)+'px');
  root.style.setProperty('--account-source-top',((h-720*s)/2+209*s-rise)+'px');
  root.style.setProperty('--account-source-width',(374*s)+'px');
  root.style.setProperty('--account-source-height',(379*s)+'px');
  root.style.setProperty('--account-form-width',(360*s)+'px');
  root.style.setProperty('--account-form-height',(367*s)+'px');
  const panel=root.querySelector('.account-panel');
  root.style.setProperty('--account-panel-top',Math.max(safeTop+8,Math.min(top,h-panel.offsetHeight-Math.max(10,safeBottom+2)))+'px');
 }
 function switchMode(next){if(busy||pendingRegistration)return;mode=next;const registration=mode==='register';$('accountLoginTab').setAttribute('aria-selected',String(!registration));$('accountRegisterTab').setAttribute('aria-selected',String(registration));$('accountRegister').hidden=!registration;$('accountEntry').inert=registration;messages.register='';renderMessages();if(registration){$('accountRegisterNick').value||($('accountRegisterNick').value=$('accountNick').value);$('accountRegisterClose').focus();}else $('accountLoginTab').focus();layout();}
 function closeRegister(){if(busy)return;mode='login';pendingRegistration=false;$('accountRegister').hidden=true;$('accountEntry').inert=false;$('accountLoginTab').setAttribute('aria-selected','true');$('accountRegisterTab').setAttribute('aria-selected','false');$('accountRegisterPassword').value='';$('accountRegisterRepeat').value='';$('accountRegisterTab').focus();}

 function show(){closeCrop();$('accountRegister').hidden=true;mode='login';$('accountLoginTab').setAttribute('aria-selected','true');$('accountRegisterTab').setAttribute('aria-selected','false');$('accountEntry').inert=false;$('accountProfile').hidden=true;$('accountEntry').classList.remove('off');$('accountEntry').hidden=false;document.documentElement.classList.add('account-entry-open');layout();window.dispatchEvent(new CustomEvent('brax:account-open',{detail:{profile}}));}
 function enter(){if(!profile||window.BRAX_START_FILM?.active)return;closeCrop();$('accountRegister').hidden=true;$('accountProfile').hidden=true;const proceed=()=>{$('accountEntry').hidden=true;document.documentElement.classList.remove('account-entry-open');window.dispatchEvent(new CustomEvent('brax:account-enter',{detail:{profile}}));};if(window.BRAX_START_FILM&&!window.BRAX_START_FILM.played)window.BRAX_START_FILM.play(proceed);else proceed();}
 async function saveAvatar(context){const selected=choices[context];if(selected.kind==='custom'&&!selected.blob)return{player:profile};return selected.blob?request('avatar',selected.blob,'PUT'):request('avatar',{avatar:selected.kind==='female'?'female':'male'});}
 async function submit(event){
  event.preventDefault();if(busy)return;error();
  const registration=event.currentTarget.id==='accountRegisterForm';mode=registration?'register':'login';const nick=$(registration?'accountRegisterNick':'accountNick').value.trim(),password=$(registration?'accountRegisterPassword':'accountPassword').value;
  if(!pendingRegistration){if(nick.length<2||nick.length>20){error('validation.nickLength');$(registration?'accountRegisterNick':'accountNick').focus();return;}if(!password||(mode==='register'&&password.length<8)){error(mode==='register'?'validation.passwordMinimum':'validation.passwordRequired');$(registration?'accountRegisterPassword':'accountPassword').focus();return;}if(registration&&password!==$('accountRegisterRepeat').value){error('validation.passwordMismatch');$('accountRegisterRepeat').focus();return;}}
  setBusy(true);
  try{
   if(pendingRegistration){const result=await saveAvatar('entry');setProfile(result.player);pendingRegistration=false;}
   else{const result=await request(mode==='register'?'register':'login',{nick,password,...(mode==='register'?{avatar:choices.entry.kind==='female'?'female':'male',language:I.language}:{})});setProfile(result.player);
    if(mode==='register'&&choices.entry.blob){pendingRegistration=true;const saved=await saveAvatar('entry');setProfile(saved.player);pendingRegistration=false;}}
   $('accountPassword').value='';$('accountRegisterPassword').value='';$('accountRegisterRepeat').value='';enter();
  }catch(failure){error(failure);}
  finally{setBusy(false);}
 }
 async function guest(){if(busy)return;setBusy(true);error();try{const result=await request('guest');pendingRegistration=false;setProfile(result.player);$('accountPassword').value='';enter();}catch(failure){error(failure);}finally{setBusy(false);}}
 async function legacy(){if(busy)return;setBusy(true);error();try{const result=await request('legacy');pendingRegistration=false;setProfile(result.player);$('accountPassword').value='';enter();}catch(failure){error(failure);}finally{setBusy(false);}}
 async function logout(){if(profileBusy||busy)return;setProfileBusy(true);try{await request('logout');pendingRegistration=false;setProfile(null);$('accountPassword').value='';switchMode('login');show();error();}catch(failure){profileMessage(failure,true);}finally{setProfileBusy(false);}}
 function releaseChoice(context){const selected=choices[context];if(selected.url?.startsWith('blob:'))URL.revokeObjectURL(selected.url);}
 function selectAvatar(context,kind,blob=null){releaseChoice(context);choices[context]={kind,blob,url:blob?URL.createObjectURL(blob):PRESETS[kind]||profile?.avatar||PRESETS.male};const container=context==='entry'?$('accountAvatarOptions'):$('accountProfile');container.querySelectorAll('[data-avatar]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.avatar===kind||(blob&&button.dataset.avatar==='upload'))));if(context==='profile'){$('accountProfileAvatar').src=choices.profile.url;profileMessage('profile.avatarConfirm');}else{const upload=$('accountUpload');if(blob){upload.innerHTML='<img '+attr('alt','avatar.preview')+'>'+text('avatar.custom');upload.querySelector('img').src=choices.entry.url;}else upload.innerHTML=svg('photo')+text('avatar.photo');applyCopy(upload);error();}}
 function bindAvatar(container,context){container.querySelectorAll('[data-avatar]').forEach(button=>button.addEventListener('click',()=>{if(busy||profileBusy)return;const kind=button.dataset.avatar;if(kind==='upload'){uploadContext=context;$('accountPhotoInput').value='';$('accountPhotoInput').click();}else if(kind==='selfie')startCamera(context);else selectAvatar(context,kind);}));}
 function openProfile(){
  if(!profile?.authenticated){show();return;}
  closeCrop();restoreFocus=document.activeElement;$('accountProfileName').textContent=profile.name;$('accountProfileAvatar').src=profile.avatar||PRESETS.male;
  releaseChoice('profile');choices.profile={kind:profile.avatar===PRESETS.female?'female':profile.avatar===PRESETS.male?'male':'custom',blob:null,url:profile.avatar||PRESETS.male};
  $('accountProfile').querySelectorAll('[data-avatar]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.avatar===choices.profile.kind)));
  $('accountCurrentPasswordLabel').hidden=!profile.hasPassword;$('accountProfilePasswordFields').classList.toggle('single',!profile.hasPassword);$('accountProfilePassword').value='';$('accountProfileCurrentPassword').value='';profileMessage('profile.avatarIndependent');$('accountProfile').hidden=false;$('accountProfileClose').focus();
 }
 function closeProfile(){if(profileBusy)return;closeCrop();$('accountProfile').hidden=true;if(restoreFocus?.isConnected)restoreFocus.focus();}
 async function saveProfileAvatar(){if(profileBusy)return;setProfileBusy(true);profileMessage('profile.avatarSaving');try{const result=await saveAvatar('profile');setProfile(result.player);$('accountProfileAvatar').src=profile.avatar||PRESETS.male;profileMessage('profile.avatarSaved');}catch(failure){profileMessage(failure,true);}finally{setProfileBusy(false);}}
 async function savePassword(event){event.preventDefault();if(profileBusy)return;const password=$('accountProfilePassword').value,currentPassword=$('accountProfileCurrentPassword').value;if(password.length<8){profileMessage('validation.newPasswordMinimum',true);return;}if(profile.hasPassword&&!currentPassword){profileMessage('validation.currentPasswordRequired',true);return;}setProfileBusy(true);try{const result=await request('password',{password,...(profile.hasPassword?{currentPassword}:{})});setProfile(result.player);$('accountProfilePassword').value='';$('accountProfileCurrentPassword').value='';$('accountCurrentPasswordLabel').hidden=false;$('accountProfilePasswordFields').classList.remove('single');profileMessage('profile.passwordSaved');}catch(failure){profileMessage(failure,true);}finally{setProfileBusy(false);}}
 function stopCamera(){cameraSequence++;if(cameraStream){cameraStream.getTracks().forEach(track=>track.stop());cameraStream=null;}const video=$('accountCameraVideo');if(video){video.pause();video.srcObject=null;}}
 function closeCrop(){stopCamera();if(editor?.image?.close)editor.image.close();editor=null;if(!$('accountCrop'))return;$('accountCrop').hidden=true;$('accountEntry').inert=!$('accountRegister').hidden;$('accountRegister').inert=false;$('accountProfile').inert=false;}
 function showEditor(context,camera){
  closeCrop();editor={context,image:null,zoom:1,x:0,y:0,pointers:new Map(),camera};$('accountCrop').hidden=false;$('accountEntry').inert=true;$('accountRegister').inert=true;$('accountProfile').inert=true;$('accountCropCanvas').hidden=camera;$('accountCameraVideo').hidden=!camera;$('accountCameraMessage').hidden=!camera;$('accountCropZoomLabel').hidden=camera;$('accountCropConfirm').hidden=camera;$('accountCameraCapture').hidden=!camera;$('accountCameraCapture').disabled=true;$('accountCropTitle').textContent=t(camera?'camera.title':'crop.title');$('accountCropHelp').hidden=camera;cameraMessage(camera?'camera.permission':'');$('accountCropZoom').value='1';$('accountCropCancel').focus();
 }
 async function decodePhoto(blob){
  if(window.createImageBitmap){try{return await createImageBitmap(blob,{imageOrientation:'from-image'});}catch{/* Image decoders in older Safari apply EXIF orientation by default. */}}
  return await new Promise((resolve,reject)=>{const url=URL.createObjectURL(blob),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};img.onerror=()=>{URL.revokeObjectURL(url);reject(keyedError('error.photoDecode'));};img.src=url;});
 }
 async function usePhoto(blob,context){
  if(blob.size>25*1024*1024)throw keyedError('error.photoSize');
  const decoded=await decodePhoto(blob);if(!decoded.width||!decoded.height){decoded.close?.();throw keyedError('error.photoDimensions');}
  showEditor(context,false);editor.image=decoded;drawCrop();
 }
 function clampCrop(){if(!editor?.image)return;const scale=Math.max(SIZE/editor.image.width,SIZE/editor.image.height)*editor.zoom,maxX=Math.max(0,(editor.image.width*scale-SIZE)/2),maxY=Math.max(0,(editor.image.height*scale-SIZE)/2);editor.x=Math.max(-maxX,Math.min(maxX,editor.x));editor.y=Math.max(-maxY,Math.min(maxY,editor.y));}
 function paint(ctx,guide){if(!editor?.image)return;clampCrop();const image=editor.image,scale=Math.max(SIZE/image.width,SIZE/image.height)*editor.zoom,w=image.width*scale,h=image.height*scale;ctx.clearRect(0,0,SIZE,SIZE);ctx.drawImage(image,(SIZE-w)/2+editor.x,(SIZE-h)/2+editor.y,w,h);if(guide){ctx.strokeStyle='#d2ffa0aa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(SIZE/2,SIZE/2,SIZE/2-4,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#ffffff33';ctx.lineWidth=1;for(let n=1;n<3;n++){ctx.beginPath();ctx.moveTo(n*SIZE/3,0);ctx.lineTo(n*SIZE/3,SIZE);ctx.moveTo(0,n*SIZE/3);ctx.lineTo(SIZE,n*SIZE/3);ctx.stroke();}}}
 function drawCrop(){paint($('accountCropCanvas').getContext('2d'),true);}
 function zoom(value){if(!editor?.image)return;editor.zoom=Math.max(1,Math.min(4,value));$('accountCropZoom').value=String(editor.zoom);drawCrop();}
 function photoFailure(context,message){closeCrop();if(context==='profile')profileMessage(message,true);else error(message);}
 async function confirmCrop(){
  if(!editor?.image)return;const context=editor.context;$('accountCropConfirm').disabled=true;
  try{const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;paint(canvas.getContext('2d'),false);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));if(!blob||blob.size>512*1024)throw keyedError('error.photoPrepare');selectAvatar(context,'custom',blob);closeCrop();}
  catch(failure){photoFailure(context,failure);}finally{$('accountCropConfirm').disabled=false;}
 }
 async function startCamera(context){
  showEditor(context,true);const sequence=cameraSequence;
  if(!navigator.mediaDevices?.getUserMedia){cameraMessage('camera.unavailable');return;}
  try{const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:1280},height:{ideal:1280}}});if(sequence!==cameraSequence||!editor){stream.getTracks().forEach(track=>track.stop());return;}cameraStream=stream;const video=$('accountCameraVideo');video.srcObject=stream;await video.play();if(!video.videoWidth||video.readyState<2)await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{cleanup();reject(new Error('Camera preview timeout'));},8000),check=()=>{if(video.videoWidth&&video.readyState>=2){cleanup();resolve();}},cleanup=()=>{clearTimeout(timeout);video.removeEventListener('loadeddata',check);video.removeEventListener('canplay',check);};video.addEventListener('loadeddata',check);video.addEventListener('canplay',check);check();});if(sequence!==cameraSequence||!editor)return;cameraMessage('camera.ready');$('accountCameraCapture').disabled=false;}
  catch(failure){if(sequence!==cameraSequence||!editor)return;stopCamera();const denied=['NotAllowedError','PermissionDeniedError','SecurityError'].includes(failure.name);cameraMessage(denied?'camera.denied':'camera.failed');}
 }
 async function capture(){
  if(!editor?.camera||!cameraStream)return;const video=$('accountCameraVideo'),context=editor.context;if(!video.videoWidth){cameraMessage('camera.starting');return;}$('accountCameraCapture').disabled=true;
  try{const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;const ctx=canvas.getContext('2d');ctx.translate(canvas.width,0);ctx.scale(-1,1);ctx.drawImage(video,0,0);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.95));stopCamera();if(!blob)throw keyedError('error.photoCapture');await usePhoto(blob,context);}
  catch(failure){photoFailure(context,failure);}
 }
 function trapFocus(event){if(event.key==='Escape'){if(!$('accountCrop').hidden)closeCrop();else if(!$('accountRegister').hidden)closeRegister();else if(!$('accountProfile').hidden)closeProfile();return;}if(event.key!=='Tab')return;const root=!$('accountCrop').hidden?$('accountCrop'):!$('accountRegister').hidden?$('accountRegister'):!$('accountProfile').hidden?$('accountProfile'):!$('accountEntry').hidden?$('accountEntry'):null;if(!root)return;const focusable=[...root.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length),first=focusable[0],last=focusable.at(-1);if(!first)return;if(event.shiftKey&&(document.activeElement===first||!root.contains(document.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){event.preventDefault();first.focus();}}
 function bind(){
  $('accountLoginTab').onclick=()=>switchMode('login');$('accountRegisterTab').onclick=()=>switchMode('register');$('accountForm').onsubmit=submit;$('accountRegisterForm').onsubmit=submit;$('accountRegisterClose').onclick=closeRegister;$('accountGuest').onclick=guest;$('accountLegacy').onclick=legacy;bindAvatar($('accountAvatarOptions'),'entry');bindAvatar($('accountProfile'),'profile');$('accountProfileClose').onclick=closeProfile;$('accountProfileSave').onclick=saveProfileAvatar;$('accountPasswordForm').onsubmit=savePassword;$('accountLogout').onclick=logout;
  $('accountPhotoInput').onchange=async event=>{const blob=event.target.files?.[0];if(!blob)return;const context=uploadContext;try{await usePhoto(blob,context);}catch(failure){photoFailure(context,failure);}};
  $('accountCropCancel').onclick=closeCrop;$('accountCropClose').onclick=closeCrop;$('accountCropConfirm').onclick=confirmCrop;$('accountCameraCapture').onclick=capture;$('accountCropZoom').oninput=event=>zoom(Number(event.target.value));
  const canvas=$('accountCropCanvas');
  canvas.addEventListener('pointerdown',event=>{if(!editor?.image)return;canvas.setPointerCapture(event.pointerId);editor.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(editor.pointers.size===2){const points=[...editor.pointers.values()];editor.pinch=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);editor.pinchZoom=editor.zoom;}});
  canvas.addEventListener('pointermove',event=>{if(!editor?.pointers.has(event.pointerId))return;const previous=editor.pointers.get(event.pointerId);editor.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(editor.pointers.size===2){const points=[...editor.pointers.values()],distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);zoom((editor.pinchZoom||1)*distance/Math.max(1,editor.pinch||distance));}else{const factor=SIZE/canvas.getBoundingClientRect().width;editor.x+=(event.clientX-previous.x)*factor;editor.y+=(event.clientY-previous.y)*factor;drawCrop();}});
  const release=event=>editor?.pointers.delete(event.pointerId);canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  window.addEventListener('brax:language',renderLanguage);window.addEventListener('resize',layout);window.visualViewport?.addEventListener('resize',layout);new ResizeObserver(layout).observe($('accountEntry').querySelector('.account-panel'));document.addEventListener('keydown',trapFocus);window.addEventListener('pagehide',stopCamera);document.addEventListener('visibilitychange',()=>{if(document.hidden&&cameraStream){stopCamera();if(editor?.camera){$('accountCameraCapture').disabled=true;cameraMessage('camera.stopped');}}});
 }
 let resolveReady;const ready=new Promise(resolve=>resolveReady=resolve);
 window.BRAX_ACCOUNT={ready,get profile(){return profile;},show,enter,logout,openProfile,async refresh(){const result=await request('me',null,'GET');setProfile(result.player);return profile;}};
 function releaseBootShield(){const art=$('accountEntry').querySelector('.account-reference');const decoded=art.complete&&art.naturalWidth?Promise.resolve():Promise.resolve(art.decode?.()).catch(()=>{});Promise.race([decoded,new Promise(resolve=>setTimeout(resolve,5000))]).then(()=>{layout();requestAnimationFrame(()=>requestAnimationFrame(()=>document.documentElement.classList.remove('account-boot-pending')));});}
 async function init(){makeUI();releaseBootShield();document.querySelectorAll('#accountEntry input,#accountRegister input,#accountProfile input').forEach(input=>input.dataset.nativeInput='true');bind();layout();show();setBusy(true);try{const result=await request('me',null,'GET');setProfile(result.player);if(profile?.authenticated)enter();}catch(failure){error(failure);}finally{setBusy(false);resolveReady(profile);}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
