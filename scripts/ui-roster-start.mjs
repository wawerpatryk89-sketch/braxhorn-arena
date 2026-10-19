// Exercise direct card selection through the real lazy combat loader and local API.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,phone,swipe} from './ui-browser-harness.mjs';
const out=process.argv[2]||'/tmp/braxhorn-roster-start',base=process.env.BRAX_URL||'http://localhost:8787/';
fs.mkdirSync(out,{recursive:true});
const browser=await launch(),results=[];
try{
 for(const mode of ['fight','tournament']){
  const {page,context}=await phone(browser,'844x390',{stubModels:true});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#rosterCarousel',{state:'attached'});
  await page.waitForFunction(()=>typeof window.BRAX_LOAD_MULTIPLAYER==='function');
  await page.evaluate(()=>{document.getElementById('start').classList.add('off');document.getElementById('matchSetup').classList.remove('off');});
  const modeId=mode==='tournament'?'tournamentMode':'fightMode';
  for(let i=0;i<8&&!await page.locator('#'+modeId).evaluate(card=>card.classList.contains('mode-focused'));i++)await swipe(page,'#matchSetup .mode-card-row');
  await page.locator('#modePlay').tap();
  assert.equal(await page.evaluate(()=>BRAX_ROSTER.state().mode),mode,'The real mode launcher selects the requested mode');
  await page.locator('#setupNext').tap();
  await page.locator('#rosterCarousel .rc-neighbor[data-index="1"]').tap();
  if(mode==='fight'){
   assert.equal(await page.evaluate(()=>BRAX_ROSTER.state().role),'opponent');
   // Confirm a different opponent immediately, even while the hidden portrait decodes.
   await page.locator('#rosterCarousel .rc-neighbor[data-index="2"]').tap();
  }
  await page.waitForSelector(mode==='fight'?'#arenaSelection:not(.off)':'#campaignScreen:not(.off)',{timeout:20000}).catch(async error=>{
   await page.screenshot({path:out+'/roster-start-'+mode+'-failure.png'});
   console.log('Selection failure',JSON.stringify({mode,errors:page.errors,state:await page.evaluate(()=>({roster:BRAX_ROSTER.state(),boot:window.BRAX_BOOT,engine:window.BRAX_ENGINE_READY,proof:window.__BRAX_PROOF__?.state(),hint:document.getElementById('rosterInstruction').textContent}))}));
   throw error;
  });
  assert.deepEqual(await page.evaluate(()=>({slot:BRAX_BOOT.slot,mode:BRAX_BOOT.mode})),{slot:1,mode});
  if(mode==='fight')assert.equal(await page.evaluate(()=>BRAX_ROSTER.opponent),'VEXA');
  assert.deepEqual(page.errors.filter(error=>!error.includes('Failed to load resource')),[]);
  await page.screenshot({path:out+'/roster-start-'+mode+'.png'});
  if(mode==='tournament'){
   assert.equal(await page.evaluate(()=>{const run=BRAX_CHAMPIONSHIP.create('tournament','NYXA',['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'],()=>.4);run.next();const before=JSON.stringify(run);BRAX_CHAMPIONSHIP.tournamentView(run);return JSON.stringify(run)===before;}),true,'Previewing the bracket must not advance matches');
   const tree=page.locator('#campaignBracket .tournament-tree');
   assert.equal(await tree.locator('.bracket-match').count(),7);
   assert.equal(await tree.locator('.bracket-connector').count(),6);
   assert.equal(await tree.locator('image[href*="campaign-portraits"]').count(),0,'The bracket uses the same unframed portraits as selection');
   assert.ok(await tree.locator('image[href*="roster-art"]').count()>=8);
   assert.equal(await tree.evaluate(svg=>{const box=svg.getBoundingClientRect();return [...svg.querySelectorAll('.bracket-match>rect')].every(node=>{const r=node.getBoundingClientRect();return r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom;});}),true,'Every round, including the final, fits the screen');
  }
  if(mode==='fight'){
   await page.locator('#backFighter').tap();
   await page.waitForSelector('#selection:not(.off)');
   await page.locator('#rosterPlayer').tap();
   await page.locator('#rosterCarousel .rc-neighbor[data-index="2"]').tap();
   await page.locator('#rosterCarousel .rc-neighbor[data-index="3"]').tap();
   await page.waitForSelector('#arenaSelection:not(.off)');
   assert.equal(await page.evaluate(()=>__BRAX_PROOF__.selectedSlot()),2);
   assert.equal(await page.evaluate(()=>BRAX_ROSTER.opponent),'KROV');
  }
  results.push({mode,player:'NYXA',opponent:mode==='fight'?'VEXA':'automatic',cardTapStarts:true,nextScreen:mode==='fight'?'arenaSelection':'campaignScreen'});
  console.log('PASS direct card selection starts '+mode);
  await context.close();
 }
 fs.writeFileSync(out+'/roster-start-report.json',JSON.stringify(results,null,2));
}finally{await browser.close();}
