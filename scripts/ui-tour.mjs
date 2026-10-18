// Phone-sized walk through the whole local game: menus, fighter and arena choice, help, fight, pause,
// training, challenges, records, online lobby and tournaments. Saves screenshots and a JSON report
// of overlapping/off-screen controls and of any native text field that would open the phone keyboard.
// Requires scripts/local-server.mjs running. Usage: node scripts/ui-tour.mjs <outDir> [844x390|915x412|932x430]
import fs from 'node:fs';
import {launch,phone,overlaps} from './ui-browser-harness.mjs';
const out=process.argv[2]||'docs/ui-tour';const size=process.argv[3]||'844x390';const base=process.env.BRAX_URL||'http://localhost:8787/';
fs.mkdirSync(out,{recursive:true});
const browser=await launch();const {page}=await phone(browser,size,{stubModels:!fs.existsSync('game/assets/brax-new/model.json.gz')});
const report={size,steps:[]};let n=0;
const isVisible=sel=>page.locator(sel).first().isVisible().catch(()=>false);
async function tapSel(sel,wait=6000){const loc=page.locator(sel).first();try{await loc.waitFor({state:'visible',timeout:wait});}catch{throw Error('niewidoczny: '+sel);}await page.waitForTimeout(150);const box=await loc.boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(350);}
async function skipFilms(){for(let i=0;i<4;i++){let hit=false;for(const s of ['#startFilmSkip','#filmSkip','#victorySkip','#koReplaySkip'])if(await isVisible(s)){await tapSel(s);hit=true;}if(!hit)return;await page.waitForTimeout(500);}}
async function shot(name){n++;const file=`${out}/${size}-${String(n).padStart(2,'0')}-${name}.png`;await page.screenshot({path:file});
 const o=await overlaps(page);
 const nativeFields=await page.evaluate(()=>[...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.closest('.off,[hidden]')&&!(e.readOnly&&e.inputMode==='none');}).map(e=>e.id||e.name||e.tagName));
 const focused=await page.evaluate(()=>{const a=document.activeElement;return a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&!(a.readOnly&&a.inputMode==='none')?(a.id||a.name||a.tagName):null;});
 report.steps.push({name,file,overlaps:o.overlaps,offscreen:o.offscreen,nativeFields,focusedNativeField:focused});}
async function step(name,fn){try{await fn();await page.waitForTimeout(700);await skipFilms();await shot(name);}catch(e){report.steps.push({name,error:String(e).split('\n')[0]});await shot(name+'-BLAD');}}
async function openMode(id){const cards=await page.evaluate(()=>[...document.querySelectorAll('#matchSetup .mode-hit')].map(c=>c.id));if(!cards.includes(id))throw Error('brak trybu '+id+' w '+cards.join(','));for(let i=0;i<cards.length;i++){if(await page.evaluate(id=>document.getElementById(id)?.classList.contains('mode-focused'),id))break;await tapSel('#modeFollowing');}for(let i=0;i<3;i++){await tapSel('#modePlay');await page.waitForTimeout(700);if(!(await isVisible('#modePlay')))break;}}
async function toModes(){await page.goto(base,{waitUntil:'load'});await page.waitForTimeout(1500);await tapSel('#go');if(await isVisible('#identityContinue'))await tapSel('#identityContinue');for(let i=0;i<8&&!(await isVisible('#modePlay'));i++){await skipFilms();await page.waitForTimeout(600);}}
async function name(text){for(const ch of text){const k=page.locator(`#arenaKeyboard button:text-is("${ch}")`).first();if(await k.count())await k.tap();}}

await page.goto(base,{waitUntil:'load'});await page.waitForTimeout(2000);await shot('start');
await step('pseudonim',async()=>{await tapSel('#go');await name('TESTER');});
await step('tryby',()=>tapSel('#identityContinue'));
await step('lista-trybow',async()=>{report.modes=await page.evaluate(()=>[...document.querySelectorAll('#matchSetup .mode-hit')].map(c=>c.id+':'+c.getAttribute('aria-label')));});
await step('ustawienia-trybu',()=>openMode('fightMode'));
await step('wybor-postaci',async()=>{if(await isVisible('#setupNext'))await tapSel('#setupNext');else if(await isVisible('#closeModeSettings'))await tapSel('#closeModeSettings');});
await step('wybor-przeciwnika',async()=>{if(await isVisible('#rosterOpponent'))await tapSel('#rosterOpponent');});
await step('wybor-areny',async()=>{if(await isVisible('#rosterPlayer'))await tapSel('#rosterPlayer');await tapSel('#chooseFighter');});
await step('pomoc-sterowania',async()=>{const a=page.locator('#arena-metro').first();await a.scrollIntoViewIfNeeded().catch(()=>{});await a.tap().catch(()=>{});await page.waitForTimeout(300);await tapSel('#arenaConfirm');await page.waitForTimeout(6000);await page.waitForTimeout(2500);});
await step('walka',async()=>{if(await isVisible('#helpContinue'))await tapSel('#helpContinue');await page.waitForTimeout(5000);});
await step('walka-cios',async()=>{for(const s of ['[data-tap="punch"]','[data-tap="kick"]'])if(await isVisible(s))await tapSel(s);await page.waitForTimeout(600);});
await step('pauza',()=>tapSel('#pause'));
await step('pauza-sterowanie',()=>tapSel('#pauseHelp'));
await step('powrot-do-walki',async()=>{if(await isVisible('#helpContinue'))await tapSel('#helpContinue');if(await isVisible('#pauseResume'))await tapSel('#pauseResume');});
await step('wyjscie-do-menu',async()=>{await tapSel('#pause');await tapSel('#pauseExit');await page.waitForTimeout(1500);});
// Remaining menu destinations.
for(const [label,id] of [['arcade','arcadeMode'],['trening','mode-training'],['turniej-lokalny','tournamentMode'],['wyzwania-hub','hubMode'],['multiplayer','multiplayerMode'],['turnieje-online','onlineTournamentMode']]){
 await step(label,async()=>{await toModes();await openMode(id);});
 await step(label+'-dalej',async()=>{for(const s of ['#setupNext','#survivalMode','#mpNext','[data-tx="open"]'])if(await isVisible(s)){await tapSel(s);break;}});
 if(label==='multiplayer')await step('multiplayer-kod',async()=>{for(const s of ['#mpCode','#mpJoin'])if(await isVisible(s)){await tapSel(s);break;}});
 if(label==='turnieje-online')await step('turnieje-kod',async()=>{for(const s of ['#txCode','#txInviteCode'])if(await isVisible(s)){await tapSel(s);break;}});
 for(let i=0;i<4;i++)for(const back of ['#closeModeSettings','#backFighter','#backTitle','#hubBack','#survivalBack','#challengesBack','#setupBack','#mpExit','#mpLeave','[data-tx="close"]','#txClose'])if(await isVisible(back)){try{await tapSel(back);}catch{}}
}
report.errors=[...new Set(page.errors)].filter(e=>!/404|Failed to load resource/.test(e));
fs.writeFileSync(`${out}/${size}-raport.json`,JSON.stringify(report,null,1));
await browser.close();
const bad=report.steps.filter(s=>s.error||s.focusedNativeField||s.overlaps?.length||s.offscreen?.length);
console.log(JSON.stringify({size,steps:report.steps.length,problems:bad.map(s=>({name:s.name,error:s.error,focus:s.focusedNativeField,overlaps:(s.overlaps||[]).slice(0,3),offscreen:(s.offscreen||[]).slice(0,4)})),errors:report.errors},null,1));
