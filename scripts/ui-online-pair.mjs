// Two phones in one browser play an online match through scripts/local-server.mjs (real /api/duel,
// WebRTC between the two pages). Checks that both reach the fight on the same arena, that no other
// screen is left on top of the fight, that a guest hit reaches the host, and saves screenshots of both.
// Usage: node scripts/ui-online-pair.mjs <outDir> [844x390]
import fs from 'node:fs';
import {launch,phone,overlaps} from './ui-browser-harness.mjs';
const out=process.argv[2]||'docs/ui-online-pair';const size=process.argv[3]||'844x390';const base=process.env.BRAX_URL||'http://localhost:8787/';
fs.mkdirSync(out,{recursive:true});
const browser=await launch();
const stubModels=process.env.BRAX_STUB==='1'||!fs.existsSync('game/assets/brax-new/model.json.gz');
const host=(await phone(browser,size,{stubModels})).page,guest=(await phone(browser,size,{stubModels})).page;
const report={size,checks:{},problems:[]};
const fail=msg=>{report.problems.push(msg);};
const vis=(p,s)=>p.locator(s).first().isVisible().catch(()=>false);
async function tap(p,s,wait=8000){const l=p.locator(s).first();await l.waitFor({state:'visible',timeout:wait});await p.waitForTimeout(120);const b=await l.boundingBox();await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await p.waitForTimeout(300);}
async function skip(p){for(let i=0;i<4;i++){let h=false;for(const s of ['#startFilmSkip','#filmSkip'])if(await vis(p,s)){await tap(p,s);h=true;}if(!h)return;await p.waitForTimeout(400);}}
async function toLobby(p,nick,fighter){
 await p.goto(base,{waitUntil:'load'});await p.waitForTimeout(1500);await tap(p,'#go');
 for(const ch of nick){const k=p.locator(`#arenaKeyboard button:text-is("${ch}")`).first();if(await k.count())await k.tap();}
 await tap(p,'#identityContinue');for(let i=0;i<10&&!(await vis(p,'#modePlay'));i++){await skip(p);await p.waitForTimeout(500);}
 const n=await p.evaluate(()=>document.querySelectorAll('#matchSetup .mode-hit').length);
 for(let i=0;i<n;i++){if(await p.evaluate(()=>document.getElementById('multiplayerMode')?.classList.contains('mode-focused')))break;await tap(p,'#modeFollowing');}
 await tap(p,'#modePlay');await p.waitForTimeout(800);await skip(p);
 for(let i=0;i<8&&!(await p.evaluate(f=>(document.getElementById('mpPosition')?.textContent||'').startsWith(String(['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'].indexOf(f)+1).padStart(2,'0')),fighter));i++)await tap(p,'#mpFollowing');
 report.checks['position'+nick]=await p.locator('#mpPosition').textContent().catch(()=>null);
 await tap(p,'#mpNext');await p.waitForTimeout(600);
}
async function shot(p,name){const file=`${out}/${size}-${name}.png`;await p.screenshot({path:file});return file;}
async function fightState(p){return p.evaluate(()=>{
 const covering=['matchSetup','selection','arenaSelection','mpPanel','mpRoom','mpLobby','voiceConsent','codePad','gamePad','pauseMenu','helpPanel','onlineTournaments','matchEnd','victoryCinema','koReplay','fightLoadError','arenaLoadPanel','campaignScreen','challengeHub','survivalScreen','title','startFilm']
  .map(id=>document.getElementById(id)).filter(e=>e&&!e.classList.contains('off')&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&e.getBoundingClientRect().width>0).map(e=>e.id);
 const hp=[...document.querySelectorAll('.hp-fill,#p1hp,#p2hp,[id$="Hp"],[id$="HP"]')].map(e=>e.id+':'+(e.style.width||e.style.transform||e.getAttribute('aria-valuenow')||''));
 return {covering,hp,arena:document.getElementById('game')?.dataset.arena||document.body.dataset.arena||null,controls:[...document.querySelectorAll('#controls button')].filter(b=>{const c=getComputedStyle(b),r=b.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&+c.opacity>.1&&r.width>0;}).map(b=>b.dataset.tap||b.dataset.hold||b.id),hiddenControls:[...document.querySelectorAll('#controls button')].filter(b=>{const c=getComputedStyle(b),r=b.getBoundingClientRect();return !(c.display!=='none'&&c.visibility!=='hidden'&&+c.opacity>.1&&r.width>0);}).map(b=>(b.dataset.tap||b.dataset.hold||b.id)+':'+getComputedStyle(b).display+'/'+getComputedStyle(b).visibility+'/'+getComputedStyle(b).opacity+'/'+b.className+'/'+b.hidden),badge:document.getElementById('mpConnection')?.textContent||''};
});}

