// Play every full-quality arena through the real two-decoder media adapter for 3 cycles.
// Record the complete playback for visual review; no combat or production API writes.
import fs from 'node:fs';
import {launch} from './ui-browser-harness.mjs';
import assert from 'node:assert/strict';
const base=process.env.BRAX_URL||'http://localhost:8787',out=process.argv[2]||'/tmp/arena-loop-review';
fs.mkdirSync(out+'/playback',{recursive:true});
const rows=JSON.parse(fs.readFileSync('arena-media/manifest.json')),browser=await launch(),results=[];
let next=0;
async function worker(){
 while(next<rows.length){const row=rows[next++];
  const context=await browser.newContext({viewport:{width:640,height:360},recordVideo:{dir:out+'/playback',size:{width:640,height:360}}}),page=await context.newPage(),errors=[];
  try{
   await page.route('**/loop-review',route=>route.fulfill({contentType:'text/html',body:'<style>html,body{margin:0;background:#000;overflow:hidden}#stage{position:relative;width:640px;height:360px}video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}#label{position:absolute;bottom:8px;left:10px;z-index:5;color:white;font:12px Arial;text-shadow:0 1px 3px black}</style><div id="stage"><video id="arenaMotion" muted playsinline loop></video><span id="label"></span></div><script src="/assets/arena-media.js"></script>'}));
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto(base+'/loop-review');
   await page.evaluate(async row=>{document.getElementById('label').textContent=row.label+' · 3 KOLEJNE PĘTLE';const video=document.getElementById('arenaMotion');video.muted=true;await BRAX_ARENA_MEDIA.prepare('/api/arena-media/'+row.file,video);BRAX_ARENA_MEDIA.sound(0,true);await BRAX_ARENA_MEDIA.resume();},row);
   await page.waitForFunction(()=>BRAX_ARENA_MEDIA.report().loop?.switches>=3,null,{timeout:Math.ceil(row.duration*4000+12000)});
   const state=await page.evaluate(()=>{const video=BRAX_ARENA_MEDIA.current(),canvas=document.createElement('canvas');canvas.width=160;canvas.height=90;const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0,160,90);const data=ctx.getImageData(0,0,160,90).data;let sum=0;for(let i=0;i<data.length;i+=4)sum+=data[i]+data[i+1]+data[i+2];return {...BRAX_ARENA_MEDIA.report(),playing:!video.paused,mean:sum/(160*90*3)};});
   assert.equal(state.loop.fallbacks,0);assert(state.playing&&state.mean>2,'decoded nonblank video');assert.deepEqual(errors,[]);
   await page.screenshot({path:out+'/'+row.id+'-after-three-loops.png'});await page.evaluate(()=>BRAX_ARENA_MEDIA.release());
   results.push({id:row.id,cycles:3,...state,errors});console.log('PASS 3 cycles',row.id);
   const video=page.video();await context.close();await video.saveAs(out+'/playback/'+row.id+'-three-cycles.webm');
  }catch(error){results.push({id:row.id,error:String(error),errors});await context.close();throw error;}
 }
}
try{await Promise.all([worker(),worker(),worker()]);}
finally{fs.writeFileSync(out+'/playback-report.json',JSON.stringify(results,null,2));await browser.close();}
