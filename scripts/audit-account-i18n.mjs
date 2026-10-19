// Account interaction audit: language changes must preserve work in active forms,
// avatar crops, pending registration retries and camera streams.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Window} from 'happy-dom';

const w=new Window({url:'http://localhost:8788',settings:{enableJavaScriptEvaluation:true}});
const copy=new Map(),calls=[],missing=[];
let language='pl',player=null,registerResolve,failUpload=true,entered=0,objectId=0,stopped=0;
const settle=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
w.ResizeObserver=class{observe(){}};
w.URL.createObjectURL=()=>`blob:account-audit-${++objectId}`;
w.URL.revokeObjectURL=()=>{};
w.createImageBitmap=async()=>({width:640,height:480,close(){}});
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(_,key)=>key==='canvas'?null:()=>{}});
w.HTMLCanvasElement.prototype.toBlob=function(callback,type){callback(new w.Blob(['test photo'],{type}));};
w.HTMLMediaElement.prototype.play=async()=>{};
w.HTMLMediaElement.prototype.pause=()=>{};
Object.defineProperty(w.HTMLVideoElement.prototype,'videoWidth',{get:()=>640});
Object.defineProperty(w.HTMLVideoElement.prototype,'videoHeight',{get:()=>480});
Object.defineProperty(w.HTMLVideoElement.prototype,'readyState',{get:()=>4});
Object.defineProperty(w.navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{throw new w.DOMException('Denied','NotAllowedError');}}});
w.BRAX_I18N={
 get language(){return language;},
 register(namespace,entries){for(const [key,value] of Object.entries(entries)){assert.equal(typeof value.pl,'string');assert.equal(typeof value.en,'string');copy.set(namespace+'.'+key,value);}},
 t(key){const value=copy.get(key);if(!value){missing.push(key);return key;}return value[language];},
 message(error,fallback){return error.code==='photo_test_failure'?(language==='en'?'Upload failed. Try again.':'Nie udało się przesłać zdjęcia. Spróbuj ponownie.'):this.t(fallback);},
 setLanguage(next){language=next;w.dispatchEvent(new w.CustomEvent('brax:language',{detail:{language}}));}
};
w.fetch=async(url,options={})=>{
 const action=new URL(url,w.location.href).searchParams.get('action'),body=options.body instanceof w.Blob?options.body:options.body?JSON.parse(options.body):null;
 calls.push({action,body,method:options.method});
 if(action==='register'){
  await new Promise(resolve=>{registerResolve=resolve;});
  player={id:'account-stable',name:body.nick,avatar:'/assets/avatar-female.jpg',authenticated:true,hasPassword:true,language:body.language};
 }
 if(action==='avatar'){
  if(failUpload){failUpload=false;return new w.Response(JSON.stringify({error:'Test upload failure',code:'photo_test_failure'}),{status:503});}
  player={...player,avatar:body instanceof w.Blob?'/api/player-avatar/test.jpg':'/assets/avatar-'+body.avatar+'.jpg'};
 }
 if(action==='logout')player=null;
 return new w.Response(JSON.stringify({player,authenticated:!!player}),{status:200});
};
w.addEventListener('brax:account-enter',()=>{entered++;w.document.getElementById('accountEntry').classList.add('off');});
for(const name of ['i18n-account.js','account-entry.js'])w.eval(fs.readFileSync('game/assets/'+name,'utf8'));
w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
await w.BRAX_ACCOUNT.ready;
const $=id=>w.document.getElementById(id),setLanguage=value=>w.BRAX_I18N.setLanguage(value);
const submit=id=>$(id).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal($('accountRegister').hidden,true);
assert.equal($('accountSubmit').textContent,'Zaloguj się');
setLanguage('en');
assert.equal($('accountSubmit').textContent,'Log in');
assert.equal($('accountPassword').placeholder,'Password');
$('accountNick').value='Żółw Tester';$('accountPassword').value='login password';
$('accountRegisterTab').click();
assert.equal($('accountRegister').hidden,false);assert.equal($('accountEntry').inert,true);
$('accountRegisterPassword').value='private-password';$('accountRegisterRepeat').value='mismatch';$('accountAvatarFemale').click();
submit('accountRegisterForm');await settle();
assert.equal(calls.filter(v=>v.action==='register').length,0);
assert.equal($('accountRegisterError').textContent,'Passwords must match.');
const fields=['accountNick','accountPassword','accountRegisterNick','accountRegisterPassword','accountRegisterRepeat'].map(id=>({id,node:$(id),value:$(id).value}));
const focus=w.document.activeElement;
setLanguage('pl');
assert.equal($('accountRegisterError').textContent,'Hasła muszą być takie same.');
for(const field of fields){assert.equal($(field.id),field.node);assert.equal($(field.id).value,field.value);}
assert.equal(w.document.activeElement,focus);assert.equal($('accountAvatarFemale').getAttribute('aria-pressed'),'true');
assert.equal($('accountAvatarFemale').querySelector('img').getAttribute('src'),'/assets/avatar-female.jpg');
assert.equal($('accountRegisterClose').getAttribute('aria-label'),'Zamknij rejestrację');

