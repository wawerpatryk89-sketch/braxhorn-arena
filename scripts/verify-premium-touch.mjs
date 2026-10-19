// Phone UI checks using local files and API fixtures; no production records are touched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launch,phone,swipe} from './ui-browser-harness.mjs';

const out=process.argv[2]||'/tmp/braxhorn-touch';
fs.mkdirSync(out,{recursive:true});
let browser;
const results=[];
async function checkCarousel(page,selector,cards){
 const layout=await page.locator(selector).evaluate((root,cards)=>{
  const box=root.getBoundingClientRect(),inset=parseFloat(getComputedStyle(root).getPropertyValue('--carousel-edge-inset'))||0,left=box.left+inset,right=box.right-inset;
  return [...root.querySelectorAll(cards)].map(card=>{const r=card.getBoundingClientRect(),opacity=Number(getComputedStyle(card).opacity),fraction=Math.max(0,Math.min(right,r.right)-Math.max(left,r.left))/r.width;return{opacity,fraction,width:r.width,height:r.height};}).filter(card=>card.opacity>.03&&card.fraction>.03);
 },cards);
 const full=layout.filter(card=>card.opacity>.8&&card.fraction>.98),center=full.find(card=>card.opacity>.98),sides=full.filter(card=>card.opacity<.98);
 assert.equal(full.length,3,'Three full-size cards remain visible');
 assert.equal(sides.length,2,'Both side cards remain clearly visible');
 assert.ok(sides.every(card=>card.width/center.width>.81&&card.width/center.width<.85),'The roster uses the mode picker coverflow proportions');
 const stats=await page.locator(selector).evaluate((root,cards)=>[...root.querySelectorAll(cards)].filter(card=>Number(getComputedStyle(card).opacity)>.8).map(card=>{const box=card.getBoundingClientRect(),rows=[...card.querySelectorAll('.fighter-stat')];return{count:rows.length,labels:rows.map(row=>row.querySelector('span').textContent),fits:rows.every(row=>{const r=row.getBoundingClientRect();return r.top>=box.top&&r.bottom<=box.bottom-4&&r.left>=box.left&&r.right<=box.right;})};}),cards);
 for(const card of stats){assert.equal(card.count,3,'Each visible card shows three general statistics');assert.deepEqual(card.labels,['SIŁA','SZYBKOŚĆ','ZASIĘG']);assert.equal(card.fits,true,'The visible statistics fit inside the card');}

}

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
  assert.equal(await page.locator('#rosterCarousel .rc-focused .fighter-portrait image').getAttribute('href'),'/assets/roster-art-a-151.webp','The unframed arena illustration is used');
  assert.equal(await page.locator('#rosterCarousel .fighter-frame').count(),8,'Every fighter uses the same live frame');
  assert.equal(await page.evaluate(async()=>{const image=new Image();image.src=document.querySelector('#rosterCarousel .fighter-portrait image').getAttribute('href');await image.decode();return image.naturalWidth;}),1024,'The new portrait artwork decodes correctly');
  await checkCarousel(page,'#rosterCarousel','.rc-card');
  await page.screenshot({path:out+'/'+size+'-roster.png'});
  assert.equal(await page.locator('#rosterBoard .carousel-dots i').count(),8);
  assert.equal(await page.locator('#rosterBoard .carousel-dots .is-current').count(),1);
  await page.evaluate(()=>BRAX_ROSTER.choose(4));await page.waitForTimeout(350);await page.screenshot({path:out+'/'+size+'-roster-nina.png'});await page.evaluate(()=>BRAX_ROSTER.choose(0));await page.waitForTimeout(350);
  if(size==='844x390'&&process.env.BRAX_GALLERY==='1'){
   await page.setViewportSize({width:1280,height:800});
   await page.evaluate(()=>{
    const preview=document.createElement('aside');preview.id='rosterGallery';preview.className='premium-screen';preview.style.cssText='position:fixed;inset:0;z-index:50000;padding:0!important;background:#07100b';
    const gallery=document.getElementById('rosterCarousel').cloneNode(true);gallery.style.cssText='position:absolute;inset:18px;';
    [...gallery.children].forEach((card,i)=>{card.className='rc-card';card.style.cssText='left:'+(12.5+(i%4)*25)+'%;top:'+(25+Math.floor(i/4)*50)+'%;width:22%;height:44%;max-width:none;opacity:1;transform:translate(-50%,-50%);';});
    preview.append(gallery);document.body.append(preview);
   });
   await page.waitForTimeout(250);await page.screenshot({path:out+'/all-eight-cards.png'});
   await page.evaluate(()=>document.getElementById('rosterGallery').remove());
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);
  }

  const session=await context.newCDPSession(page);
  const rect=await page.locator('#rosterCarousel').boundingBox();
  const x=rect.x+rect.width*.55,y=rect.y+rect.height*.4;
  const beforeDrag=await page.locator('#rosterCarousel .rc-focused').boundingBox();
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=6;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-i*16,y}]});
  await page.waitForTimeout(80);
  const duringDrag=await page.locator('#rosterCarousel .rc-focused').boundingBox();
  assert.ok(duringDrag.x<beforeDrag.x-60,'Cards follow the finger before it is released');
  await page.screenshot({path:out+'/'+size+'-drag.png'});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(450);
  assert.equal(await page.evaluate(()=>BRAX_ROSTER.state().player),1,'A real swipe changes the fighter');
  assert.equal(await page.evaluate(()=>BRAX_ROSTER.state().role),'player','Browsing does not choose the opponent');
  for(let i=0;i<8;i++){await swipe(page,'#rosterCarousel');await checkCarousel(page,'#rosterCarousel','.rc-card');}
  assert.equal(await page.evaluate(()=>BRAX_ROSTER.state().player),1,'A full carousel turn returns to the same fighter');
  const cardStep=await page.locator('#rosterCarousel').evaluate(root=>parseFloat(getComputedStyle(root).getPropertyValue('--carousel-step')));
  const lx=rect.x+rect.width*.74,ly=rect.y+rect.height*.35;
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:lx,y:ly}]});
  for(let i=1;i<=10;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:lx-cardStep*1.55*i/10,y:ly}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);
  assert.equal(await page.evaluate(()=>BRAX_ROSTER.state().player),3,'A long drag can rotate through more than one slot');
  for(let i=0;i<2;i++)await swipe(page,'#rosterCarousel',1);
  assert.equal(await page.locator('#chooseFighter').isVisible(),false,'The redundant green selection button is hidden');
  await page.locator('#rosterCarousel .rc-focused').tap();
  assert.equal(await page.evaluate(()=>BRAX_ROSTER.state().role),'opponent','Tapping the fighter card confirms the player');
  assert.equal(await page.evaluate(()=>BRAX_ROSTER.state().player),1);
  const layout=await page.evaluate(()=>{const a=document.getElementById('rosterInstruction').getBoundingClientRect(),b=document.getElementById('rosterCount').getBoundingClientRect();return{overlap:Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top),offscreen:a.bottom>innerHeight||b.right>innerWidth};});
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
  await page.waitForSelector('#mpSelection .mp-focused');
  await page.waitForTimeout(380);
  await checkCarousel(page,'.mp-roster','.mp-fighter');
  await page.screenshot({path:out+'/'+size+'-online-roster.png'});
  assert.equal(await page.locator('#mpRosterHint').isVisible(),true);
  assert.equal(await page.locator('#mpSelection .carousel-dots i').count(),8);
  const mpRect=await page.locator('.mp-roster').boundingBox(),mpBefore=await page.locator('#mpSelection .mp-focused').boundingBox();
  const mx=mpRect.x+mpRect.width*.55,my=mpRect.y+mpRect.height*.4;
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:mx,y:my}]});
  for(let i=1;i<=6;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:mx-i*16,y:my}]});
  await page.waitForTimeout(80);
  assert.ok((await page.locator('#mpSelection .mp-focused').boundingBox()).x<mpBefore.x-60,'Online cards also follow the finger before release');
  await page.screenshot({path:out+'/'+size+'-online-drag.png'});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);
  assert.equal(await page.evaluate(()=>BRAX_MULTIPLAYER.fighter),'NYXA','The online roster works by real touch, without arrows');
  for(let i=0;i<8;i++){await swipe(page,'.mp-roster');await checkCarousel(page,'.mp-roster','.mp-fighter');}
  assert.equal(await page.evaluate(()=>BRAX_MULTIPLAYER.fighter),'NYXA','The online carousel also loops without reversing');
  for(let i=0;i<3;i++)await swipe(page,'.mp-roster');
  await page.screenshot({path:out+'/'+size+'-online-roster-nina.png'});
  for(let i=0;i<3;i++)await swipe(page,'.mp-roster',1);
  assert.equal(await page.locator('#mpNext').isVisible(),false,'Online selection also has no green confirmation button');
  await page.locator('#mpSelection .mp-focused').tap();
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
  results.push({size,threeFullCards:true,clearSideCards:true,fingerFollowing:true,fullLoop:true,swipe:true,alwaysVisibleStats:true,tapToChoose:true,independentRoles:true,onlineEntry:true,onlineSwipe:true,vsCoveredUntilFade:true,localizedDate:true,noHorizontalOverflow:true});
  console.log('PASS touch preview '+size);
  await context.close();
 }
 fs.writeFileSync(out+'/report.json',JSON.stringify(results,null,2));
}finally{await browser?.close();}
