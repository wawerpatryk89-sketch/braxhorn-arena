// Real guest entry, real selected fighters and real media. No model or image substitutes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=process.env.BRAX_URL||'http://localhost:8792',out=process.argv[2]||'docs/verification/arena-live/received-fights';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BRAX_CHROMIUM_PATH||'/usr/lib/chromium/chromium',args:['--autoplay-policy=user-gesture-required','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const key of ['clocktower','funfair','mine']){
  const context=await browser.newContext({viewport:{width:915,height:412},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await context.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
  try{
   await page.goto(base,{waitUntil:'load'});await page.waitForFunction(()=>!!window.BRAX_ACCOUNT);await page.evaluate(()=>BRAX_ACCOUNT.ready);await page.locator('#accountGuest').tap();await page.locator('#startFilmSkip').tap();await page.locator('#matchSetup:not(.off)').waitFor();
   await page.locator('#modePlay').tap();await page.locator('#modeSettings:not(.off)').waitFor();await page.locator('#setupNext').tap();await page.locator('#selection:not(.off)').waitFor();await page.locator('#rosterCarousel .rc-focused').tap();await page.locator('#rosterCarousel .rc-focused').tap();
   await page.locator('#arenaSelection:not(.off)').waitFor({timeout:60000});await page.waitForFunction(()=>!document.getElementById('sceneFade').classList.contains('busy'));
   await page.evaluate(key=>{BRAX_ARENA_PICKER.select(key);window.launchAudit={clicks:0,flash:false,vsSeen:false};document.getElementById('arena-'+key).addEventListener('click',()=>launchAudit.clicks++);function frame(){const vs=document.querySelector('.ui-vs'),arena=document.getElementById('arenaSelection'),fade=document.getElementById('sceneFade');if(vs)launchAudit.vsSeen=true;if(launchAudit.vsSeen&&!vs&&!arena.classList.contains('off')&&Number(getComputedStyle(fade).opacity)<.99)launchAudit.flash=true;if(!window.__BRAX_PROOF__?.state().running)requestAnimationFrame(frame);}requestAnimationFrame(frame);},key);
   await page.waitForFunction(()=>BRAX_ARENA_PICKER.report().moving);const cdp=await context.newCDPSession(page),box=await page.locator('#arenaConfirm').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});await page.waitForTimeout(650);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForFunction(()=>window.__BRAX_PROOF__?.state().running,null,{timeout:60000});const audit=await page.evaluate(()=>({...launchAudit,selected:__BRAX_PROOF__.selectedArena(),media:BRAX_ARENA_MEDIA.report(),controls:!!document.getElementById('controls')}));assert.equal(audit.selected,key);assert.equal(audit.clicks,1);assert(audit.vsSeen&&!audit.flash);assert(audit.controls);assert(audit.media.source.includes('/'+key+'.'));
   await page.waitForFunction(()=>!document.getElementById('sceneFade').classList.contains('busy'));
   if(await page.locator('#filmSkip').isVisible())await page.locator('#filmSkip').tap({timeout:1500}).catch(error=>{if(!error.message.includes('Timeout'))throw error;});
   await page.waitForFunction(()=>!__BRAX_PROOF__.state().cinematic,null,{timeout:15000});
   if(await page.locator('#fighterHelp:not(.off)').isVisible())await page.locator('#helpContinue').tap();
   await page.waitForFunction(()=>BRAX_ARENA_MEDIA.current()?.currentTime>.15,null,{timeout:15000});await page.screenshot({path:out+'/'+key+'-running.png'});assert.deepEqual(errors,[]);results.push({key,status:'passed',...audit,errors});console.log('PASS real fight entry '+key);
  }catch(error){await page.screenshot({path:out+'/'+key+'-failure.png'});results.push({key,status:'failed',error:error.message,errors});throw error;}
  finally{await context.close();}
 }
}finally{fs.writeFileSync(out+'/report.json',JSON.stringify({published:false,modelsStubbed:false,imagesStubbed:false,limitations:['Local Chromium emulation and software WebGL; no physical phone test.'],results},null,2)+'\n');await browser.close();}
