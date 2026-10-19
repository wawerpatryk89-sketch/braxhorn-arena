import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {overlaps} from './ui-browser-harness.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=process.env.BRAX_URL||'http://localhost:8791',out=process.argv[2]||'docs/verification/fullscreen-158';fs.mkdirSync(out,{recursive:true});
const report={status:'running',base,views:[],limitations:['Chromium viewport emulation; no physical iPhone, Android or Safari test.','Fixed viewport checks simulate the fullscreen API; a separate native Chromium check is recorded.']};
const browser=await chromium.launch({executablePath:'/usr/lib/chromium/chromium',args:['--autoplay-policy=user-gesture-required']});
async function fullRect(page,selector){return page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,viewportWidth:innerWidth,viewportHeight:innerHeight};});}
function assertFull(rect){assert(Math.abs(rect.x)<1&&Math.abs(rect.y)<1&&Math.abs(rect.width-rect.viewportWidth)<1&&Math.abs(rect.height-rect.viewportHeight)<1,JSON.stringify(rect));}
try{
 for(const [width,height] of [[844,390],[915,412],[932,430],[1280,720],[1900,1000]]){
  const size=width+'x'+height,context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await context.addInitScript(()=>{window.__fullscreenRequests=[];Element.prototype.requestFullscreen=function(options){__fullscreenRequests.push({id:this.tagName,options});return Promise.resolve();};});
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:width<1000?{top:0,left:34,right:22,bottom:12}:{top:0,left:0,right:0,bottom:0}});
  await page.goto(base,{waitUntil:'load'});await page.waitForFunction(()=>!!window.BRAX_ACCOUNT);await page.evaluate(()=>BRAX_ACCOUNT.ready);await page.waitForFunction(()=>!document.documentElement.classList.contains('account-boot-pending'));
  const login=await fullRect(page,'#accountEntry');assertFull(login);assertFull(await fullRect(page,'#game'));const art=await page.locator('.account-reference').evaluate(e=>{const r=e.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight};});assert(art.left<=.1&&art.top<=.1&&art.right>=art.width-.1&&art.bottom>=art.height-.1,'login artwork must cover all four viewport edges');assert((await page.locator('#accountEntry').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('account-login-reference.jpg'));assert.deepEqual(await overlaps(page),{overlaps:[],offscreen:[]});await page.screenshot({path:out+'/'+size+'-login.png'});
  await page.locator('#accountGuest').tap();await page.waitForFunction(()=>document.getElementById('startVideo')?.currentTime>2);
  const movie=await page.locator('#startVideo').evaluate(video=>{const s=getComputedStyle(video),r=video.getBoundingClientRect(),scale=Math.max(r.width/video.videoWidth,r.height/video.videoHeight);return{src:video.getAttribute('src'),fit:s.objectFit,width:r.width,height:r.height,videoWidth:video.videoWidth,videoHeight:video.videoHeight,drawWidth:video.videoWidth*scale,drawHeight:video.videoHeight*scale,playing:!video.paused,currentTime:video.currentTime};});
  assertFull(await fullRect(page,'#startFilm'));assertFull(await fullRect(page,'#startVideo'));assert.equal(movie.fit,'cover');assert.equal(movie.src,'/assets/start-intro-20261007.mp4');assert(movie.drawWidth>=width-.1&&movie.drawHeight>=height-.1);assert(movie.playing);assert.equal(movie.videoWidth,910);assert.equal(movie.videoHeight,512);assert.deepEqual(await overlaps(page),{overlaps:[],offscreen:[]});await page.screenshot({path:out+'/'+size+'-original-film.png'});
  assert((await page.evaluate(()=>__fullscreenRequests)).some(r=>r.id==='HTML'&&r.options.navigationUI==='hide'),'guest button requests document fullscreen');
  await page.locator('#startFilmSkip').tap();await page.waitForFunction(()=>!BRAX_START_FILM.active);await page.locator('#matchSetup:not(.off)').waitFor();const menu=await fullRect(page,'#matchSetup');assertFull(menu);await page.screenshot({path:out+'/'+size+'-menu.png'});
  await page.locator('#modePlay').tap();await page.locator('#modeSettings:not(.off)').waitFor();assertFull(await fullRect(page,'#modeSettings'));await page.screenshot({path:out+'/'+size+'-mode-settings.png'});
  const otherVideos=await page.locator('#fighterFilm,#victoryVideo').evaluateAll(videos=>videos.map(v=>({id:v.id,fit:getComputedStyle(v).objectFit})));assert(otherVideos.every(v=>v.fit==='cover'));assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>[...BRAX_I18N.missingKeys]),[]);
  report.views.push({size,login,movie,menu,otherVideos,errors});await context.close();console.log('PASS full viewport '+size+' login / original film / menu / settings / all cinematic cover modes');
 }
 const context=await browser.newContext({viewport:{width:915,height:412},hasTouch:true}),page=await context.newPage();await page.goto(base,{waitUntil:'load'});await page.waitForFunction(()=>!!window.BRAX_ACCOUNT);await page.evaluate(()=>BRAX_ACCOUNT.ready);await page.locator('#accountGuest').tap();await page.waitForFunction(()=>document.fullscreenElement===document.documentElement);await page.waitForFunction(()=>document.getElementById('startVideo').currentTime>.3);report.nativeChromiumFullscreen={entered:true,moviePlaying:true,game:await fullRect(page,'#game')};assertFull(report.nativeChromiumFullscreen.game);await page.screenshot({path:out+'/chromium-native-fullscreen-film.png'});await context.close();
 report.status='passed';
}catch(error){report.status='failed';report.error=error.message;console.error(error);process.exitCode=1;}
finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
