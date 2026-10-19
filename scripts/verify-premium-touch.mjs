// Phone UI checks using local files and API fixtures; no production records are touched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launch,phone,swipe} from './ui-browser-harness.mjs';

const out=process.argv[2]||'/tmp/braxhorn-touch';
fs.mkdirSync(out,{recursive:true});
let browser;
const results=[];
try{
 browser=await launch();console.log('Browser ready.');
 for(const size of ['844x390','915x412']){
  const {page,context}=await phone(browser,size,{stubModels:true});
  // Serve the actual local files through Playwright's in-memory router. The UI fixture
  // needs no listening socket or production account; API integration has separate tests.
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.startsWith('/api/')){
    const profile={isOwner:true,name:'WAWER',authenticated:true};
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({profile,tournaments:[],upcoming:[],fighters:{},rows:[],results:[],name:'WAWER'})});
   }
   const file=path.resolve('game','.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
   const root=path.resolve('game')+path.sep;
   if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'missing'});
   const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf','.mp3':'audio/mpeg','.mp4':'video/mp4'};
   return route.fulfill({status:200,contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
  });
  await context.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
  page.setDefaultTimeout(8000);
  await page.goto('http://braxhorn.preview/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#rosterCarousel',{state:'attached'});
  await page.evaluate(()=>{for(const id of ['start','matchSetup','modeSettings'])document.getElementById(id).classList.add('off');document.getElementById('selection').classList.remove('off');window.BRAX_ROSTER.setMode('fight');});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#rosterStrip').count(),0,'No portrait strip remains');
  assert.equal(await page.locator('#rosterTrack').isVisible(),false);
  assert.equal(await page.locator('#rosterCarousel .rc-focused img').evaluate(image=>image.complete&&image.naturalWidth>0),true,'The real portrait is available');
  await page.screenshot({path:out+'/'+size+'-roster.png'});
  const session=await context.newCDPSession(page);
  const rect=await page.locator('#rosterCarousel').boundingBox();
  const x=rect.x+rect.width*.55,y=rect.y+rect.height*.4;
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=6;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-i*16,y}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(450);
  assert.equal(await page.evaluate(()=>BRAX_ROSTER.state().player),1,'A real swipe changes the fighter');
  assert.equal(await page.evaluate(()=>BRAX_ROSTER.state().role),'player','Browsing does not choose the opponent');
  await page.locator('#rosterCarousel .rc-focused').tap();
  assert.equal(await page.locator('#rosterCarousel').evaluate(node=>node.classList.contains('rc-detail')),true,'Tapping the centre shows statistics');
  await page.screenshot({path:out+'/'+size+'-stats.png'});
  await page.locator('#chooseFighter').tap();
  assert.equal(await page.evaluate(()=>BRAX_ROSTER.state().role),'opponent','The only main action confirms the player');
  assert.equal(await page.evaluate(()=>BRAX_ROSTER.state().player),1);
  const layout=await page.evaluate(()=>{const a=document.getElementById('chooseFighter').getBoundingClientRect(),b=document.getElementById('rosterCount').getBoundingClientRect();return{overlap:Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top),offscreen:a.bottom>innerHeight||b.right>innerWidth};});
  assert.deepEqual(layout,{overlap:false,offscreen:false},'Counter and main action stay separate');
  await page.evaluate(()=>{document.getElementById('selection').classList.add('off');document.getElementById('matchSetup').classList.remove('off');});
  await page.screenshot({path:out+'/'+size+'-modes.png'});
  assert.equal(await page.locator('#modeFollowing').isVisible(),false,'Modes use touch cards');
  assert.equal(await page.locator('#modePosition').evaluate(node=>{const r=node.getBoundingClientRect(),b=document.getElementById('modePlay').getBoundingClientRect();return r.top>=b.bottom||r.bottom<=b.top;}),true,'Mode counter is outside the play button');
  const firstMode=await page.locator('.mode-focused').getAttribute('id');
  await swipe(page,'#matchSetup .mode-card-row');
  assert.notEqual(await page.locator('.mode-focused').getAttribute('id'),firstMode,'The modes work by real touch, without arrows');
  for(let i=0;i<7&&!await page.locator('#multiplayerMode').evaluate(node=>node.classList.contains('mode-focused'));i++)await swipe(page,'#matchSetup .mode-card-row');
  await page.locator('#modePlay').tap();
  await page.waitForSelector('#mpNext');
  await swipe(page,'.mp-roster');
  assert.equal(await page.evaluate(()=>BRAX_MULTIPLAYER.fighter),'NYXA','The online roster works by real touch, without arrows');
  await page.locator('#mpNext').tap();
  await page.screenshot({path:out+'/'+size+'-online-lobby.png'});
  await page.locator('#mpLeave').tap();
  await page.evaluate(()=>BRAX_TOURNAMENTS.open());
  await page.locator('[data-tx=create]').tap();
  await page.waitForSelector('.ui-date-value');
  await page.locator('select[name=intervalMinutes]').selectOption('15');
  assert.equal(await page.locator('select[name=intervalMinutes]').inputValue(),'15');
  assert.equal(await page.locator('.ui-date-value').innerText().then(text=>text.includes('T')),false,'The date is localized');
  await page.locator('[data-tx=soon]').tap();
  const schedule=await page.locator('[name=startAt]').inputValue();
  assert.ok(new Date(schedule)-Date.now()>30000&&new Date(schedule)-Date.now()<=120000,'Quick scheduling keeps a valid local ISO value');
  assert.equal(await page.locator('#txForm').evaluate(form=>form.scrollWidth<=form.clientWidth+1),true,'The form has no horizontal overflow');
  const submit=page.locator('#txForm button[type=submit]');
  assert.equal(await submit.evaluate(node=>{const r=node.getBoundingClientRect();return r.bottom<=innerHeight&&r.top>=0;}),true,'The main form action fits on screen');
  await page.screenshot({path:out+'/'+size+'-tournament-form.png'});
  await page.locator('#txModal [data-tx=close]').tap();
  await page.locator('#txBack').tap();
  await page.evaluate(()=>{
   for(const id of ['start','matchSetup','selection'])document.getElementById(id).classList.add('off');
   const arena=document.getElementById('arenaSelection');arena.classList.remove('off');
   const selected=arena.querySelector('.arena-thumb[aria-pressed=true]');
   selected.addEventListener('click',()=>BRAX_TRANSITION.run(()=>arena.classList.add('off')),{once:true});
   window.__transitionFrames=[];
   const sample=()=>{if(arena.classList.contains('off'))return;window.__transitionFrames.push({card:!!document.querySelector('.ui-vs'),black:Number(getComputedStyle(document.getElementById('sceneFade')).opacity)});requestAnimationFrame(sample);};
   document.getElementById('arenaConfirm').addEventListener('click',()=>requestAnimationFrame(sample),{once:true});
  });
  await page.locator('#arenaConfirm').tap();
  await page.waitForFunction(()=>document.getElementById('arenaSelection').classList.contains('off'));
  assert.equal(await page.evaluate(()=>__transitionFrames.some(frame=>!frame.card&&frame.black<.99)),false,'The VS card stays until the arena is covered by black');
  assert.deepEqual(page.errors.filter(error=>!error.includes('Failed to load resource')),[]);
  results.push({size,swipe:true,statistics:true,independentRoles:true,onlineEntry:true,onlineSwipe:true,vsCoveredUntilFade:true,localizedDate:true,noHorizontalOverflow:true});
  console.log('PASS touch preview '+size);
  await context.close();
 }
 fs.writeFileSync(out+'/report.json',JSON.stringify(results,null,2));
}finally{await browser?.close();}
