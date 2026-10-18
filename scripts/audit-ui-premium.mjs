import {Window} from 'happy-dom';
import fs from 'node:fs';
const root=new URL('../',import.meta.url).pathname;
const w=new Window({url:'https://example.test',settings:{disableJavaScriptFileLoading:true,disableCSSFileLoading:true,enableJavaScriptEvaluation:true}});
w.document.write(fs.readFileSync(root+'game/index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''));
w.fetch=async()=>({ok:true,json:async()=>({name:'Tester',fighters:{},rows:[],upcoming:[],tournaments:[],profile:{name:'Tester',isOwner:true}})});
w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.HTMLMediaElement.prototype.pause=()=>{};
w.HTMLElement.prototype.scrollTo=function(){};w.HTMLElement.prototype.scrollBy=function(){};w.HTMLElement.prototype.scrollIntoView=function(){};
for(const file of ['fighter-names.js','arena-features.js','code-pad.js','arena-catalog.js','roster.js','online.js','multiplayer.js','tournaments.js','arena-interface.js','premium-hub.js','ui-system.js']){try{w.eval(fs.readFileSync(root+'game/assets/'+file,'utf8'));console.log('PASS load',file);}catch(e){console.error('FAIL load',file,e);process.exitCode=1;break;}}
await new Promise(r=>setTimeout(r,100));
try{
const assert=(v,m)=>{if(!v)throw Error(m);console.log('PASS',m);};
assert(w.document.querySelectorAll('.ui-header').length===8,'eight screen headers');
assert(w.document.getElementById('txProfile'),'tournament profile anchor retained');
const input=w.document.getElementById('mpCode');input.value='ab-cd 1234';input.dispatchEvent(new w.Event('input',{bubbles:true}));assert(input.value==='ABCD1234','code paste normalization');assert(!w.document.getElementById('mpJoin').disabled,'complete code enables join');input.value='AB';input.dispatchEvent(new w.Event('input',{bubbles:true}));assert(w.document.getElementById('mpJoin').disabled,'short code disables join');
const p=w.BRAX_FEATURES.createProgress();w.BRAX_INTERFACE.openChallenges(p,'NINA');assert(w.document.getElementById('challengeProgress').textContent.includes('22'),'Nina actual available challenges');
await w.BRAX_TOURNAMENTS.open();await new Promise(r=>setTimeout(r,100));assert(w.document.getElementById('txTitle').textContent==='TURNIEJE','tournament list after header conversion');assert(w.document.getElementById('txInviteForm').hidden,'one code form visible');
w.fetch=async()=>({ok:true,json:async()=>({profile:{name:'Tester',isOwner:true,authenticated:true},organizer:true,tournament:{id:'test',code:'ABCDEF01',name:'BRAXHORN CUP',status:'registration',startAt:Date.now()+3600000,capacity:4,intervalMinutes:30},entries:[],fights:[],history:[],ownEntry:null})});
await w.BRAX_TOURNAMENTS.open('ABCDEF01');await new Promise(r=>setTimeout(r,100));assert(w.document.querySelector('.ui-registration-preview'),'registration bracket preview');assert(w.document.querySelectorAll('#txBody .ui-primary').length===1,'one primary tournament action');assert(w.document.querySelector('#txBody [data-tx=draw]').disabled,'draw disabled before four entries');
w.document.querySelector('[data-tx=addParticipant]').click();await new Promise(r=>setTimeout(r,100));assert(w.document.querySelector('#txModal .ui-segments'),'dynamic fighter selector enhanced');assert(w.document.getElementById('txForm').elements.fighter.value==='BRAX','form value preserved by segmented control');
assert(w.BRAX_UI.plural(1,'zwycięstwo','zwycięstwa','zwycięstw')==='zwycięstwo','Polish singular');assert(w.BRAX_UI.plural(12,'osoba','osoby','osób')==='osób','Polish teens');assert(w.BRAX_UI.plural(22,'osoba','osoby','osób')==='osoby','Polish compound');
}catch(e){console.error(e);process.exitCode=1;}
await w.happyDOM.close();
