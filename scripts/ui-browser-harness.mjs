// Shared Playwright helpers for phone-sized browser checks against scripts/local-server.mjs.
// Missing binary media (not in Git) are replaced by neutral placeholders; when the 3D models are
// absent, fighters are loaded from config metadata only, so menus, HUD and online flow still run.
import {createRequire} from 'node:module';
// CommonJS require honours NODE_PATH, where Playwright is installed globally.
const {chromium}=createRequire(import.meta.url)('playwright');
import fs from 'node:fs';

export const PHONES={'844x390':{width:844,height:390},'915x412':{width:915,height:412},'932x430':{width:932,height:430}};
const GRAY_PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mNkYGD4z8DAwMDAxMDAAAAPPwEBbSIvyQAAAABJRU5ErkJggg==','base64');
const STUB=`import * as real from '/assets/fighter-source-real.js';
export * from '/assets/fighter-source-real.js';
const stub=m=>({...m,ready:true,render(){},dispose(){},portrait(){return null;}});
export async function preparePair(names){for(const who of names.filter(Boolean))window[who+'_3D']=stub(await real.prepareMetadata(who));}
export async function prepareSource(who){return stub(await real.prepareMetadata(who));}`;

export async function launch(){return chromium.launch({...(process.env.BRAX_CHROMIUM_PATH?{executablePath:process.env.BRAX_CHROMIUM_PATH}:{}),args:['--autoplay-policy=user-gesture-required']});}

export async function phone(browser,size='844x390',{stubModels=true}={}){
 const context=await browser.newContext({viewport:PHONES[size],deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'});
 await context.route(/\.(webp|png|jpe?g|gif)(\?|$)/i,async route=>{const r=await route.fetch().catch(()=>null);if(r&&r.ok())return route.fulfill({response:r});return route.fulfill({status:200,contentType:'image/png',body:GRAY_PNG});});
 if(stubModels){
  await context.route(/\/assets\/fighter-source\.js(\?|$)/,route=>route.fulfill({status:200,contentType:'text/javascript',body:STUB}));
  await context.route(/\/assets\/fighter-source-real\.js(\?|$)/,async route=>route.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync('game/assets/fighter-source.js')}));
 }
 const page=await context.newPage();page.errors=[];
 page.on('pageerror',e=>page.errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')page.errors.push(m.text());});
 return {context,page};
}

// Tap the centre of a visible element (real touch input, like a phone).
export async function tap(page,selector){const box=await page.locator(selector).first().boundingBox();if(!box)throw Error('not visible: '+selector);await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(250);}
const touchSessions=new WeakMap();
export async function swipe(page,selector,direction=-1){
 const box=await page.locator(selector).first().boundingBox();if(!box)throw Error('not visible: '+selector);
 let session=touchSessions.get(page);if(!session){session=await page.context().newCDPSession(page);touchSessions.set(page,session);}
 const x=box.x+box.width*.5,y=box.y+box.height*.45,distance=Math.min(140,box.width*.25);
 // Chromium's native gesture completes without a fling swallowing the next tap.
 await session.send('Input.synthesizeScrollGesture',{x,y,xDistance:direction*distance,yDistance:0,gestureSourceType:'touch',speed:600,preventFling:true});
 await page.waitForTimeout(320);
}
export const visible=(page,selector)=>page.locator(selector).first().isVisible().catch(()=>false);

// Elements that overlap each other although both are visible and interactive.
export async function overlaps(page){return page.evaluate(()=>{
 // Only elements the player can actually see on top: a screen covered by a modal or by the next
 // screen is not an overlap problem. An element counts when any of 5 probe points hits it.
 const onTop=e=>{const r=e.getBoundingClientRect();return [[.5,.5],[.15,.5],[.85,.5],[.5,.2],[.5,.8]].some(([x,y])=>{const px=r.left+r.width*x,py=r.top+r.height*y;if(px<0||py<0||px>=innerWidth||py>=innerHeight)return false;const t=document.elementFromPoint(px,py);return t&&(t===e||e.contains(t)||t.contains(e));});};
 const els=[...document.querySelectorAll('button,a,[role=button],input,select,h1,h2,h3,label')].filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>.05&&r.width>4&&r.height>4&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight&&!e.closest('.off,[hidden]')&&(onTop(e)||r.left<-2||r.top<-2||r.right>innerWidth+2||r.bottom>innerHeight+2);});
 const name=e=>e.id?'#'+e.id:(e.className&&typeof e.className==='string'?e.tagName.toLowerCase()+'.'+e.className.split(' ')[0]:e.tagName.toLowerCase())+'«'+(e.textContent||'').trim().slice(0,18)+'»';
 // Visible box: headings and labels by their text (a centred block title is mostly empty space),
 // everything clipped by overflow ancestors (arena strips, scroll lists).
 const box=e=>{let r=e.getBoundingClientRect();if(/^(H1|H2|H3|LABEL)$/.test(e.tagName)){const rects=[],walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(!node.textContent.trim())continue;const owner=node.parentElement;if(owner.closest('button,a,[role=button],input,select,option')||owner.closest('[hidden],.off'))continue;const g=document.createRange();g.selectNodeContents(node);for(const t of g.getClientRects())if(t.width>0&&t.height>0)rects.push(t);}if(rects.length)r={left:Math.min(...rects.map(t=>t.left)),top:Math.min(...rects.map(t=>t.top)),right:Math.max(...rects.map(t=>t.right)),bottom:Math.max(...rects.map(t=>t.bottom))};}let L=r.left,T=r.top,R=r.right,B=r.bottom;for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(s.overflowX!=='visible'||s.overflowY!=='visible'){const c=p.getBoundingClientRect();L=Math.max(L,c.left);T=Math.max(T,c.top);R=Math.min(R,c.right);B=Math.min(B,c.bottom);}}return {left:L,top:T,right:R,bottom:B};};
 const out=[];for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i],b=els[j];if(a.contains(b)||b.contains(a))continue;const r=box(a),q=box(b),w=Math.min(r.right,q.right)-Math.max(r.left,q.left),h=Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top);if(w>6&&h>6){const top=document.elementFromPoint(Math.max(r.left,q.left)+w/2,Math.max(r.top,q.top)+h/2);out.push({a:name(a),b:name(b),area:Math.round(w*h),top:top?name(top):null});}}
 // Content scrolled inside its own scroll box (arena strips, long lists) is reachable, not cut off.
 const scrolled=e=>{for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(/(auto|scroll)/.test(s.overflowX+s.overflowY)&&(p.scrollWidth>p.clientWidth+1||p.scrollHeight>p.clientHeight+1))return true;}return false;};
 const offscreen=els.filter(e=>{const r=e.getBoundingClientRect();return (r.left<-2||r.top<-2||r.right>innerWidth+2||r.bottom>innerHeight+2)&&!scrolled(e);}).map(e=>name(e));
 return {overlaps:out.sort((x,y)=>y.area-x.area).slice(0,12),offscreen};
});}