// Upload, crop, zoom and the resulting object URL survive a language change.
$('accountRegisterRepeat').value='private-password';
await $('accountPhotoInput').onchange({target:{files:[new w.Blob(['photo'],{type:'image/jpeg'})]}});
assert.equal($('accountCrop').hidden,false);
const cropCanvas=$('accountCropCanvas'),zoom=$('accountCropZoom');zoom.value='2.2';zoom.dispatchEvent(new w.Event('input'));
setLanguage('en');
assert.equal($('accountCropCanvas'),cropCanvas);assert.equal($('accountCropZoom'),zoom);assert.equal(zoom.value,'2.2');
assert.equal($('accountCropTitle').textContent,'Crop your avatar');assert.equal($('accountCropConfirm').textContent,'Use this crop');
assert.equal($('accountRegisterNick').value,'Żółw Tester');assert.equal($('accountRegisterRepeat').value,'private-password');
$('accountCropConfirm').click();await settle();
assert.equal($('accountCrop').hidden,true);assert.equal($('accountRegister').hidden,false);
const uploadImage=$('accountUpload').querySelector('img'),uploadURL=uploadImage.src;
setLanguage('pl');setLanguage('en');
assert.equal($('accountUpload').querySelector('img'),uploadImage);assert.equal(uploadImage.src,uploadURL);
assert.equal(uploadImage.alt,'Selected photo preview');assert.equal($('accountUpload').textContent,'Yours');

// A language switch during a pending request or upload retry cannot register twice.
submit('accountRegisterForm');await settle();
assert.equal($('accountRegisterSubmit').textContent,'Please wait…');
assert.equal(calls.filter(v=>v.action==='register').length,1);assert.equal(calls.find(v=>v.action==='register').body.language,'en');
setLanguage('pl');assert.equal($('accountRegisterSubmit').textContent,'Proszę czekać…');assert.equal($('accountRegisterPassword').value,'private-password');
registerResolve();await settle();
assert.equal(entered,0);assert.equal($('accountRegister').hidden,false);assert.equal($('accountRegisterSubmit').textContent,'Zapisz awatar i wejdź');
assert.equal($('accountRegisterError').textContent,'Nie udało się przesłać zdjęcia. Spróbuj ponownie.');
setLanguage('en');assert.equal($('accountRegisterSubmit').textContent,'Save avatar and enter');assert.equal($('accountRegisterError').textContent,'Upload failed. Try again.');
assert.equal($('accountUpload').querySelector('img'),uploadImage);
submit('accountRegisterForm');await settle();
assert.equal(calls.filter(v=>v.action==='register').length,1);assert.equal(calls.filter(v=>v.action==='avatar').length,2);
assert.equal(entered,1);assert.equal(w.BRAX_ACCOUNT.profile.id,'account-stable');assert.equal($('accountEntry').hidden,true);assert.equal($('accountRegister').hidden,true);

// Profile drafts and server-owned nicknames do not get rewritten by translation.
w.BRAX_ACCOUNT.openProfile();$('accountProfileCurrentPassword').value='current password';$('accountProfilePassword').value='new password';$('accountProfileAvatarMale').click();
const profileAvatar=$('accountProfileAvatar').src;
setLanguage('pl');
assert.equal($('accountProfileName').textContent,'Żółw Tester');assert.equal($('accountProfileAvatar').src,profileAvatar);
assert.equal($('accountProfileCurrentPassword').value,'current password');assert.equal($('accountProfilePassword').value,'new password');
assert.equal($('accountProfileMessage').textContent,'Zatwierdź zmianę przyciskiem „Zapisz awatar”.');

// Permission-denied and a running camera each retain their own translated state.
$('accountProfileSelfie').click();await settle();
assert.equal($('accountCameraCapture').disabled,true);assert.equal($('accountCrop').hidden,false);
setLanguage('en');assert.match($('accountCameraMessage').textContent,/Camera access was denied/);
$('accountCropCancel').click();
const stream=new w.MediaStream();stream.getTracks=()=>[{stop(){stopped++;}}];w.navigator.mediaDevices.getUserMedia=async()=>stream;
$('accountProfileSelfie').click();await settle();
const video=$('accountCameraVideo');assert.equal(video.srcObject,stream);assert.equal($('accountCameraCapture').disabled,false);
setLanguage('pl');
assert.equal($('accountCameraVideo'),video);assert.equal(video.srcObject,stream);assert.equal(stopped,0);assert.match($('accountCameraMessage').textContent,/Ustaw się w kadrze/);
assert.equal($('accountProfileCurrentPassword').value,'current password');
$('accountCameraCapture').click();await settle();assert.equal(stopped,1);assert.equal($('accountCropCanvas').hidden,false);assert.equal($('accountCameraVideo').hidden,true);
setLanguage('en');assert.equal($('accountCropTitle').textContent,'Crop your avatar');$('accountCropConfirm').click();await settle();
assert.equal($('accountCrop').hidden,true);assert.equal($('accountProfile').hidden,false);assert.match($('accountProfileAvatar').src,/^blob:/);
assert.equal($('accountProfilePassword').value,'new password');
await w.BRAX_ACCOUNT.logout();
assert.equal($('accountEntry').hidden,false);assert.equal($('accountEntry').classList.contains('off'),false);assert.equal($('accountEntry').inert,false);assert.equal(w.BRAX_ACCOUNT.profile,null);
assert.deepEqual(missing,[]);
await w.happyDOM.close();
console.log('PASS account PL/EN labels and aria, form/focus/avatar/crop persistence, pending registration and upload retry, unchanged nickname/passwords, camera denial and active stream persistence, selfie capture, logout.');
