/* Pose-only replay: no physics, input, damage, score writes or frame images. */
(()=>{'use strict';
const t=(key,fallback)=>window.BRAX_I18N?.t('combatAux.'+key)??fallback;
function interpolateFrame(a,b,t){
 if(!b||b.time<=a.time)return a;
 const u=Math.max(0,Math.min(1,(t-a.time)/(b.time-a.time))),mix=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)?x+(y-x)*u:x;
 return {...a,time:t,actors:a.actors.map((actor,i)=>{
  const next=b.actors[i];
  // Discrete action/side changes and looping clips keep their original boundary.
  if(!next||actor.character!==next.character||actor.face!==next.face)return actor;
  const sameClip=actor.config?.asset===next.config?.asset&&next.frame>=actor.frame;
  const f={...actor};for(const key of ['x','width','height','pivot','anchor','floor','clock'])f[key]=mix(actor[key],next[key]);
  if(!sameClip)return actor;
  f.frame=mix(actor.frame,next.frame);
  if(actor.head&&next.head)f.head={...actor.head,x:mix(actor.head.x,next.head.x),y:mix(actor.head.y,next.head.y)};
  return f;
 })};
}
function create({render,sound=()=>{},view,background,canvas,overlay,skip,label,now=()=>performance.now(),reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches}){
 let frames=[],marked=null,last=-Infinity,active=false,elapsed=0,done=null,clip=[],surfaces=null,soundIndex=-1,pendingSounds=[];
 function renderText(){overlay.setAttribute?.('aria-label',t('replay.label','Powtórka nokautu'));label.textContent=t('replay.decisiveBlow','DECYDUJĄCY CIOS');}
 const clear=()=>{frames=[];marked=null;last=-Infinity;pendingSounds=[];};
 function finish(){if(!active)return;active=false;overlay.classList.add('off');clip=[];if(surfaces){for(const s of surfaces)s.canvas.width=s.canvas.height=1;surfaces=null;}canvas.width=canvas.height=1;const cb=done;done=null;clear();cb?.();}
 function cancel(){done=null;finish();clear();}
 function capture(actors,effects={}){if(active||reduced())return;pendingSounds.push(...effects.sounds||[]);const time=effects.force?Math.max(now(),last+.001):now();if(marked!==null&&time>marked+1200||!effects.force&&time-last<15)return;last=time;frames.push({time,actors,effects:{...effects,sounds:pendingSounds},size:view()});pendingSounds=[];while(frames.length>240||frames[0]?.time<time-3600)frames.shift();}
 function mark(){if(marked===null)marked=now();}
 function paint(frame){const size=view(),w=Math.max(1,Math.min(1280,size.width)),h=Math.max(1,Math.round(w*size.height/size.width));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}const ctx=canvas.getContext('2d'),sx=w/frame.size.width,sy=h/frame.size.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#040706';ctx.fillRect(0,0,w,h);
 const a=frame.actors;ctx.save(); // Original arena framing throughout; no zoom or portrait cuts.
 const bg=background(),bw=bg?.videoWidth||bg?.naturalWidth,bh=bg?.videoHeight||bg?.naturalHeight;if(bw&&bh){const cover=Math.max(w/bw,h/bh);try{ctx.drawImage(bg,(w-bw*cover)/2,(h-bh*cover)/2,bw*cover,bh*cover);}catch{}}
 window.BRAX_BLOOD?.paintFloor(ctx,frame.effects?.stains,w,h);
 for(let i=0;i<a.length;i++){const f=a[i],surface=surfaces[i];render(f,surface.ctx);const fw=f.width*sx,fh=f.height*sy,x=f.x*w+(f.face<0?f.pivot-f.width:-f.pivot)*sx,y=f.floor*sy-f.anchor*sy;ctx.save();if(f.face<0){ctx.translate(x+fw,y);ctx.scale(-1,1);ctx.drawImage(surface.canvas,0,0,fw,fh);}else ctx.drawImage(surface.canvas,x,y,fw,fh);ctx.restore();window.BRAX_BLOOD?.wound(ctx,f,sx,sy,w);}window.BRAX_BLOOD?.paintParticles(ctx,frame.effects?.particles,sx,sy);ctx.restore();}
 function play(callback){if(active||reduced()||marked===null)return false;clip=frames.filter(f=>f.time>=marked-850&&f.time<=marked+1200);if(clip.length<3)return false;surfaces=[0,1].map(()=>{const c=document.createElement('canvas');c.width=1024;c.height=640;return{canvas:c,ctx:c.getContext('2d')};});active=true;elapsed=0;soundIndex=-1;done=callback;renderText();overlay.classList.remove('off');skip.focus?.();try{paint(clip[0]);}catch{finish();}return true;}
 // Ramp into the confirmed contact, then let the fall regain its weight.
 function playbackRate(time){const offset=time-marked,smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  if(offset<-240)return .9;
  if(offset<0)return .9-(.9-.28)*smooth((offset+240)/240);
  if(offset<160)return .28;
  return .28+.72*smooth((offset-160)/440);
 }
 function step(dt){if(!active)return;if(reduced()){finish();return;}
  let remaining=Math.max(0,Math.min(100,dt));while(remaining>0){const chunk=Math.min(remaining,8);elapsed+=chunk*playbackRate(clip[0].time+elapsed);remaining-=chunk;}
  const time=clip[0].time+elapsed;if(time>=clip.at(-1).time){while(soundIndex<clip.length-1){soundIndex++;for(const e of clip[soundIndex].effects?.sounds||[])sound(e);}finish();return;}
  let index=0;while(index+1<clip.length&&clip[index+1].time<=time)index++;
  while(soundIndex<index){soundIndex++;for(const e of clip[soundIndex].effects?.sounds||[])sound(e);}
  const frame=interpolateFrame(clip[index],clip[index+1],time);try{paint(frame);}catch{finish();}
 }
 window.BRAX_I18N?.onChange(()=>{if(active)renderText();});
 skip.addEventListener('click',finish);return{capture,mark,play,step,cancel,clear,get active(){return active;},get samples(){return frames.length;}};
}
window.BRAX_REPLAY={create,interpolateFrame};
})();