await toLobby(host,'HOSTA','BRAX');await toLobby(guest,'GOSC','NINA');
report.checks.lobbyHost=await shot(host,'01-host-lobby');
// Host picks the local METRO arena and creates the room.
if(await vis(host,'.ui-arena-picker button[data-value="metro"]')){const b=host.locator('.ui-arena-picker button[data-value="metro"]');await b.scrollIntoViewIfNeeded();await b.tap();}
else await host.selectOption('#mpArena','metro').catch(()=>fail('brak areny metro w multiplayerze'));
await tap(host,'#mpCreate');
await host.waitForFunction(()=>/^[A-F0-9]{8}$/.test((document.getElementById('mpRoomCode')?.textContent||'').replace(/\s/g,'')),null,{timeout:15000}).catch(()=>fail('host nie dostał kodu pokoju'));
const code=(await host.locator('#mpRoomCode').textContent()||'').replace(/\s/g,'');report.checks.code=code;
report.checks.roomHost=await shot(host,'02-host-pokoj');report.checks.roomHostOverlaps=(await overlaps(host)).overlaps.filter(o=>!/mode|h1«WYBÓR/.test(o.a+o.b));
// Guest types the code on the in-game pad and joins.
await guest.evaluate(()=>document.getElementById('mpCode').click());await guest.waitForTimeout(300);
for(const ch of code)await tap(guest,`#codePad [data-key="${ch}"]`);
report.checks.guestPad=await shot(guest,'03-gosc-kod');
await tap(guest,'#codePadSubmit');
// Voice consent on both phones.
for(const p of [host,guest]){try{await tap(p,'#voiceDeny',30000);}catch{fail('brak pytania o rozmowę głosową u '+(p===host?'hosta':'gościa'));}}
report.checks.voiceAfter=await shot(guest,'04-gosc-po-zgodzie');
// Wait for the fight to run on both.
for(const [p,who] of [[host,'host'],[guest,'gosc']]){
 await p.waitForFunction(()=>document.getElementById('mpPanel')?.classList.contains('off'),null,{timeout:45000}).catch(()=>fail(who+': panel multiplayera nie zniknął (walka nie wystartowała)'));
}
await host.waitForTimeout(4500);
for(const p of [host,guest])for(const s of ['#helpContinue','#fightIntroSkip'])if(await vis(p,s))await tap(p,s).catch(()=>{});
report.checks.hostFight=await shot(host,'05-host-walka');report.checks.guestFight=await shot(guest,'05-gosc-walka');
const hs=await fightState(host),gs=await fightState(guest);report.checks.hostState=hs;report.checks.guestState=gs;
if(hs.covering.length)fail('host: ekrany na walce: '+hs.covering.join(','));
if(gs.covering.length)fail('gość: ekrany na walce: '+gs.covering.join(','));
const arena=p=>p.evaluate(()=>window.BRAX_MULTIPLAYER_ENGINE?.debug?.()?.arena||window.BRAX_CURRENT_ARENA||document.querySelector('#arenaName,.arena-label')?.textContent||null);
report.checks.arenaHost=await arena(host);report.checks.arenaGuest=await arena(guest);
report.checks.hostOverlaps=(await overlaps(host)).overlaps;report.checks.guestOverlaps=(await overlaps(guest)).overlaps;
// Guest walks in (hold ←, keyboard like a pad) and punches; the host must see the guest move and act.
const actors=p=>p.evaluate(()=>window.BRAX_MULTIPLAYER_ENGINE.snapshot(false).actors.map(a=>({x:Math.round(a.x),hp:a.hp,a:a.a})));
const before=await actors(host);
const timeline=[];await guest.keyboard.down('ArrowLeft');for(let i=0;i<6;i++){await guest.waitForTimeout(300);timeline.push(await host.evaluate(()=>{const s=window.BRAX_MULTIPLAYER_ENGINE.snapshot(false);return {t:Math.round(s.state.t*10)/10,paused:s.state.paused,freeze:s.freeze,pre:s.state.preFight,x:Math.round(s.actors[1].x),a:s.actors[1].a};}));}await guest.keyboard.up('ArrowLeft');report.checks.holdTimeline=timeline;
const moved=await actors(host);
const seen=new Set();for(let i=0;i<10;i++){await guest.keyboard.press('a');for(let j=0;j<4;j++){seen.add((await actors(host))[1].a);await host.waitForTimeout(60);}}
const after=await actors(host);
report.checks.hostActors={before,moved,after,guestActionsSeenOnHost:[...seen]};
if(Math.abs(moved[1].x-before[1].x)<5)fail('host nie widzi ruchu gościa');
if(![...seen].some(a=>/PUNCH|JAB|HOOK|STRIKE|ATTACK|KICK|CROSS/i.test(a)))fail('host nie widzi ciosu gościa: '+[...seen].join(','));
report.checks.hostAfterGuestAttack=await shot(host,'06-host-po-ataku-goscia');report.checks.guestAfterAttack=await shot(guest,'06-gosc-po-ataku');
report.checks.badges=[await host.locator('#mpConnection').textContent().catch(()=>''),await guest.locator('#mpConnection').textContent().catch(()=>'')];
report.errors={host:[...new Set(host.errors)].filter(e=>!/404|Failed to load resource/.test(e)),guest:[...new Set(guest.errors)].filter(e=>!/404|Failed to load resource/.test(e))};
fs.writeFileSync(`${out}/${size}-raport.json`,JSON.stringify(report,null,1));
await browser.close();
console.log(JSON.stringify({problems:report.problems,code:report.checks.code,hostState:hs,guestState:gs,actors:report.checks.hostActors,pos:[report.checks.positionHOSTA,report.checks.positionGOSC],timeline:report.checks.holdTimeline,badges:report.checks.badges,arena:[report.checks.arenaHost,report.checks.arenaGuest],errors:report.errors,ov:[report.checks.hostOverlaps?.slice(0,4),report.checks.guestOverlaps?.slice(0,4),report.checks.roomHostOverlaps?.slice(0,4)]},null,1));
