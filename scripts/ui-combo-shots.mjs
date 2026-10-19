// Screenshots of a player combo in a real local fight (phone size): banner, camera and finisher slow-down.
// Test-only hook: the served combat.js exposes B/O/S as window.__BRAX_DEBUG__ (the file on disk is unchanged).
// Requires scripts/local-server.mjs. Usage: node scripts/ui-combo-shots.mjs <outDir> [844x390] [FIGHTER]
import fs from 'node:fs';
import {launch,phone} from './ui-browser-harness.mjs';
const out=process.argv[2]||'docs/ui-combo';const size=process.argv[3]||'844x390';const fighter=(process.argv[4]||'BRAX').toUpperCase();const base=process.env.BRAX_URL||'http://localhost:8787/';
fs.mkdirSync(out,{recursive:true});
const browser=await launch();const {context,page}=await phone(browser,size,{stubModels:!fs.existsSync('game/assets/brax-new/model.json.gz')});
await context.route(/\/assets\/combat\.js(\?|$)/,async route=>{const body=fs.readFileSync('game/assets/combat.js','utf8').replace('window.__BRAX_PROOF__=','window.__BRAX_DEBUG__={B:()=>B,O:()=>O,S:()=>S,buttonMove};window.__BRAX_PROOF__=');route.fulfill({status:200,contentType:'text/javascript',body});});
const vis=s=>page.locator(s).first().isVisible().catch(()=>false);
async function tap(s,wait=8000){const l=page.locator(s).first();await l.waitFor({state:'visible',timeout:wait});await page.waitForTimeout(120);const b=await l.boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(300);}
async function skip(){for(let i=0;i<4;i++){let h=false;for(const s of ['#startFilmSkip','#filmSkip','#victorySkip','#koReplaySkip'])if(await vis(s)){await tap(s);h=true;}if(!h)return;await page.waitForTimeout(400);}}
await page.goto(base,{waitUntil:'load'});await page.waitForTimeout(1500);await tap('#go');
for(const ch of 'TESTER'){const k=page.locator(`#arenaKeyboard button:text-is("${ch}")`).first();if(await k.count())await k.tap();}
await tap('#identityContinue');for(let i=0;i<10&&!(await vis('#modePlay'));i++){await skip();await page.waitForTimeout(500);}
await tap('#modePlay');await page.waitForTimeout(800);await skip();
if(await vis('#setupNext'))await tap('#setupNext');
const idx=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'].indexOf(fighter);
await page.screenshot({path:`${out}/debug-before-roster.png`});if(await vis('#rosterPlayer'))await tap('#rosterPlayer');await page.evaluate(index=>BRAX_ROSTER.choose(index),idx);await tap('#rosterCarousel .rc-focused');
await tap('#rosterCarousel .rc-focused');const a=page.locator('#arena-metro').first();await a.scrollIntoViewIfNeeded().catch(()=>{});await a.tap().catch(()=>{});await page.waitForTimeout(300);await tap('#arenaConfirm');
let helpShot=false;for(let i=0;i<30;i++){await page.waitForTimeout(700);await skip();if(await vis('#helpContinue')){if(!helpShot){helpShot=true;await page.waitForTimeout(500);await page.screenshot({path:`${out}/${size}-${fighter}-pomoc.png`});if(await vis('#helpMovesTab')){await tap('#helpMovesTab');await page.waitForTimeout(400);await page.screenshot({path:`${out}/${size}-${fighter}-ciosy.png`});}}await tap('#helpContinue');}if(await page.evaluate(()=>{const S=window.__BRAX_DEBUG__?.S();return S&&S.running&&!S.preFight&&!S.cinematic;}))break;}
await page.waitForFunction(()=>{const S=window.__BRAX_DEBUG__?.S();return S&&S.running&&!S.preFight&&!S.cinematic;},null,{timeout:30000}).catch(async e=>{await page.screenshot({path:`${out}/debug-wait.png`});console.log("dbg",await page.evaluate(()=>[typeof window.__BRAX_DEBUG__,JSON.stringify(window.__BRAX_PROOF__?.state?.()).slice(0,300)]));throw e;});
await page.evaluate(()=>{const {B,O}=window.__BRAX_DEBUG__;const b=B(),o=O();b.en=100;b.x=44;o.x=56;o.hp=100;});
await page.waitForTimeout(200);
const t0=Date.now();await tap('[data-tap="special"]');
// Freeze the banner animation at its hold phase for one still frame, then let it run on.
if(await page.waitForSelector('#comboBanner.play',{timeout:8000}).catch(()=>null)){await page.evaluate(()=>{for(const a of document.getElementById('comboBanner').getAnimations()){a.pause();a.currentTime=600;}});await page.screenshot({path:`${out}/${size}-${fighter}-banner.png`});await page.evaluate(()=>{for(const a of document.getElementById('comboBanner').getAnimations())a.play();});}
const log=[];for(const at of [150,450,800,1200,1700,2300,3000,3800]){while(Date.now()-t0<at)await page.waitForTimeout(20);
 const st=await page.evaluate(()=>{const {B,O,S}=window.__BRAX_DEBUG__,s=S();return {b:B().a,o:O().a,ohp:Math.round(O().hp),scale:s.comboCinema?.timeScale?.toFixed(2)??null,cam:document.getElementById('combatStage').style.transform,banner:document.getElementById('comboBanner')?.className??null};});
 log.push({ms:Date.now()-t0,...st});await page.screenshot({path:`${out}/${size}-${fighter}-${String(at).padStart(4,'0')}.png`});}
console.log(JSON.stringify(log,null,0));console.log('errors',JSON.stringify([...new Set(page.errors)].filter(e=>!/404|Failed to load/.test(e))));
await browser.close();
