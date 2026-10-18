/* Load only the selected remote arena. Original videos live in R2, not this build. */
(function(root){
 'use strict';
 let controller=null,blobURL=null,source=null,video=null,generation=0,looper=null;
 const panel=()=>document.getElementById('arenaLoadPanel');
 function status(value,text){const p=panel();if(!p)return;p.classList.remove('off');const bar=p.querySelector('progress');if(value===null)bar.removeAttribute('value');else bar.value=value;p.querySelector('[role=status]').textContent=text;}
 function hide(){panel()?.classList.add('off');}
 function release(){looper?.destroy();looper=null;generation++;controller?.abort();controller=null;if(video&&blobURL){video.pause();video.removeAttribute('src');video.load?.();}if(blobURL)URL.revokeObjectURL(blobURL);blobURL=null;source=null;video=null;hide();}
 async function prepare(url,target){
  if(!url?.startsWith('/api/arena-media/'))return;
  if(source===url&&blobURL&&video===target)return;
  release();const current=generation;controller=new AbortController();const signal=controller.signal;
  // A stalled transfer must offer retry instead of leaving the player waiting forever.
  let watchdog=setTimeout(()=>controller?.abort(),30000);
  const touch=()=>{clearTimeout(watchdog);watchdog=setTimeout(()=>controller?.abort(),30000);};
  status(0,'ŁADOWANIE ARENY · 0%');
  try{
   const response=await fetch(url,{signal,cache:'force-cache'});
   if(!response.ok)throw Error('ARENA_MEDIA: '+response.status);
   const total=Number(response.headers.get('Content-Length'))||0;
   const chunks=[];let loaded=0;
   if(response.body?.getReader){const reader=response.body.getReader();while(true){const {done,value}=await reader.read();if(done)break;touch();loaded+=value.byteLength;chunks.push(value);if(loaded>24*1024*1024)throw Error('ARENA_MEDIA: size');const pct=total?Math.min(99,Math.round(loaded/total*100)):null;status(pct,pct===null?'ŁADOWANIE ARENY…':'ŁADOWANIE ARENY · '+pct+'%');}}
   else chunks.push(await response.arrayBuffer());
   if(signal.aborted||current!==generation)throw new DOMException('Cancelled','AbortError');
   source=url;video=target;blobURL=URL.createObjectURL(new Blob(chunks,{type:'video/mp4'}));
   target.preload='auto';target.loop=true;target.playsInline=true;
   await new Promise((resolve,reject)=>{
    const cleanup=()=>{target.removeEventListener('loadeddata',ok);target.removeEventListener('error',fail);signal.removeEventListener('abort',abort);};
    const ok=()=>{cleanup();resolve();},fail=()=>{cleanup();reject(Error('ARENA_MEDIA: decode'));},abort=()=>{cleanup();reject(new DOMException('Cancelled','AbortError'));};
    target.addEventListener('loadeddata',ok,{once:true});target.addEventListener('error',fail,{once:true});signal.addEventListener('abort',abort,{once:true});
    target.src=blobURL;target.load();
   });
   looper=createLooper(target);
   hide();
  }catch(error){const cancelled=current!==generation;if(!cancelled)release();if(cancelled)throw new DOMException('Cancelled','AbortError');throw Error('ARENA_MEDIA: '+error.message);}
  finally{clearTimeout(watchdog);}
 }
 // Two decoders share one downloaded Blob. Start the next cycle before EOF;
 // the outgoing picture stays visible until the incoming decoder is playing.
 function createLooper(first){
  if(!document.createElement||!first.parentNode||!root.requestAnimationFrame)return null;
  const second=document.createElement('video');second.setAttribute('aria-hidden','true');second.playsInline=true;second.setAttribute('webkit-playsinline','');second.preload='auto';second.loop=true;second.src=first.src;
  second.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:0;pointer-events:none;opacity:0;display:none';first.parentNode.insertBefore(second,first.nextSibling);second.load();
  const pair=[first,second],overlap=.12;let active=0,frame=0,running=false,pending=false,blending=false,blendStart=0,switches=0,fallbacks=0,volume=first.volume,muted=first.muted;
  function sound(v,m){volume=v;muted=m;for(const item of pair)item.muted=m;if(!blending)pair[active].volume=v;}
  function schedule(){if(running)frame=root.requestAnimationFrame(tick);}
  function tick(){
   if(!running)return;const a=pair[active],b=pair[1-active];
   if(blending){const mix=Math.min(1,Math.max(0,b.currentTime/overlap));a.style.opacity='1';b.style.opacity=String(mix);a.volume=volume*(1-mix);b.volume=volume*mix;
    if(mix>=1||a.ended||a.currentTime<blendStart){a.pause();a.style.opacity='0';a.currentTime=0;active=1-active;blending=false;pair[active].volume=volume;switches++;}
   }else if(!pending&&a.duration>overlap&&a.duration-a.currentTime<=overlap&&b.readyState>=2){
    pending=true;a.style.zIndex='0';b.style.zIndex='1';b.currentTime=0;b.volume=0;b.muted=muted;b.style.display='block';
    Promise.resolve(b.play()).then(()=>{pending=false;if(!running){b.pause();return;}blendStart=a.currentTime;blending=true;}).catch(()=>{pending=false;fallbacks++;});
   }
   schedule();
  }
  function pause(){running=false;root.cancelAnimationFrame(frame);for(const item of pair)item.pause();}
  function resume(){if(running)return Promise.resolve();running=true;pair[active].style.display='block';pair[active].style.opacity='1';const tasks=[pair[active].play()];if(blending)tasks.push(pair[1-active].play());schedule();return Promise.all(tasks).catch(error=>{pause();throw error;});}
  function destroy(){pause();first.style.opacity='';first.style.display='';first.style.zIndex='';second.removeAttribute('src');second.load();second.remove();}
  return{resume,pause,sound,destroy,current:()=>pair[active],report:()=>({switches,fallbacks,overlapMs:overlap*1000,decoders:2})};
 }
 let resumeAfterPageShow=false;
 root.addEventListener('pagehide',event=>{if(!event.persisted){release();return;}resumeAfterPageShow=!!video&&!(looper?.current()||video).paused;if(looper)looper.pause();else video?.pause();});
 root.addEventListener('pageshow',event=>{if(event.persisted&&resumeAfterPageShow){resumeAfterPageShow=false;Promise.resolve(looper?looper.resume():video?.play()).catch(()=>{});}});
 root.BRAX_ARENA_MEDIA={prepare,release,resume:()=>looper?looper.resume():video?.play(),pause:()=>looper?.pause(),sound:(v,m)=>looper?.sound(v,m),current:()=>looper?.current()||video,report:()=>({active:!!blobURL,source,loop:looper?.report()||null})};
})(window);
