import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {overlaps,PHONES} from './ui-browser-harness.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const out=process.argv[2]||'docs/verification/arena-live/current-browser',base=process.env.BRAX_URL||'http://localhost:8792';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BRAX_CHROMIUM_PATH||'/usr/lib/chromium/chromium',args:['--autoplay-policy=user-gesture-required']});
const report={status:'running',published:false,views:[],limitations:['Local Chromium landscape emulation; no physical iPhone, Android or Safari test.','Real game assets and media; the view is isolated after normal guest entry.','Four source videos remain unavailable, so this is a 17-arena review, not final acceptance.']};
async function layout(page){
 const collision=await overlaps(page);assert.deepEqual(collision,{overlaps:[],offscreen:[]});
 const metrics=await page.locator('#arenaSelection').evaluate(root=>{
  const title=root.querySelector('#arenaHeroName'),range=document.createRange();range.selectNodeContents(title);
  const text=range.getBoundingClientRect(),block=title.parentElement.getBoundingClientRect(),ring=root.querySelector('#arenaConfirm').getBoundingClientRect();
  const small=[...root.querySelectorAll('button')].filter(b=>!b.hidden).map(b=>({id:b.id||b.dataset.category,...b.getBoundingClientRect().toJSON()})).filter(b=>b.width<44||b.height<44);
  return {small,textFits:text.right<=block.right+2&&text.left>=block.left-3,nameAvoidsRing:text.right+16<ring.left,keyboardFields:root.querySelectorAll('input,select,textarea').length};
 });assert.deepEqual(metrics.small,[]);assert(metrics.textFits);assert(metrics.nameAvoidsRing);assert.equal(metrics.keyboardFields,0);return{collision,metrics};
}
try{
 for(const [size,viewport] of Object.entries(PHONES)){
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,left:34,right:22,bottom:12}});
  await context.addInitScript(()=>localStorage.setItem('braxhorn.arena.v1','snow'));
  await page.goto(base,{waitUntil:'load'});await page.waitForFunction(()=>!!window.BRAX_ACCOUNT);await page.evaluate(()=>BRAX_ACCOUNT.ready);
  await page.locator('#accountGuest').tap();await page.locator('#startFilm:not([hidden])').waitFor();await page.locator('#startFilmSkip').tap();await page.locator('#matchSetup:not(.off)').waitFor();
  await page.evaluate(()=>{for(const screen of document.querySelectorAll('.menu-screen'))screen.classList.add('off');for(const id of ['selection','matchSetup','modeSettings'])document.getElementById(id)?.classList.add('off');document.getElementById('game').classList.add('arena-picker-open');document.getElementById('arenaSelection').classList.remove('off');});
  await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>BRAX_ARENA_PICKER.report().moving);await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>BRAX_ARENA_PICKER.selection()),'nocny-targ');
  const keys=await page.evaluate(()=>Object.keys(BRAX_ARENA_VIDEOS));assert.equal(keys.length,17);
  assert.deepEqual(await page.locator('#mpArena option').evaluateAll(options=>options.map(o=>o.value)),keys);
  for(const language of ['pl','en']){
   await page.evaluate(language=>BRAX_I18N.setLanguage(language,{explicit:true}),language);
   await page.locator('[data-category=all]').tap();await page.evaluate(()=>BRAX_ARENA_PICKER.select('nocny-targ'));await page.waitForTimeout(350);
   await page.screenshot({path:out+'/'+size+'-'+language+'-default.png'});const view={size,language,layout:await layout(page),categories:[],previews:[]};
   for(const category of ['all','city','nature','fantasy','industry']){
    await page.locator('[data-category='+category+']').tap();await page.waitForTimeout(320);view.categories.push({category,...await layout(page)});await page.screenshot({path:out+'/'+size+'-'+language+'-category-'+category+'.png'});
   }
   for(const key of keys){
    await page.evaluate(key=>BRAX_ARENA_PICKER.select(key),key);await page.waitForFunction(key=>BRAX_ARENA_PICKER.report().selection===key&&BRAX_ARENA_PICKER.report().moving,key);await page.waitForTimeout(320);
    const before=await page.locator('#arenaBackground .arena-scene:last-child video').evaluate(v=>v.currentTime);await page.waitForTimeout(120);const after=await page.locator('#arenaBackground .arena-scene:last-child video').evaluate(v=>v.currentTime);assert.notEqual(before,after,key+' moving preview');assert((await page.evaluate(()=>BRAX_ARENA_PICKER.report().preloaded.length))<=3);await layout(page);view.previews.push({key,moves:true});
    if(['funfair','clocktower','mine'].includes(key)){await page.locator('#arena-'+key).scrollIntoViewIfNeeded();await page.screenshot({path:out+'/'+size+'-'+language+'-'+key+'.png'});}
   }
   await page.evaluate(()=>BRAX_ARENA_PICKER.select('nocny-targ'));await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+50));const ring=await page.locator('#arenaConfirm').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:ring.x+ring.width/2,y:ring.y+ring.height/2}]});await page.clock.runFor(250);view.progress=await page.evaluate(()=>BRAX_ARENA_PICKER.report().progress);assert(view.progress>.35&&view.progress<.7);await page.screenshot({path:out+'/'+size+'-'+language+'-hold.png'});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.clock.runFor(250);assert.equal(await page.evaluate(()=>BRAX_ARENA_PICKER.report().progress),0);await page.clock.resume();
   report.views.push(view);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>[...BRAX_I18N.missingKeys]),[]);await context.close();console.log('PASS '+size+' PL/EN, 17 real moving previews, all categories, hold, safe areas and overlaps');
 }
 report.status='passed';
}catch(e){report.status='failed';report.error=e.message;process.exitCode=1;console.error(e);}
finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
